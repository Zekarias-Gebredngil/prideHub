import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { CreateBookingDto, UpdateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { BookingStatus, UserRole } from '@prisma/client';
import { JwtUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateBookingNumber(): string {
    const prefix = 'PH';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async create(clientId: string, dto: CreateBookingDto) {
    let totalAmount = 0;

    if (dto.packageId) {
      const pkg = await this.prisma.package.findUnique({ where: { id: dto.packageId } });
      if (pkg) {
        const discount = pkg.discountPct ? Number(pkg.discountPct) : 0;
        totalAmount = Number(pkg.price) * (1 - discount / 100);
      }
    } else if (dto.budgetMax) {
      totalAmount = dto.budgetMax;
    }

    return this.prisma.booking.create({
      data: {
        bookingNumber: this.generateBookingNumber(),
        clientId,
        eventType: dto.eventType,
        eventDate: new Date(dto.eventDate),
        packageId: dto.packageId,
        venueId: dto.venueId,
        guestCount: dto.guestCount,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        specialRequests: dto.specialRequests,
        totalAmount,
      },
      include: { package: true, venue: true },
    });
  }

  async findAll(dto: PaginationDto, user: JwtUser) {
    const adminRoles: string[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER];
    const isAdmin = adminRoles.includes(user.role);

    const where: any = {
      deletedAt: null,
      ...(dto.search && {
        OR: [
          { bookingNumber: { contains: dto.search, mode: 'insensitive' } },
          { client: { email: { contains: dto.search, mode: 'insensitive' } } },
        ],
      }),
      ...(!isAdmin && { clientId: user.sub }),
    };

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, fullName: true, email: true, avatar: true } },
          planner: { select: { id: true, fullName: true, email: true } },
          package: { select: { id: true, name: true, tier: true } },
          venue: { select: { id: true, name: true, city: true } },
          _count: { select: { items: true, payments: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return paginate(data, total, dto);
  }

  async findOne(id: string, user: JwtUser) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: { select: { id: true, fullName: true, email: true, phone: true, avatar: true } },
        planner: { select: { id: true, fullName: true, email: true } },
        package: true,
        venue: true,
        items: { include: { service: true, vendor: true } },
        event: true,
        invoices: true,
        payments: true,
        tasks: { orderBy: { createdAt: 'desc' } },
        contracts: true,
        timeline: { orderBy: { sortOrder: 'asc' } },
        files: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const adminRoles2: string[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER];
    const isOwner = booking.clientId === user.sub;
    const isAdmin = adminRoles2.includes(user.role);
    if (!isOwner && !isAdmin) throw new ForbiddenException('Access denied');

    return booking;
  }

  async update(id: string, dto: UpdateBookingDto, user: JwtUser) {
    const booking = await this.prisma.booking.findFirst({ where: { id, deletedAt: null } });
    if (!booking) throw new NotFoundException('Booking not found');

    const adminRoles3: string[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER];
    if (!adminRoles3.includes(user.role) && booking.clientId !== user.sub) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...dto,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      },
      include: { package: true, venue: true },
    });
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto, user: JwtUser) {
    const booking = await this.prisma.booking.findFirst({ where: { id, deletedAt: null } });
    if (!booking) throw new NotFoundException('Booking not found');

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
    });

    // Create timeline entry on status change
    await this.prisma.timelineEntry.create({
      data: {
        bookingId: id,
        title: `Status changed to ${dto.status}`,
        description: dto.notes,
        date: new Date(),
        isDone: true,
      },
    });

    return updated;
  }

  async getStats() {
    const [total, pending, confirmed, completed, cancelled, revenue] = await Promise.all([
      this.prisma.booking.count({ where: { deletedAt: null } }),
      this.prisma.booking.count({ where: { deletedAt: null, status: BookingStatus.PENDING } }),
      this.prisma.booking.count({ where: { deletedAt: null, status: BookingStatus.CONFIRMED } }),
      this.prisma.booking.count({ where: { deletedAt: null, status: BookingStatus.COMPLETED } }),
      this.prisma.booking.count({ where: { deletedAt: null, status: BookingStatus.CANCELLED } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
    ]);
    return { total, pending, confirmed, completed, cancelled, totalRevenue: revenue._sum.amount || 0 };
  }

  async softDelete(id: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id, deletedAt: null } });
    if (!booking) throw new NotFoundException('Booking not found');
    await this.prisma.booking.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Booking deleted' };
  }
}
