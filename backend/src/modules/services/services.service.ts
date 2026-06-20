import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import slugify from 'slugify';

export class CreateServiceDto {
  name: string;
  categoryId: string;
  description?: string;
  shortDesc?: string;
  price?: number;
  priceUnit?: string;
  duration?: string;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDesc?: string;
}

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private makeSlug(name: string) {
    return slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }

  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: { ...dto, slug: this.makeSlug(dto.name) },
      include: { category: true },
    });
  }

  async findAll(dto: PaginationDto, categoryId?: string) {
    const where: any = {
      isActive: true,
      deletedAt: null,
      ...(categoryId && { categoryId }),
      ...(dto.search && { name: { contains: dto.search, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: dto.sortBy ? { [dto.sortBy]: dto.sortOrder } : { sortOrder: 'asc' },
        include: { category: true, media: { take: 1 } },
      }),
      this.prisma.service.count({ where }),
    ]);

    return paginate(data, total, dto);
  }

  async findFeatured() {
    return this.prisma.service.findMany({
      where: { isFeatured: true, isActive: true, deletedAt: null },
      take: 6,
      orderBy: { sortOrder: 'asc' },
      include: { category: true, media: { take: 1 } },
    });
  }

  async findBySlug(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: { slug, deletedAt: null },
      include: { category: true, media: true },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async findById(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, media: true },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: Partial<CreateServiceDto>) {
    const service = await this.prisma.service.findFirst({ where: { id, deletedAt: null } });
    if (!service) throw new NotFoundException('Service not found');
    return this.prisma.service.update({
      where: { id },
      data: { ...dto, slug: dto.name ? this.makeSlug(dto.name) : undefined },
      include: { category: true },
    });
  }

  async softDelete(id: string) {
    const service = await this.prisma.service.findFirst({ where: { id, deletedAt: null } });
    if (!service) throw new NotFoundException('Service not found');
    await this.prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Service deleted' };
  }

  async getCategories() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { services: true } } },
    });
  }
}
