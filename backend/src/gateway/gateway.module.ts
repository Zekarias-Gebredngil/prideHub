import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../modules/messages/messages.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [MessagesModule, NotificationsModule],
  providers: [ChatGateway],
})
export class GatewayModule {}
