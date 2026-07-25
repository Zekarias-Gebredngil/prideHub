import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { MessagesService } from '../modules/messages/messages.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:4200', credentials: true },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // userId → socketId

  constructor(
    private readonly messagesService: MessagesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} connected — socket ${client.id}`);
      this.server.emit('user:online', { userId });
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.server.emit('user:offline', { userId });
        this.logger.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: { senderId: string; receiverId: string; content: string; bookingId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.sendMessage(
      data.senderId, data.receiverId, data.content, data.bookingId,
    );

    // Deliver to receiver if online
    this.server.to(`user:${data.receiverId}`).emit('message:received', message);

    // Create in-app notification
    await this.notificationsService.create(
      data.receiverId,
      NotificationType.IN_APP,
      'New Message',
      `You have a new message`,
      { messageId: message.id, senderId: data.senderId },
    );

    return message;
  }

  @SubscribeMessage('message:read')
  async handleRead(
    @MessageBody() data: { messageId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.messagesService.markRead(data.messageId, data.userId);
    client.broadcast.emit('message:read:ack', { messageId: data.messageId });
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @MessageBody() data: { senderId: string; receiverId: string },
  ) {
    this.server.to(`user:${data.receiverId}`).emit('typing:start', { userId: data.senderId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { senderId: string; receiverId: string },
  ) {
    this.server.to(`user:${data.receiverId}`).emit('typing:stop', { userId: data.senderId });
  }

  @SubscribeMessage('join:booking')
  handleJoinBooking(
    @MessageBody() data: { bookingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`booking:${data.bookingId}`);
  }

  // Broadcast booking status update to all room members
  broadcastBookingUpdate(bookingId: string, status: string, bookingNumber: string) {
    this.server.to(`booking:${bookingId}`).emit('booking:updated', { bookingId, status, bookingNumber });
  }

  // Push notification to specific user
  pushNotification(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  @SubscribeMessage('presence:get')
  handleGetPresence(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    const isOnline = this.connectedUsers.has(data.userId);
    client.emit('presence:res', { userId: data.userId, isOnline });
  }

  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}
