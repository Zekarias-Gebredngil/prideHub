import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: { name: string; email: string; phone?: string; subject: string; message: string; userId?: string }) {
    return this.prisma.contact.create({ data: dto });
  }

  async findAll(dto: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        skip: dto.skip, take: dto.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count(),
    ]);
    return paginate(data, total, dto);
  }

  async markRead(id: string) {
    return this.prisma.contact.update({ where: { id }, data: { isRead: true } });
  }
}
