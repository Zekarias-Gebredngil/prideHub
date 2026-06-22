import { Injectable, NotFoundException } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import slugify from 'slugify';

export class CreateVendorProfileDto {
  @IsString()
  @MaxLength(200)
  businessName: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  priceUnit?: string;
}

export class UpdateVendorProfileDto extends PartialType(CreateVendorProfileDto) {}

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  private makeSlug(name: string) {
    return slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }

  async createProfile(userId: string, dto: CreateVendorProfileDto) {
    return this.prisma.vendorProfile.create({
      data: { ...dto, userId, slug: this.makeSlug(dto.businessName) },
      include: { category: true, user: { select: { id: true, fullName: true, email: true, avatar: true } } },
    });
  }

  async findAll(dto: PaginationDto, categoryId?: string) {
    const where: any = {
      deletedAt: null,
      isAvailable: true,
      ...(categoryId && { categoryId }),
      ...(dto.search && {
        OR: [
          { businessName: { contains: dto.search, mode: 'insensitive' } },
          { description: { contains: dto.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: dto.sortBy ? { [dto.sortBy]: dto.sortOrder } : { averageRating: 'desc' },
        include: {
          category: true,
          user: { select: { fullName: true, avatar: true } },
          media: { take: 1 },
        },
      }),
      this.prisma.vendorProfile.count({ where }),
    ]);

    return paginate(data, total, dto);
  }

  async findBySlug(slug: string) {
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const vendor = await this.prisma.vendorProfile.findFirst({
      where: {
        ...(isId ? { id: slug } : { slug }),
        deletedAt: null
      },
      include: {
        category: true,
        user: { select: { id: true, fullName: true, email: true, avatar: true } },
        media: true,
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { fullName: true, avatar: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        availability: { where: { date: { gte: new Date() } }, take: 60 },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async getCategories() {
    return this.prisma.vendorCategory.findMany({
      include: { _count: { select: { vendors: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateVendorProfileDto) {
    const vendor = await this.prisma.vendorProfile.findFirst({ where: { id, deletedAt: null } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return this.prisma.vendorProfile.update({ where: { id }, data: dto });
  }

  async verify(id: string, isVerified: boolean) {
    const vendor = await this.prisma.vendorProfile.findFirst({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return this.prisma.vendorProfile.update({ where: { id }, data: { isVerified } });
  }

  async softDelete(id: string) {
    const vendor = await this.prisma.vendorProfile.findFirst({ where: { id, deletedAt: null } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    await this.prisma.vendorProfile.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Vendor profile deleted' };
  }
}
