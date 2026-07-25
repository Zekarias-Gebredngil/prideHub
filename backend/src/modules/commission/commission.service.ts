import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { CommissionType, LedgerEntryType, LedgerAccountType, EscrowStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommissionRuleDto, UpdateCommissionRuleDto, UpdateSettingsDto } from './dto/commission.dto';

export interface CommissionCalculationResult {
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  taxAmount: number;
  vendorNetPayout: number;
  appliedRuleId?: string;
  appliedRuleName: string;
  breakdown: {
    gross: number;
    commission: number;
    platformFee: number;
    tax: number;
    net: number;
  };
}

@Injectable()
export class CommissionService implements OnModuleInit {
  private readonly logger = new Logger(CommissionService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Module Init: Seed default settings ───────────────────────────────────

  async onModuleInit() {
    const existing = await this.prisma.commissionSettings.findFirst();
    if (!existing) {
      await this.prisma.commissionSettings.create({
        data: {
          globalDefaultRate: 0.10,
          platformFeeRate: 0.03,
          currency: 'ETB',
          settlementFrequency: 'WEEKLY',
          escrowHoldDays: 7,
        },
      });
      this.logger.log('Commission settings initialized with defaults');
    }
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  async getSettings() {
    return this.prisma.commissionSettings.findFirst();
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const settings = await this.prisma.commissionSettings.findFirst();
    if (!settings) throw new NotFoundException('Commission settings not found');
    return this.prisma.commissionSettings.update({
      where: { id: settings.id },
      data: {
        ...(dto.globalDefaultRate !== undefined && { globalDefaultRate: dto.globalDefaultRate }),
        ...(dto.platformFeeRate !== undefined && { platformFeeRate: dto.platformFeeRate }),
        ...(dto.escrowHoldDays !== undefined && { escrowHoldDays: dto.escrowHoldDays }),
      },
    });
  }

  // ── Rules CRUD ────────────────────────────────────────────────────────────

  async createRule(dto: CreateCommissionRuleDto, adminId: string) {
    return this.prisma.commissionRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        rate: dto.rate,
        fixedAmount: dto.fixedAmount,
        tiers: dto.tiers ? (dto.tiers as any) : undefined,
        vendorId: dto.vendorId,
        categoryId: dto.categoryId,
        subscriptionTier: dto.subscriptionTier,
        priority: dto.priority ?? 0,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        region: dto.region,
        isEnabled: dto.isEnabled ?? true,
        approvedById: adminId,
        approvedAt: new Date(),
      },
    });
  }

  async updateRule(id: string, dto: UpdateCommissionRuleDto) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission rule not found');
    return this.prisma.commissionRule.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.rate !== undefined && { rate: dto.rate }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        ...(dto.effectiveTo && { effectiveTo: new Date(dto.effectiveTo) }),
      },
    });
  }

  async getRules() {
    return this.prisma.commissionRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        vendor: { select: { businessName: true } },
        category: { select: { name: true } },
      },
    });
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission rule not found');
    await this.prisma.commissionRule.update({
      where: { id },
      data: { isEnabled: false, status: 'INACTIVE' },
    });
    return { message: 'Commission rule deactivated' };
  }

  // ── Commission Calculation Engine ─────────────────────────────────────────

  /**
   * Resolves commission rate using priority order:
   * 1. Vendor override
   * 2. Subscription tier
   * 3. Campaign override
   * 4. Vendor category
   * 5. Global default
   */
  async calculateCommission(
    amount: number,
    vendorId?: string,
    categoryId?: string,
  ): Promise<CommissionCalculationResult> {
    const settings = await this.getSettings();
    const now = new Date();

    const platformFeeRate = 0; // Platform is 100% free for clients
    let commissionRate = Number(settings?.globalDefaultRate ?? 0.10);
    let appliedRuleId: string | undefined;
    let appliedRuleName = 'Global Default';

    // Get vendor's subscription tier if applicable
    let subscriptionTier: string | undefined;
    if (vendorId) {
      const vendorProfile = await this.prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: {
          user: {
            include: { vendorSubscription: { include: { plan: true } } },
          },
        },
      });
      if (vendorProfile?.user?.vendorSubscription?.status === 'ACTIVE') {
        subscriptionTier = vendorProfile.user.vendorSubscription.plan.tier;
      }
    }

    // Build priority-ordered query for applicable rules
    const orConditions: any[] = [];
    if (vendorId) orConditions.push({ vendorId });
    if (subscriptionTier) orConditions.push({ subscriptionTier: subscriptionTier as any });
    if (categoryId) orConditions.push({ categoryId });
    orConditions.push({ vendorId: null, categoryId: null, subscriptionTier: null });

    const applicableRules = await this.prisma.commissionRule.findMany({
      where: {
        isEnabled: true,
        status: 'ACTIVE',
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        AND: [{ OR: orConditions }],
      },
      orderBy: { priority: 'desc' },
    });

    if (applicableRules.length > 0) {
      const topRule = applicableRules[0];
      const result = this.applyRule(topRule, amount);
      commissionRate = result.rate;
      appliedRuleId = topRule.id;
      appliedRuleName = topRule.name;
    }

    const commissionAmount = Math.round(amount * commissionRate * 100) / 100;
    const platformFeeAmount = 0; // Free for clients
    const taxAmount = 0; // Tax configured separately via TaxConfiguration
    const vendorNetPayout = Math.max(0, Math.round((amount - commissionAmount - taxAmount) * 100) / 100);

    return {
      grossAmount: amount,
      commissionRate,
      commissionAmount,
      platformFeeRate,
      platformFeeAmount,
      taxAmount,
      vendorNetPayout,
      appliedRuleId,
      appliedRuleName,
      breakdown: {
        gross: amount,
        commission: commissionAmount,
        platformFee: platformFeeAmount,
        tax: taxAmount,
        net: vendorNetPayout,
      },
    };
  }

  private applyRule(rule: any, amount: number): { rate: number } {
    switch (rule.type as CommissionType) {
      case CommissionType.PERCENTAGE:
        return { rate: Number(rule.rate) };

      case CommissionType.FIXED_AMOUNT:
        return { rate: amount > 0 ? Number(rule.fixedAmount) / amount : 0 };

      case CommissionType.TIERED: {
        const tiers: Array<{ minAmount: number; maxAmount?: number; rate: number }> =
          rule.tiers || [];
        const tier = tiers.find(
          (t) => amount >= t.minAmount && (t.maxAmount == null || amount <= t.maxAmount),
        );
        return { rate: tier ? tier.rate : Number(rule.rate ?? 0.10) };
      }

      case CommissionType.HYBRID: {
        // Combine fixed + percentage
        const pct = Number(rule.rate ?? 0);
        const fixed = Number(rule.fixedAmount ?? 0);
        const total = amount * pct + fixed;
        return { rate: amount > 0 ? total / amount : 0 };
      }

      default:
        return { rate: Number(rule.rate ?? 0.10) };
    }
  }

  // ── Process Commission After Payment ──────────────────────────────────────

  async processCommissionForPayment(
    paymentId: string,
    bookingId: string,
    paidAmount: number,
    vendorId?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: { include: { vendor: { include: { category: true } } } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const categoryId = booking.items[0]?.vendor?.categoryId;
    const targetVendorId = vendorId ?? booking.items.find((i) => i.vendorId)?.vendorId ?? booking.assignedTo ?? 'platform-managed';

    const calculation = await this.calculateCommission(paidAmount, targetVendorId, categoryId ?? undefined);

    // Create commission transaction (idempotent)
    const existing = await this.prisma.commissionTransaction.findFirst({
      where: { paymentId, bookingId, vendorId: targetVendorId },
    });
    if (existing) return { commissionTx: existing, calculation };

    const commissionTx = await this.prisma.commissionTransaction.create({
      data: {
        bookingId,
        paymentId,
        vendorId: targetVendorId,
        ruleId: calculation.appliedRuleId,
        grossAmount: calculation.grossAmount,
        commissionRate: calculation.commissionRate,
        commissionAmount: calculation.commissionAmount,
        platformFeeRate: calculation.platformFeeRate,
        platformFeeAmount: calculation.platformFeeAmount,
        taxAmount: calculation.taxAmount,
        vendorNetPayout: calculation.vendorNetPayout,
        status: 'PENDING',
      },
    });

    // Create immutable ledger entries
    await this.createLedgerEntry({
      entryType: LedgerEntryType.COMMISSION_CALCULATED,
      accountType: LedgerAccountType.PLATFORM,
      accountId: bookingId,
      referenceId: paymentId,
      referenceType: 'payment',
      creditAmount: calculation.commissionAmount,
      debitAmount: 0,
      balance: calculation.commissionAmount,
      description: `Commission for booking ${bookingId} paid by profit earner. Rule: ${calculation.appliedRuleName}`,
    });

    await this.createLedgerEntry({
      entryType: LedgerEntryType.ESCROW_HELD,
      accountType: LedgerAccountType.VENDOR,
      accountId: targetVendorId,
      referenceId: bookingId,
      referenceType: 'booking',
      creditAmount: calculation.vendorNetPayout,
      debitAmount: 0,
      balance: calculation.vendorNetPayout,
      description: `Net payout held in escrow for booking ${bookingId}`,
    });

    // Record platform revenue
    await this.prisma.platformRevenue.create({
      data: {
        category: 'COMMISSION',
        sourceId: paymentId,
        sourceType: 'payment',
        amount: calculation.commissionAmount,
        description: `Commission from booking ${bookingId}`,
      },
    });

    this.logger.log(
      `Commission processed: booking=${bookingId}, gross=${paidAmount}, ` +
        `commission=${calculation.commissionAmount}, net=${calculation.vendorNetPayout}`,
    );

    return { commissionTx, calculation };
  }

  // ── Escrow Management ─────────────────────────────────────────────────────

  async createOrUpdateEscrow(
    bookingId: string,
    vendorId: string,
    calculation: CommissionCalculationResult,
  ) {
    const existing = await this.prisma.escrowAccount.findUnique({ where: { bookingId } });
    const settings = await this.getSettings();
    const holdDays = settings?.escrowHoldDays ?? 7;
    const releaseAt = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);

    if (existing) {
      return this.prisma.escrowAccount.update({
        where: { bookingId },
        data: {
          grossAmount: { increment: calculation.grossAmount },
          commissionAmount: { increment: calculation.commissionAmount },
          platformFeeAmount: { increment: calculation.platformFeeAmount },
          vendorNetAmount: { increment: calculation.vendorNetPayout },
          releaseAt,
        },
      });
    }

    return this.prisma.escrowAccount.create({
      data: {
        bookingId,
        vendorId,
        grossAmount: calculation.grossAmount,
        commissionAmount: calculation.commissionAmount,
        platformFeeAmount: calculation.platformFeeAmount,
        vendorNetAmount: calculation.vendorNetPayout,
        status: EscrowStatus.HELD,
        releaseAt,
      },
    });
  }

  async releaseEscrow(bookingId: string, performedById?: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { bookingId },
    });
    if (!escrow) throw new NotFoundException('Escrow account not found');
    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException('Escrow is not in HELD status');
    }

    return this.prisma.$transaction(async (tx) => {
      // Release escrow
      const updated = await tx.escrowAccount.update({
        where: { bookingId },
        data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
      });

      // Record escrow transaction
      await tx.escrowTransaction.create({
        data: {
          escrowId: escrow.id,
          type: 'RELEASE',
          amount: Number(escrow.vendorNetAmount),
          description: `Escrow released for booking ${bookingId}`,
          performedById,
        },
      });

      // Credit vendor wallet
      await this.creditVendorWallet(
        tx,
        escrow.vendorId,
        Number(escrow.vendorNetAmount),
        bookingId,
        'booking',
        `Payout for booking ${bookingId}`,
      );

      // Update commission transaction status
      await tx.commissionTransaction.updateMany({
        where: { bookingId },
        data: { status: 'SETTLED', settledAt: new Date() },
      });

      // Ledger entry for release
      await tx.financialLedger.create({
        data: {
          entryType: LedgerEntryType.ESCROW_RELEASED,
          accountType: LedgerAccountType.VENDOR,
          accountId: escrow.vendorId,
          referenceId: bookingId,
          referenceType: 'booking',
          creditAmount: Number(escrow.vendorNetAmount),
          debitAmount: 0,
          balance: Number(escrow.vendorNetAmount),
          description: `Escrow released and credited to vendor wallet for booking ${bookingId}`,
        },
      });

      return updated;
    });
  }

  async refundEscrow(bookingId: string, refundAmount: number, reason: string, performedById?: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({ where: { bookingId } });
    if (!escrow) throw new NotFoundException('Escrow account not found');
    if (escrow.status === EscrowStatus.RELEASED) {
      throw new BadRequestException('Escrow already released');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.escrowAccount.update({
        where: { bookingId },
        data: { status: EscrowStatus.REFUNDED, refundedAt: new Date() },
      });

      await tx.escrowTransaction.create({
        data: {
          escrowId: escrow.id,
          type: 'REFUND',
          amount: refundAmount,
          description: reason,
          performedById,
        },
      });

      await tx.commissionTransaction.updateMany({
        where: { bookingId },
        data: { status: 'REVERSED', reversedAt: new Date(), reversalReason: reason },
      });

      // Reversing ledger entries
      await tx.financialLedger.create({
        data: {
          entryType: LedgerEntryType.COMMISSION_REVERSED,
          accountType: LedgerAccountType.PLATFORM,
          accountId: bookingId,
          referenceId: bookingId,
          referenceType: 'booking',
          debitAmount: Number(escrow.commissionAmount),
          creditAmount: 0,
          balance: -Number(escrow.commissionAmount),
          description: `Commission reversed for refund: ${reason}`,
        },
      });
    });
  }

  // ── Vendor Wallet Operations ──────────────────────────────────────────────

  async getOrCreateWallet(vendorId: string) {
    let wallet = await this.prisma.vendorWallet.findUnique({ where: { vendorId } });
    if (!wallet) {
      wallet = await this.prisma.vendorWallet.create({
        data: { vendorId },
      });
    }
    return wallet;
  }

  private async creditVendorWallet(
    tx: any,
    vendorId: string,
    amount: number,
    referenceId: string,
    referenceType: string,
    description: string,
  ) {
    const wallet = await tx.vendorWallet.upsert({
      where: { vendorId },
      create: { vendorId, availableBalance: amount, lifetimeEarnings: amount },
      update: {
        availableBalance: { increment: amount },
        lifetimeEarnings: { increment: amount },
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount,
        balanceBefore: Number(wallet.availableBalance) - amount,
        balanceAfter: Number(wallet.availableBalance),
        description,
        referenceId,
        referenceType,
      },
    });

    return wallet;
  }

  async getVendorWallet(vendorId: string) {
    return this.getOrCreateWallet(vendorId);
  }

  async getWalletTransactions(vendorId: string, page = 1, limit = 20) {
    const wallet = await this.getOrCreateWallet(vendorId);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);
    return { data, total, page, limit };
  }

  // ── Withdrawal Requests ───────────────────────────────────────────────────

  async requestWithdrawal(vendorId: string, dto: {
    amount: number;
    method: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  }) {
    const wallet = await this.getOrCreateWallet(vendorId);
    const settings = await this.getSettings();

    if (dto.amount < Number(settings?.minWithdrawalAmount ?? 100)) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ${settings?.minWithdrawalAmount} ETB`,
      );
    }
    if (dto.amount > Number(wallet.availableBalance)) {
      throw new BadRequestException('Insufficient available balance');
    }

    return this.prisma.$transaction(async (tx) => {
      // Hold the amount
      await tx.vendorWallet.update({
        where: { vendorId },
        data: {
          availableBalance: { decrement: dto.amount },
          heldBalance: { increment: dto.amount },
        },
      });

      const request = await tx.withdrawalRequest.create({
        data: {
          walletId: wallet.id,
          vendorId,
          amount: dto.amount,
          method: dto.method,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          accountName: dto.accountName,
          status: 'PENDING',
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'HOLD',
          amount: dto.amount,
          balanceBefore: Number(wallet.availableBalance),
          balanceAfter: Number(wallet.availableBalance) - dto.amount,
          description: `Withdrawal request ${request.id}`,
          referenceId: request.id,
          referenceType: 'withdrawal',
        },
      });

      return request;
    });
  }

  async getWithdrawals(filters: { status?: string; vendorId?: string; limit?: number }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.vendorId) where.vendorId = filters.vendorId;

    return this.prisma.withdrawalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      include: {
        wallet: true,
      },
    });
  }

  async processWithdrawal(requestId: string, approved: boolean, adminId: string, reason?: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
      include: { wallet: true },
    });
    if (!request) throw new NotFoundException('Withdrawal request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Request already processed');

    return this.prisma.$transaction(async (tx) => {
      if (approved) {
        await tx.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedById: adminId,
          },
        });

        await tx.vendorWallet.update({
          where: { vendorId: request.vendorId },
          data: {
            heldBalance: { decrement: Number(request.amount) },
            totalWithdrawn: { increment: Number(request.amount) },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: request.walletId,
            type: 'WITHDRAWAL',
            amount: Number(request.amount),
            balanceBefore: Number(request.wallet.availableBalance),
            balanceAfter: Number(request.wallet.availableBalance),
            description: `Withdrawal approved by admin`,
            referenceId: requestId,
            referenceType: 'withdrawal',
          },
        });

        // Ledger entry
        await tx.financialLedger.create({
          data: {
            entryType: LedgerEntryType.WITHDRAWAL_PROCESSED,
            accountType: LedgerAccountType.VENDOR,
            accountId: request.vendorId,
            referenceId: requestId,
            referenceType: 'withdrawal',
            debitAmount: Number(request.amount),
            creditAmount: 0,
            balance: -Number(request.amount),
            description: `Withdrawal of ${request.amount} ETB processed`,
          },
        });
      } else {
        // Reject: return held funds to available
        await tx.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: adminId,
            rejectionReason: reason,
          },
        });

        await tx.vendorWallet.update({
          where: { vendorId: request.vendorId },
          data: {
            availableBalance: { increment: Number(request.amount) },
            heldBalance: { decrement: Number(request.amount) },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: request.walletId,
            type: 'RELEASE',
            amount: Number(request.amount),
            balanceBefore: Number(request.wallet.availableBalance),
            balanceAfter: Number(request.wallet.availableBalance) + Number(request.amount),
            description: `Withdrawal rejected: ${reason}`,
            referenceId: requestId,
            referenceType: 'withdrawal',
          },
        });
      }
    });
  }

  // ── Financial Ledger ──────────────────────────────────────────────────────

  private async createLedgerEntry(data: {
    entryType: LedgerEntryType;
    accountType: LedgerAccountType;
    accountId: string;
    referenceId?: string;
    referenceType?: string;
    debitAmount: number;
    creditAmount: number;
    balance: number;
    description?: string;
    createdById?: string;
  }) {
    return this.prisma.financialLedger.create({ data });
  }

  async getLedgerEntries(accountId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.financialLedger.findMany({
        where: { accountId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.financialLedger.count({ where: { accountId } }),
    ]);
    return { data, total, page, limit };
  }

  // ── Revenue Analytics ─────────────────────────────────────────────────────

  async getPlatformRevenueStats(from?: Date, to?: Date) {
    const where: any = {};
    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = from;
      if (to) where.recordedAt.lte = to;
    }

    const [byCategory, totalRevenue, escrowBalance, commissionTxStats] = await Promise.all([
      this.prisma.platformRevenue.groupBy({
        by: ['category'],
        _sum: { amount: true },
        _count: { id: true },
        where,
      }),
      this.prisma.platformRevenue.aggregate({ _sum: { amount: true }, where }),
      this.prisma.escrowAccount.aggregate({
        _sum: { vendorNetAmount: true },
        where: { status: EscrowStatus.HELD },
      }),
      this.prisma.commissionTransaction.aggregate({
        _sum: { commissionAmount: true, platformFeeAmount: true, vendorNetPayout: true },
        where: { status: 'SETTLED' },
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      escrowBalance: escrowBalance._sum.vendorNetAmount || 0,
      totalCommissionSettled: commissionTxStats._sum.commissionAmount || 0,
      totalPlatformFeeSettled: commissionTxStats._sum.platformFeeAmount || 0,
      totalVendorPayouts: commissionTxStats._sum.vendorNetPayout || 0,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        total: c._sum.amount || 0,
        count: c._count.id,
      })),
    };
  }

  // ── Commission Transaction History ────────────────────────────────────────

  async getCommissionTransactions(
    vendorId?: string,
    page = 1,
    limit = 20,
  ) {
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.commissionTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: { select: { bookingNumber: true, eventType: true, eventDate: true } },
          rule: { select: { name: true, type: true } },
        },
      }),
      this.prisma.commissionTransaction.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  // ── Wallet Deduction ────────────────────────────────────────────────────────
  
  async debitVendorWallet(vendorId: string, amount: number, referenceId: string, referenceType: string, description: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.vendorWallet.findUnique({ where: { vendorId } });
      if (!wallet) throw new NotFoundException('Vendor wallet not found');
      if (Number(wallet.availableBalance) < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const updatedWallet = await tx.vendorWallet.update({
        where: { vendorId },
        data: { availableBalance: { decrement: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount,
          balanceBefore: Number(wallet.availableBalance),
          balanceAfter: Number(updatedWallet.availableBalance),
          referenceId,
          referenceType,
          description,
        },
      });

      await tx.financialLedger.create({
        data: {
          entryType: LedgerEntryType.ADJUSTMENT,
          accountType: LedgerAccountType.VENDOR,
          accountId: vendorId,
          referenceId,
          referenceType,
          debitAmount: amount,
          creditAmount: 0,
          balance: -amount,
          description,
        },
      });

      return updatedWallet;
    });
  }
}
