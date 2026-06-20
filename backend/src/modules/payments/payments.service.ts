import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  bookingId: string;
  invoiceId?: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  transactionRef?: string;
  notes?: string;
}

export class CreateInvoiceDto {
  bookingId: string;
  subtotal: number;
  taxAmount?: number;
  discountAmt?: number;
  dueDate?: string;
  notes?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateInvoiceNumber(): string {
    return `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  async createInvoice(dto: CreateInvoiceDto) {
    const booking = await this.prisma.booking.findFirst({ where: { id: dto.bookingId, deletedAt: null } });
    if (!booking) throw new NotFoundException('Booking not found');

    const total = dto.subtotal + (dto.taxAmount || 0) - (dto.discountAmt || 0);

    return this.prisma.invoice.create({
      data: {
        bookingId: dto.bookingId,
        invoiceNumber: this.generateInvoiceNumber(),
        subtotal: dto.subtotal,
        taxAmount: dto.taxAmount || 0,
        discountAmt: dto.discountAmt || 0,
        total,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
      },
      include: { booking: { select: { bookingNumber: true, client: { select: { fullName: true, email: true } } } } },
    });
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            client: { select: { fullName: true, email: true, phone: true } },
            items: true,
          },
        },
        payments: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async getInvoicesByBooking(bookingId: string) {
    return this.prisma.invoice.findMany({
      where: { bookingId },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  async createPayment(dto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findFirst({ where: { id: dto.bookingId, deletedAt: null } });
    if (!booking) throw new NotFoundException('Booking not found');

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        currency: dto.currency || 'ETB',
        method: dto.method,
        transactionRef: dto.transactionRef,
        notes: dto.notes,
        status: PaymentStatus.PENDING,
      },
    });

    return payment;
  }

  async confirmPayment(id: string, transactionRef: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.COMPLETED, transactionRef, paidAt: new Date() },
    });

    // Update booking paid amount
    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: { paidAmount: { increment: Number(payment.amount) } },
    });

    // Update invoice if linked
    if (payment.invoiceId) {
      const invoice = await this.prisma.invoice.findUnique({ where: { id: payment.invoiceId } });
      if (invoice) {
        const newPaid = Number(invoice.paidAmount) + Number(payment.amount);
        await this.prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: newPaid,
            status: newPaid >= Number(invoice.total) ? PaymentStatus.COMPLETED : PaymentStatus.PROCESSING,
            paidAt: newPaid >= Number(invoice.total) ? new Date() : undefined,
          },
        });
      }
    }

    return updated;
  }

  async getPaymentsByBooking(bookingId: string) {
    return this.prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(dto: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip: dto.skip,
        take: dto.take,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: { select: { bookingNumber: true, client: { select: { fullName: true } } } },
        },
      }),
      this.prisma.payment.count(),
    ]);
    return paginate(data, total, dto);
  }

  async getRevenueStats() {
    const [total, monthly, weekly] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.COMPLETED } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.COMPLETED, paidAt: { gte: new Date(new Date().setDate(1)) } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);
    return {
      totalRevenue: total._sum.amount || 0,
      monthlyRevenue: monthly._sum.amount || 0,
      weeklyRevenue: weekly._sum.amount || 0,
    };
  }

  async initiateChapa(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: { include: { client: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    // In production, integrate with Chapa API
    const txRef = `PH-${paymentId.substring(0, 8)}-${Date.now()}`;
    await this.prisma.payment.update({ where: { id: paymentId }, data: { transactionRef: txRef, status: PaymentStatus.PROCESSING } });

    return {
      checkoutUrl: `https://api.chapa.co/v1/hosted/pay/${txRef}`,
      txRef,
      message: 'Redirect user to checkoutUrl to complete payment',
    };
  }
}
