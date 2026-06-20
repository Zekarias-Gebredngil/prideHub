import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

export class CreateTestimonialDto {
  clientName: string;
  clientTitle?: string;
  avatar?: string;
  rating: number;
  content: string;
  eventType?: string;
}

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({ data: dto });
  }

  async findAll(dto: PaginationDto, approvedOnly = true) {
    const where: any = { ...(approvedOnly && { isApproved: true }) };
    const [data, total] = await Promise.all([
      this.prisma.testimonial.findMany({
        where, skip: dto.skip, take: dto.take,
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      }),
      this.prisma.testimonial.count({ where }),
    ]);
    return paginate(data, total, dto);
  }

  async findFeatured() {
    return this.prisma.testimonial.findMany({
      where: { isFeatured: true, isApproved: true },
      take: 6,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async approve(id: string) {
    const t = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Testimonial not found');
    return this.prisma.testimonial.update({
      where: { id },
      data: { isApproved: true, approvedAt: new Date() },
    });
  }

  async setFeatured(id: string, isFeatured: boolean) {
    return this.prisma.testimonial.update({ where: { id }, data: { isFeatured } });
  }

  async delete(id: string) {
    await this.prisma.testimonial.delete({ where: { id } });
    return { message: 'Testimonial deleted' };
  }
}
