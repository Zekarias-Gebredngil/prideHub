import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('inbox')
  getInbox(@CurrentUser() user: JwtUser) { return this.messagesService.getInbox(user.sub); }

  @Get('unread')
  getUnread(@CurrentUser() user: JwtUser) { return this.messagesService.getUnreadCount(user.sub); }

  @Get(':userId')
  getConversation(@CurrentUser() user: JwtUser, @Param('userId') otherId: string, @Query('page') page = 1) {
    return this.messagesService.getConversation(user.sub, otherId, +page);
  }

  @Post()
  send(@CurrentUser() user: JwtUser, @Body() dto: { receiverId: string; content: string; bookingId?: string }) {
    return this.messagesService.sendMessage(user.sub, dto.receiverId, dto.content, dto.bookingId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.messagesService.markRead(id, user.sub);
  }
}
