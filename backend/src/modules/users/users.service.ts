import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const where = dto.search
      ? {
          OR: [
            { email: { contains: dto.search, mode: 'insensitive' as const } },
            { firstName: { contains: dto.search, mode: 'insensitive' as const } },
            { lastName: { contains: dto.search, mode: 'insensitive' as const } },
          ],
          deletedAt: null,
        }
      : { deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          fullName: true, avatar: true, role: true, status: true,
          isEmailVerified: true, createdAt: true, lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(data, total, dto);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password, twoFactorSecret, ...safe } = user;
    return safe;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (exists) throw new ConflictException('Email already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        fullName: dto.firstName || dto.lastName
          ? `${dto.firstName || user.firstName} ${dto.lastName || user.lastName}`
          : undefined,
      },
    });

    const { password, twoFactorSecret, ...safe } = updated;
    return safe;
  }

  async updateStatus(id: string, status: UserStatus) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id }, data: { status } });
  }

  async softDelete(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'User deleted' };
  }

  async getStats() {
    const [total, active, admins, vendors, clients, planners] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { deletedAt: null, role: UserRole.ADMIN } }),
      this.prisma.user.count({ where: { deletedAt: null, role: UserRole.VENDOR } }),
      this.prisma.user.count({ where: { deletedAt: null, role: UserRole.CLIENT } }),
      this.prisma.user.count({ where: { deletedAt: null, role: UserRole.EVENT_PLANNER } }),
    ]);
    return { total, active, admins, vendors, clients, planners };
  }
}
