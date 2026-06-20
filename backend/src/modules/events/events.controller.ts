import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Events')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('upcoming')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER)
  getUpcoming() { return this.eventsService.getUpcomingEvents(); }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER)
  create(@Body() dto: { bookingId: string; name: string; startDate: string }) {
    return this.eventsService.createFromBooking(dto.bookingId, dto.name, dto.startDate);
  }

  @Get('booking/:bookingId')
  findByBooking(@Param('bookingId') id: string) { return this.eventsService.findByBooking(id); }

  @Patch(':id/progress')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER)
  updateProgress(@Param('id') id: string, @Body('progress') progress: number) {
    return this.eventsService.updateProgress(id, progress);
  }

  @Post(':id/tasks')
  addTask(@Param('id') id: string, @CurrentUser() user: JwtUser, @Body() dto: any) {
    return this.eventsService.addTask(id, user.sub, dto);
  }

  @Patch('tasks/:taskId/complete')
  completeTask(@Param('taskId') taskId: string) { return this.eventsService.completeTask(taskId); }

  @Post(':id/timeline')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER)
  addTimeline(@Param('id') id: string, @Body() dto: any) {
    return this.eventsService.addTimelineEntry(id, dto);
  }
}
