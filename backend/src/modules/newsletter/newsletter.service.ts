import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(email: string, name?: string) {
    const existing = await this.prisma.newsletter.findUnique({ where: { email } });
    if (existing) {
      if (existing.isActive) throw new ConflictException('Email already subscribed');
      return this.prisma.newsletter.update({ where: { email }, data: { isActive: true, unsubscribedAt: null } });
    }
    return this.prisma.newsletter.create({ data: { email, name } });
  }

  async unsubscribe(email: string) {
    await this.prisma.newsletter.updateMany({
      where: { email },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
    return { message: 'Unsubscribed successfully' };
  }

  async findAll(dto: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.newsletter.findMany({
        where: { isActive: true },
        skip: dto.skip, take: dto.take,
        orderBy: { subscribedAt: 'desc' },
      }),
      this.prisma.newsletter.count({ where: { isActive: true } }),
    ]);
    return paginate(data, total, dto);
  }

  async getCount() {
    const count = await this.prisma.newsletter.count({ where: { isActive: true } });
    return { count };
  }
}
