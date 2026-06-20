import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async revenueReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [byMethod, byMonth, total] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['method'],
        where: { status: PaymentStatus.COMPLETED, paidAt: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.$queryRaw<{ month: string; revenue: number }[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "paidAt"), 'Mon YYYY') AS month,
               SUM(amount)::float AS revenue
        FROM payments
        WHERE status = 'COMPLETED' AND "paidAt" BETWEEN ${start} AND ${end}
        GROUP BY DATE_TRUNC('month', "paidAt")
        ORDER BY DATE_TRUNC('month', "paidAt")
      `,
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.COMPLETED, paidAt: { gte: start, lte: end } },
      }),
    ]);

    return { byMethod, byMonth, total: total._sum.amount || 0 };
  }

  async bookingsReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [byStatus, byEventType, total] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { deletedAt: null, createdAt: { gte: start, lte: end } },
        _count: true,
      }),
      this.prisma.booking.groupBy({
        by: ['eventType'],
        where: { deletedAt: null, createdAt: { gte: start, lte: end } },
        _count: true,
      }),
      this.prisma.booking.count({ where: { deletedAt: null, createdAt: { gte: start, lte: end } } }),
    ]);

    return { byStatus, byEventType, total };
  }

  async customersReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [newUsers, totalUsers, topClients] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: start, lte: end } } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.booking.groupBy({
        by: ['clientId'],
        where: { deletedAt: null, createdAt: { gte: start, lte: end } },
        _count: true,
        orderBy: { _count: { clientId: 'desc' } },
        take: 10,
      }),
    ]);

    return { newUsers, totalUsers, topClients };
  }

  async vendorPerformanceReport() {
    return this.prisma.vendorProfile.findMany({
      where: { deletedAt: null },
      orderBy: { averageRating: 'desc' },
      take: 20,
      select: {
        id: true,
        businessName: true,
        averageRating: true,
        totalReviews: true,
        totalBookings: true,
        category: { select: { name: true } },
      },
    });
  }

  async popularPackages() {
    return this.prisma.booking.groupBy({
      by: ['packageId'],
      where: { deletedAt: null, packageId: { not: null } },
      _count: true,
      orderBy: { _count: { packageId: 'desc' } },
      take: 10,
    });
  }

  async popularVenues() {
    return this.prisma.booking.groupBy({
      by: ['venueId'],
      where: { deletedAt: null, venueId: { not: null } },
      _count: true,
      orderBy: { _count: { venueId: 'desc' } },
      take: 10,
    });
  }
}
