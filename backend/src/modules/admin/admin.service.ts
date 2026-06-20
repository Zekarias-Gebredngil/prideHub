import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformOverview() {
    const [users, vendors, bookings, revenue, venues, services, packages, blogs] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.vendorProfile.count({ where: { deletedAt: null } }),
      this.prisma.booking.count({ where: { deletedAt: null } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
      this.prisma.venue.count({ where: { deletedAt: null } }),
      this.prisma.service.count({ where: { deletedAt: null } }),
      this.prisma.package.count({ where: { deletedAt: null } }),
      this.prisma.blogPost.count({ where: { deletedAt: null } }),
    ]);
    return { users, vendors, bookings, venues, services, packages, blogs, totalRevenue: revenue._sum.amount || 0 };
  }

  async getRecentActivity() {
    return this.prisma.activityLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, avatar: true } } },
    });
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { data, total, page, limit };
  }

  async banUser(id: string) {
    return this.prisma.user.update({ where: { id }, data: { status: UserStatus.BANNED } });
  }

  async activateUser(id: string) {
    return this.prisma.user.update({ where: { id }, data: { status: UserStatus.ACTIVE } });
  }

  async changeUserRole(id: string, role: UserRole) {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async getPendingApprovals() {
    const [pendingVendors, pendingReviews, pendingTestimonials, pendingComments] = await Promise.all([
      this.prisma.vendorProfile.count({ where: { isVerified: false, deletedAt: null } }),
      this.prisma.review.count({ where: { isApproved: false, deletedAt: null } }),
      this.prisma.testimonial.count({ where: { isApproved: false } }),
      this.prisma.blogComment.count({ where: { isApproved: false, deletedAt: null } }),
    ]);
    return { pendingVendors, pendingReviews, pendingTestimonials, pendingComments };
  }
}
