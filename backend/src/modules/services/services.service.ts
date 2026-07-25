import { Injectable, NotFoundException } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
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
  @MaxLength(2000)
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

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class ServiceQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) { }

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) { }

  private makeSlug(name: string) {
    return slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }

  async create(dto: CreateServiceDto, userId?: string, role?: string) {
    let vendorId: string | undefined = dto.vendorId;
    if (role === 'VENDOR' && userId) {
      let vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
      if (!vendor) {
        let firstCategory = await this.prisma.vendorCategory.findFirst();
        if (!firstCategory) {
          firstCategory = await this.prisma.vendorCategory.create({
            data: { name: 'General Services', slug: 'general-services' }
          });
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        vendor = await this.prisma.vendorProfile.create({
          data: {
            userId,
            businessName: user?.fullName || 'My Business',
            slug: this.makeSlug(user?.fullName || 'vendor-' + userId.substring(0, 6)),
            categoryId: firstCategory.id,
          },
        });
      }
      vendorId = vendor.id;
    }

    const { metadata, ...rest } = dto;

    return this.prisma.service.create({
      data: {
        ...rest,
        vendorId,
        slug: this.makeSlug(dto.name),
        metadata: metadata ? (metadata as any) : undefined,
      },
      include: { category: true },
    });
  }

  async findAll(dto: ServiceQueryDto, categoryId?: string, vendorId?: string, currentUserId?: string) {
    let targetVendorId = vendorId || dto.vendorId;
    if (targetVendorId === 'me' && currentUserId) {
      const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId: currentUserId } });
      targetVendorId = vendor?.id || '00000000-0000-0000-0000-000000000000';
    }

    const effectiveCatId = categoryId || dto.categoryId;

    const where: any = {
      deletedAt: null,
      ...(effectiveCatId && { categoryId: effectiveCatId }),
      ...(targetVendorId && { vendorId: targetVendorId }),
      ...(dto.search && { name: { contains: dto.search, mode: 'insensitive' } }),
    };
    if (!targetVendorId) {
      where.isActive = true;
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: dto.sortBy ? { [dto.sortBy]: dto.sortOrder } : { sortOrder: 'asc' },
        include: {
          category: true,
          media: { take: 1 },
          vendor: {
            select: {
              id: true,
              businessName: true,
              logo: true,
              slug: true,
              averageRating: true,
              isVerified: true,
            },
          },
        },
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

  async findMine(userId: string) {
    // Get or auto-create vendor profile
    let vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return [];
      let firstCategory = await this.prisma.vendorCategory.findFirst();
      if (!firstCategory) {
        firstCategory = await this.prisma.vendorCategory.create({
          data: { name: 'General Services', slug: 'general-services' },
        });
      }
      vendor = await this.prisma.vendorProfile.create({
        data: {
          userId,
          businessName: user.fullName || 'My Business',
          slug: this.makeSlug(user.fullName || 'vendor-' + userId.substring(0, 6)),
          categoryId: firstCategory.id,
        },
      });
      await this.prisma.vendorWallet.upsert({
        where: { vendorId: vendor.id },
        create: { vendorId: vendor.id },
        update: {},
      });
    }

    return this.prisma.service.findMany({
      where: { vendorId: vendor.id, deletedAt: null },
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

    const { metadata, ...rest } = dto;

    return this.prisma.service.update({
      where: { id },
      data: {
        ...rest,
        slug: dto.name ? this.makeSlug(dto.name) : undefined,
        metadata: metadata ? (metadata as any) : undefined,
      },
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

