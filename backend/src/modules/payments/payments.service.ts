import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @IsUUID()
  bookingId: string;

  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionRef?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInvoiceDto {
  @IsUUID()
  bookingId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountAmt?: number;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export interface PaymentViewerScope {
  userId: string;
  isAdmin: boolean;
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

  async getBookingForInvoice(bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: {
        client: { select: { fullName: true, email: true, phone: true } },
        venue: { select: { name: true, city: true, address: true } },
        package: { select: { name: true, tier: true } },
        items: {
          include: {
            service: { select: { name: true } },
            vendor: { select: { businessName: true } },
          },
        },
        payments: {
          where: { status: 'COMPLETED' },
          orderBy: { paidAt: 'asc' },
        },
      },
    });
    if (!booking) throw new (await import('@nestjs/common')).NotFoundException('Booking not found');
    return booking;
  }

  async getInvoicesByBooking(bookingId: string) {
    return this.prisma.invoice.findMany({
      where: { bookingId },
      include: {
        payments: { orderBy: { createdAt: 'desc' } },
        booking: {
          include: {
            client: { select: { fullName: true, email: true, phone: true } },
            venue: { select: { name: true, city: true, address: true } },
            package: { select: { name: true, tier: true } },
            items: { include: { service: { select: { name: true } }, vendor: { select: { businessName: true } } } },
          },
        },
      },
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

  async updateStatus(id: string, status: PaymentStatus, notes?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status, notes: notes || payment.notes },
    });

    return updated;
  }

  async getPaymentsByBooking(bookingId: string) {
    return this.prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(dto: PaginationDto, viewer?: PaymentViewerScope) {
    const where = viewer && !viewer.isAdmin ? { booking: { clientId: viewer.userId } } : undefined;
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        ...(where && { where }),
        skip: dto.skip,
        take: dto.take,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: { select: { bookingNumber: true, client: { select: { fullName: true } } } },
        },
      }),
      where ? this.prisma.payment.count({ where }) : this.prisma.payment.count(),
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

    const txRef = `PH-${paymentId.substring(0, 8)}-${Date.now()}`;
    await this.prisma.payment.update({ where: { id: paymentId }, data: { transactionRef: txRef, status: PaymentStatus.PROCESSING } });

    const client = payment.booking.client;
    const names = (client.fullName || 'Guest User').split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || firstName;

    const payload = {
      amount: payment.amount.toString(),
      currency: payment.currency || 'ETB',
      email: client.email || 'customer@example.com',
      first_name: firstName,
      last_name: lastName,
      phone_number: client.phone || '',
      tx_ref: txRef,
      callback_url: `http://localhost:3000/api/v1/payments/webhook/chapa`,
      return_url: `http://localhost:4200/dashboard/bookings/${payment.bookingId}?payment_ref=${txRef}`,
      customization: {
        title: 'PrideHub Payment',
        description: `Payment for Booking ${payment.booking.bookingNumber}`,
      },
    };

    try {
      const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.status !== 'success') {
        const errorMsg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message || data);
        throw new BadRequestException(`Chapa Error: ${errorMsg}`);
      }

      return {
        checkoutUrl: data.data.checkout_url,
        txRef,
        message: 'Redirect user to checkoutUrl to complete payment',
      };
    } catch (error: any) {
      // Revert status on failure
      await this.prisma.payment.update({ where: { id: paymentId }, data: { status: PaymentStatus.PENDING } });
      
      if (error.response && error.status) {
         throw error; // It's already a NestJS HttpException
      }
      
      throw new BadRequestException(error.message || 'Failed to communicate with Chapa');
    }
  }

  async verifyChapaPayment(txRef: string) {
    const payment = await this.prisma.payment.findFirst({ where: { transactionRef: txRef } });
    if (!payment) throw new NotFoundException('Payment transaction not found');

    if (payment.status === PaymentStatus.COMPLETED) return payment;

    const secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-Zf1BucPZVL5tWXGh8yKJx2m7VR2lCmSl';
    
    try {
      const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      });
      const data = await response.json();

      if (data.status === 'success' && data.data.status === 'success') {
        return this.confirmPayment(payment.id, txRef);
      } else if (data.status === 'success' && data.data.status === 'failed') {
        return this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
      }
      
      return payment;
    } catch (error) {
      return payment;
    }
  }

  async handleChapaWebhook(body: any) {
    const txRef = body.tx_ref;
    if (!txRef) return { message: 'Ignored' };

    // Verify transaction with Chapa
    try {
      const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      });
      const data = await response.json();

      if (data.status === 'success') {
        const payment = await this.prisma.payment.findFirst({ where: { transactionRef: txRef } });
        if (payment && payment.status !== PaymentStatus.COMPLETED) {
          await this.confirmPayment(payment.id, txRef);
        }
      }
    } catch (error) {
      console.error('Chapa verification failed:', error);
    }
    
    return { status: 'success' };
  }
}
