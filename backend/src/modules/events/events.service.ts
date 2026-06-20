import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromBooking(bookingId: string, name: string, startDate: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id: bookingId, deletedAt: null } });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.event.create({
      data: { bookingId, name, startDate: new Date(startDate), budgetTotal: booking.totalAmount },
      include: { booking: { select: { bookingNumber: true, client: { select: { fullName: true } } } } },
    });
  }

  async findByBooking(bookingId: string) {
    return this.prisma.event.findUnique({
      where: { bookingId },
      include: {
        tasks: { orderBy: { dueDate: 'asc' } },
        timeline: { orderBy: { sortOrder: 'asc' } },
        booking: {
          include: {
            client: { select: { fullName: true, email: true, avatar: true } },
            planner: { select: { fullName: true } },
            venue: true,
            items: { include: { vendor: true, service: true } },
          },
        },
      },
    });
  }

  async updateProgress(id: string, progress: number) {
    return this.prisma.event.update({ where: { id }, data: { progress } });
  }

  async addTask(eventId: string, createdById: string, dto: { title: string; description?: string; dueDate?: string; assignedToId?: string; priority?: string }) {
    return this.prisma.task.create({
      data: { eventId, createdById, ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
      include: { assignedTo: { select: { fullName: true } } },
    });
  }

  async completeTask(taskId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { isCompleted: true, completedAt: new Date() },
    });
  }

  async addTimelineEntry(eventId: string, dto: { title: string; description?: string; date: string }) {
    return this.prisma.timelineEntry.create({
      data: { eventId, title: dto.title, description: dto.description, date: new Date(dto.date) },
    });
  }

  async getUpcomingEvents() {
    return this.prisma.event.findMany({
      where: { startDate: { gte: new Date() } },
      take: 10,
      orderBy: { startDate: 'asc' },
      include: { booking: { include: { client: { select: { fullName: true } }, venue: { select: { name: true } } } } },
    });
  }
}
