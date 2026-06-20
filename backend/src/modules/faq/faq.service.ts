import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: { question: string; answer: string; category?: string; sortOrder?: number }) {
    return this.prisma.faq.create({ data: dto });
  }

  async findAll(category?: string) {
    return this.prisma.faq.findMany({
      where: { isActive: true, ...(category && { category }) },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async update(id: string, dto: Partial<{ question: string; answer: string; category: string; sortOrder: number; isActive: boolean }>) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ not found');
    return this.prisma.faq.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.prisma.faq.delete({ where: { id } });
    return { message: 'FAQ deleted' };
  }
}
