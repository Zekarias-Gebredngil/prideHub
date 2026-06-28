import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettlementStatus, BookingStatus, EscrowStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService,
  ) {}

  // ── Scheduled Settlement Processing ───────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processScheduledSettlements() {
    try {
      this.logger.log('Starting scheduled settlement processing...');
      const settings = await this.commissionService.getSettings();

      switch (settings?.settlementFrequency) {
        case 'DAILY':
          await this.runSettlementBatch('DAILY');
          break;
        case 'WEEKLY': {
          const dayOfWeek = new Date().getDay();
          if (dayOfWeek === (settings?.settlementDayOfWeek ?? 1)) {
            await this.runSettlementBatch('WEEKLY');
          }
          break;
        }
        case 'BIWEEKLY': {
          const dayOfMonth = new Date().getDate();
          if (dayOfMonth === 1 || dayOfMonth === 15) {
            await this.runSettlementBatch('BIWEEKLY');
          }
          break;
        }
        case 'MONTHLY': {
          const day = new Date().getDate();
          if (day === (settings?.settlementDayOfMonth ?? 1)) {
            await this.runSettlementBatch('MONTHLY');
          }
          break;
        }
      }

      // Also release matured escrow accounts
      await this.releaseMatureEscrows();
    } catch (err) {
      this.logger.error('Settlement processing failed', err);
    }
  }

  // ── Release escrow accounts past their hold period ─────────────────────────

  async releaseMatureEscrows() {
    const matured = await this.prisma.escrowAccount.findMany({
      where: {
        status: EscrowStatus.HELD,
        releaseAt: { lte: new Date() },
      },
    });

    for (const escrow of matured) {
      try {
        await this.commissionService.releaseEscrow(escrow.bookingId);
        this.logger.log(`Auto-released escrow for booking ${escrow.bookingId}`);
      } catch (err) {
        this.logger.error(`Failed to auto-release escrow ${escrow.id}`, err);
      }
    }

    return { releasedCount: matured.length };
  }

  // ── Create Settlement Batch ────────────────────────────────────────────────

  async runSettlementBatch(frequency: string, adminId?: string) {
    const now = new Date();
    const periodEnd = new Date(now);
    let periodStart: Date;

    switch (frequency) {
      case 'DAILY':
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - 1);
        break;
      case 'WEEKLY':
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - 7);
        break;
      case 'BIWEEKLY':
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - 14);
        break;
      case 'MONTHLY':
      default:
        periodStart = new Date(now);
        periodStart.setMonth(periodStart.getMonth() - 1);
        break;
    }

    // Find completed bookings with unreleased escrow in period
    const completedBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        completedAt: { gte: periodStart, lte: periodEnd },
        escrowAccount: { status: EscrowStatus.HELD },
      },
      include: {
        items: { include: { vendor: true } },
        escrowAccount: true,
        commissions: { where: { status: 'PENDING' } },
      },
    });

    if (completedBookings.length === 0) {
      this.logger.log('No bookings require settlement in this period');
      return { batchNumber: null, message: 'No settlements needed' };
    }

    const batchNumber = `BATCH-${Date.now().toString(36).toUpperCase()}`;

    // Calculate batch totals
    let totalGross = 0;
    let totalCommission = 0;
    let totalPlatformFee = 0;
    let totalNet = 0;

    for (const booking of completedBookings) {
      if (booking.escrowAccount) {
        totalGross += Number(booking.escrowAccount.grossAmount);
        totalCommission += Number(booking.escrowAccount.commissionAmount);
        totalPlatformFee += Number(booking.escrowAccount.platformFeeAmount);
        totalNet += Number(booking.escrowAccount.vendorNetAmount);
      }
    }

    const vendorIds = new Set(
      completedBookings.flatMap((b) => b.items.map((i) => i.vendorId).filter(Boolean)),
    );

    const batch = await this.prisma.settlementBatch.create({
      data: {
        batchNumber,
        frequency: frequency as any,
        periodStart,
        periodEnd,
        totalGrossAmount: totalGross,
        totalCommission,
        totalPlatformFee,
        totalNetPayout: totalNet,
        vendorCount: vendorIds.size,
        bookingCount: completedBookings.length,
        status: SettlementStatus.PROCESSING,
        createdById: adminId,
      },
    });

    // Process each booking
    let processed = 0;
    let failed = 0;

    for (const booking of completedBookings) {
      try {
        const vendorId = booking.items.find((i) => i.vendorId)?.vendorId;
        if (!vendorId || !booking.escrowAccount) continue;

        const settlementNumber = `SETTLE-${Date.now().toString(36).toUpperCase()}-${processed}`;

        await this.prisma.vendorSettlement.create({
          data: {
            settlementNumber,
            batchId: batch.id,
            vendorId,
            bookingId: booking.id,
            grossAmount: booking.escrowAccount.grossAmount,
            commissionAmount: booking.escrowAccount.commissionAmount,
            platformFeeAmount: booking.escrowAccount.platformFeeAmount,
            taxAmount: 0,
            netPayout: booking.escrowAccount.vendorNetAmount,
            status: SettlementStatus.PENDING,
          },
        });

        // Release escrow
        await this.commissionService.releaseEscrow(booking.id, adminId);
        processed++;
      } catch (err) {
        this.logger.error(`Failed to process settlement for booking ${booking.id}`, err);
        failed++;
      }
    }

    // Update batch status
    await this.prisma.settlementBatch.update({
      where: { id: batch.id },
      data: {
        status: failed > 0 ? SettlementStatus.PROCESSING : SettlementStatus.COMPLETED,
        processedAt: new Date(),
        completedAt: failed === 0 ? new Date() : undefined,
      },
    });

    this.logger.log(
      `Settlement batch ${batchNumber}: processed=${processed}, failed=${failed}`,
    );

    return { batchNumber, batch, processed, failed };
  }

  async triggerManualSettlement(adminId: string) {
    return this.runSettlementBatch('MANUAL', adminId);
  }

  // ── Settlement Queries ────────────────────────────────────────────────────

  async getSettlementBatches(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.settlementBatch.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { settlements: true } } },
      }),
      this.prisma.settlementBatch.count(),
    ]);
    return { data, total, page, limit };
  }

  async getBatchDetails(batchId: string) {
    const batch = await this.prisma.settlementBatch.findUnique({
      where: { id: batchId },
      include: {
        settlements: {
          include: {
            booking: {
              select: { bookingNumber: true, eventType: true, eventDate: true },
            },
          },
        },
      },
    });
    if (!batch) throw new NotFoundException('Settlement batch not found');
    return batch;
  }

  async getVendorSettlements(vendorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.vendorSettlement.findMany({
        where: { vendorId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          batch: { select: { batchNumber: true, frequency: true, periodStart: true, periodEnd: true } },
          booking: { select: { bookingNumber: true, eventType: true } },
        },
      }),
      this.prisma.vendorSettlement.count({ where: { vendorId } }),
    ]);
    return { data, total, page, limit };
  }

  async markSettlementPaid(settlementId: string, paymentRef: string, adminId: string) {
    const settlement = await this.prisma.vendorSettlement.findUnique({
      where: { id: settlementId },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');
    if (settlement.status === SettlementStatus.COMPLETED) {
      throw new BadRequestException('Settlement already paid');
    }

    return this.prisma.vendorSettlement.update({
      where: { id: settlementId },
      data: {
        status: SettlementStatus.COMPLETED,
        paidAt: new Date(),
        paymentRef,
      },
    });
  }

  // ── Disputes ──────────────────────────────────────────────────────────────

  async createDispute(dto: {
    bookingId: string;
    initiatedById: string;
    againstId: string;
    type: string;
    reason: string;
    disputedAmount: number;
  }) {
    return this.prisma.dispute.create({
      data: {
        bookingId: dto.bookingId,
        initiatedById: dto.initiatedById,
        againstId: dto.againstId,
        type: dto.type,
        reason: dto.reason,
        disputedAmount: dto.disputedAmount,
        escrowHeld: true,
      },
    });
  }

  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: string,
    favorsClient: boolean,
    refundAmount?: number,
  ) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: favorsClient ? 'RESOLVED_CLIENT' : 'RESOLVED_VENDOR',
        resolution,
        resolvedById: adminId,
        resolvedAt: new Date(),
        refundAmount,
      },
    });

    if (favorsClient && refundAmount) {
      await this.commissionService.refundEscrow(
        dispute.bookingId,
        refundAmount,
        `Dispute resolved in client favor: ${resolution}`,
        adminId,
      );
    } else {
      await this.commissionService.releaseEscrow(dispute.bookingId, adminId);
    }

    return { message: 'Dispute resolved' };
  }

  async getDisputes(status?: string) {
    return this.prisma.dispute.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Escrow Stats ──────────────────────────────────────────────────────────

  async getEscrowStats() {
    const [held, released, refunded, disputed] = await Promise.all([
      this.prisma.escrowAccount.aggregate({
        _sum: { vendorNetAmount: true },
        _count: { id: true },
        where: { status: EscrowStatus.HELD },
      }),
      this.prisma.escrowAccount.aggregate({
        _sum: { vendorNetAmount: true },
        _count: { id: true },
        where: { status: EscrowStatus.RELEASED },
      }),
      this.prisma.escrowAccount.aggregate({
        _sum: { grossAmount: true },
        _count: { id: true },
        where: { status: EscrowStatus.REFUNDED },
      }),
      this.prisma.dispute.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      held: { amount: held._sum.vendorNetAmount || 0, count: held._count.id },
      released: { amount: released._sum.vendorNetAmount || 0, count: released._count.id },
      refunded: { amount: refunded._sum.grossAmount || 0, count: refunded._count.id },
      openDisputes: disputed,
    };
  }
}
