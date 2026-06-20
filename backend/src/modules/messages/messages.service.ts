import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async sendMessage(senderId: string, receiverId: string, content: string, bookingId?: string, attachments?: unknown[]) {
    return this.prisma.message.create({
      data: { senderId, receiverId, content, bookingId, attachments: attachments as any },
      include: { sender: { select: { fullName: true, avatar: true } } },
    });
  }

  async getConversation(user1Id: string, user2Id: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          deletedAt: null,
          OR: [
            { senderId: user1Id, receiverId: user2Id },
            { senderId: user2Id, receiverId: user1Id },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { id: true, fullName: true, avatar: true } } },
      }),
      this.prisma.message.count({
        where: {
          deletedAt: null,
          OR: [
            { senderId: user1Id, receiverId: user2Id },
            { senderId: user2Id, receiverId: user1Id },
          ],
        },
      }),
    ]);
    return { data: data.reverse(), total, page, limit };
  }

  async getInbox(userId: string) {
    return this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }], deletedAt: null },
      orderBy: { createdAt: 'desc' },
      distinct: ['receiverId'],
      take: 20,
      include: { sender: { select: { id: true, fullName: true, avatar: true } } },
    });
  }

  async markRead(messageId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: { id: messageId, receiverId: userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: { receiverId: userId, isRead: false, deletedAt: null },
    });
    return { unreadCount: count };
  }
}
