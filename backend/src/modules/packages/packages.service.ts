import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import slugify from 'slugify';

export class CreatePackageDto {
  name: string;
  tier: string;
  description?: string;
  shortDesc?: string;
  price: number;
  discountPct?: number;
  isFeatured?: boolean;
  maxGuests?: number;
  duration?: string;
  color?: string;
  items?: { description: string; isIncluded: boolean }[];
  addOns?: { name: string; price: number }[];
}

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  private makeSlug(name: string) {
    return slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }

  async create(dto: CreatePackageDto) {
    const { items, addOns, ...rest } = dto;
    return this.prisma.package.create({
      data: {
        ...rest,
        slug: this.makeSlug(dto.name),
        items: items ? { createMany: { data: items.map((i, idx) => ({ ...i, sortOrder: idx })) } } : undefined,
        addOns: addOns ? { createMany: { data: addOns } } : undefined,
      },
      include: { items: true, addOns: true, media: { take: 1 } },
    });
  }

  async findAll(dto: PaginationDto) {
    const where: any = {
      isActive: true,
      deletedAt: null,
      ...(dto.search && { name: { contains: dto.search, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: { sortOrder: 'asc' },
        include: { items: { orderBy: { sortOrder: 'asc' } }, addOns: true, media: { take: 1 } },
      }),
      this.prisma.package.count({ where }),
    ]);

    return paginate(data, total, dto);
  }

  async findFeatured() {
    return this.prisma.package.findMany({
      where: { isFeatured: true, isActive: true, deletedAt: null },
      take: 4,
      orderBy: { sortOrder: 'asc' },
      include: { items: { orderBy: { sortOrder: 'asc' } }, addOns: true, media: { take: 1 } },
    });
  }

  async findBySlug(slug: string) {
    const pkg = await this.prisma.package.findFirst({
      where: { slug, deletedAt: null },
      include: { items: { orderBy: { sortOrder: 'asc' } }, addOns: true, media: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async update(id: string, dto: Partial<CreatePackageDto>) {
    const pkg = await this.prisma.package.findFirst({ where: { id, deletedAt: null } });
    if (!pkg) throw new NotFoundException('Package not found');
    const { items, addOns, ...rest } = dto;
    return this.prisma.package.update({
      where: { id },
      data: { ...rest, slug: dto.name ? this.makeSlug(dto.name) : undefined },
      include: { items: true, addOns: true },
    });
  }

  async softDelete(id: string) {
    const pkg = await this.prisma.package.findFirst({ where: { id, deletedAt: null } });
    if (!pkg) throw new NotFoundException('Package not found');
    await this.prisma.package.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Package deleted' };
  }
}
