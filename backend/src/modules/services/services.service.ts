import { Injectable, NotFoundException } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import slugify from 'slugify';

export class CreateServiceDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDesc?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  priceUnit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoDesc?: string;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) { }

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) { }

  private makeSlug(name: string) {
    return slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }

  async create(dto: CreateServiceDto, userId?: string, role?: string) {
    let vendorId: string | undefined;
    if (role === 'VENDOR' && userId) {
      const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
      if (!vendor) throw new NotFoundException('Vendor profile not found');
      vendorId = vendor.id;
    }

    return this.prisma.service.create({
      data: { ...dto, vendorId, slug: this.makeSlug(dto.name) },
      include: { category: true },
    });
  }

  async findAll(dto: PaginationDto, categoryId?: string, vendorId?: string) {
    const where: any = {
      isActive: true,
      deletedAt: null,
      ...(categoryId && { categoryId }),
      ...(vendorId && { vendorId }),
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

  async update(id: string, dto: UpdateServiceDto, userId?: string, role?: string) {
    const service = await this.prisma.service.findFirst({ where: { id, deletedAt: null } });
    if (!service) throw new NotFoundException('Service not found');

    if (role === 'VENDOR') {
      const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
      if (service.vendorId !== vendor?.id) {
        throw new NotFoundException('Service not found or unauthorized');
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: { ...dto, slug: dto.name ? this.makeSlug(dto.name) : undefined },
      include: { category: true },
    });
  }

  async softDelete(id: string, userId?: string, role?: string) {
    const service = await this.prisma.service.findFirst({ where: { id, deletedAt: null } });
    if (!service) throw new NotFoundException('Service not found');

    if (role === 'VENDOR') {
      const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
      if (service.vendorId !== vendor?.id) {
        throw new NotFoundException('Service not found or unauthorized');
      }
    }

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

