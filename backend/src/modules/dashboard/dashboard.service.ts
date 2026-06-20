import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers, newUsersThisMonth,
      totalBookings, bookingsThisMonth,
      totalRevenue, revenueThisMonth,
      pendingBookings, upcomingEvents,
      recentBookings, revenueByMonth,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: monthStart } } }),
      this.prisma.booking.count({ where: { deletedAt: null } }),
      this.prisma.booking.count({ where: { deletedAt: null, createdAt: { gte: monthStart } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.COMPLETED } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.COMPLETED, paidAt: { gte: monthStart } },
      }),
      this.prisma.booking.count({ where: { deletedAt: null, status: BookingStatus.PENDING } }),
      this.prisma.booking.count({
        where: { deletedAt: null, eventDate: { gte: now }, status: BookingStatus.CONFIRMED },
      }),
      this.prisma.booking.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { fullName: true, avatar: true } },
          venue: { select: { name: true } },
        },
      }),
      this.getMonthlyRevenue(),
    ]);

    return {
      kpis: {
        totalUsers, newUsersThisMonth,
        totalBookings, bookingsThisMonth,
        totalRevenue: totalRevenue._sum.amount || 0,
        revenueThisMonth: revenueThisMonth._sum.amount || 0,
        pendingBookings, upcomingEvents,
      },
      recentBookings,
      revenueByMonth,
    };
  }

  async getClientStats(userId: string) {
    const [bookings, totalSpent, upcomingEvent] = await Promise.all([
      this.prisma.booking.findMany({
        where: { clientId: userId, deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { venue: { select: { name: true } }, package: { select: { name: true } } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.COMPLETED, booking: { clientId: userId } },
      }),
      this.prisma.booking.findFirst({
        where: { clientId: userId, deletedAt: null, eventDate: { gte: new Date() } },
        orderBy: { eventDate: 'asc' },
      }),
    ]);

    return { bookings, totalSpent: totalSpent._sum.amount || 0, upcomingEvent };
  }

  private async getMonthlyRevenue(): Promise<{ month: string; revenue: string | number }[]> {
    const months: { month: string; revenue: string | number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0);
      const agg = await this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.COMPLETED, paidAt: { gte: start, lte: end } },
      });
      months.push({
        month: start.toLocaleString('default', { month: 'short' }),
        revenue: (agg._sum.amount ?? 0).toString(),
      });
    }
    return months;
  }

  async getBookingsByStatus() {
    const statuses = Object.values(BookingStatus);
    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await this.prisma.booking.count({ where: { deletedAt: null, status } }),
      })),
    );
    return counts;
  }
}
