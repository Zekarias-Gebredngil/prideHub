import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, unknown>) {
    return this.prisma.notification.create({ data: { userId, type, title, body, data: data as any } });
  }

  async findForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { data, total, unreadCount, page, limit };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async deleteNotification(id: string, userId: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { message: 'Notification deleted' };
  }

  async notifyBookingUpdate(clientId: string, bookingNumber: string, status: string) {
    return this.create(clientId, NotificationType.IN_APP,
      'Booking Update',
      `Your booking ${bookingNumber} status has been updated to ${status}`,
      { bookingNumber, status },
    );
  }

  /**
   * Runs every 6 hours. Sends reminders for bookings approaching their event date
   * (3 days and 1 day before). Tracks sent reminders in booking.metadata.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async sendApproachingEventNotifications() {
    this.logger.log('Running approaching event notification check...');

    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        deletedAt: null,
        eventDate: { gte: now },
      },
      include: {
        client: { select: { id: true, fullName: true } },
        planner: { select: { id: true, fullName: true } },
        items: {
          include: {
            vendor: { select: { userId: true, businessName: true } },
          },
        },
      },
    });

    for (const booking of bookings) {
      const eventDate = new Date(booking.eventDate);
      const meta = (booking.metadata as any) || {};
      const sentReminders: string[] = meta.sentReminders || [];

      const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      // Collect all user IDs to notify
      const recipientIds = new Set<string>();
      recipientIds.add(booking.clientId);
      if (booking.assignedTo) recipientIds.add(booking.assignedTo);
      for (const item of booking.items) {
        if (item.vendor?.userId) recipientIds.add(item.vendor.userId);
      }

      const sendForDay = async (dayKey: string, daysLeft: number) => {
        if (sentReminders.includes(dayKey)) return;

        const title = `🗓 Event in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`;
        const body = `Your event (Booking #${booking.bookingNumber}) is scheduled for ${eventDate.toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' })}. Get ready!`;

        await Promise.all(
          [...recipientIds].map((uid) =>
            this.create(uid, NotificationType.IN_APP, title, body, {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
              eventDate: booking.eventDate,
            }),
          ),
        );

        // Update booking metadata to record this reminder was sent
        sentReminders.push(dayKey);
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            metadata: { ...(meta as object), sentReminders } as any,
          },
        });

        this.logger.log(`Sent ${dayKey} reminder for booking ${booking.bookingNumber} to ${recipientIds.size} users`);
      };

      // Check if in 3-day window
      if (eventDate >= in3Days && eventDate < in4Days) {
        await sendForDay('3day', 3);
      }

      // Check if in 1-day window
      if (eventDate >= in1Day && eventDate < in2Days) {
        await sendForDay('1day', 1);
      }
    }

    this.logger.log(`Approaching event check complete. Processed ${bookings.length} upcoming bookings.`);
  }
}
