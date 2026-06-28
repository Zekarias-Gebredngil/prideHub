import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { UserRole } from '@prisma/client';
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
  @MaxLength(500)
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  priceUnit?: string;
}

export class UpdateVendorProfileDto extends PartialType(CreateVendorProfileDto) {}

@Injectable()
export class VendorsService implements OnModuleInit {
  private readonly logger = new Logger(VendorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** One-time idempotent migration: promote any existing vendor-profile owners to VENDOR role. */
  async onModuleInit() {
    const profiles = await this.prisma.vendorProfile.findMany({
      where: { deletedAt: null, user: { role: { not: UserRole.VENDOR } } },
      select: { id: true, userId: true },
    });

    if (profiles.length === 0) return;

    this.logger.log(`Migrating ${profiles.length} existing vendor profile(s) to VENDOR role…`);

    for (const p of profiles) {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: p.userId }, data: { role: UserRole.VENDOR } });
        await tx.vendorWallet.upsert({
          where: { vendorId: p.id },
          create: { vendorId: p.id },
          update: {},
        });
      });
    }

    this.logger.log('Vendor role migration complete.');
  }

  private makeSlug(name: string) {
    return slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }

  async createProfile(userId: string, dto: CreateVendorProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert the vendor profile
      const profile = await tx.vendorProfile.upsert({
        where: { userId },
        create: { ...dto, userId, slug: this.makeSlug(dto.businessName) },
        update: { ...dto },
        include: { category: true, user: { select: { id: true, fullName: true, email: true, avatar: true } } },
      });

      // 2. Promote user role to VENDOR
      await tx.user.update({
        where: { id: userId },
        data: { role: UserRole.VENDOR },
      });

      // 3. Initialize the vendor wallet (idempotent)
      await tx.vendorWallet.upsert({
        where: { vendorId: profile.id },
        create: { vendorId: profile.id },
        update: {},
      });

      return profile;
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

  async findMe(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      include: { category: true }
    });
    if (!profile) throw new NotFoundException('Vendor profile not found');
    return profile;
  }

  async updateMe(userId: string, dto: UpdateVendorProfileDto) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Vendor profile not found');
    
    return this.prisma.vendorProfile.update({
      where: { userId },
      data: dto
    });
  }

  async getAnalytics(userId: string) {
    const vendor = await this.findMe(userId);
    const servicesCount = await this.prisma.service.count({ where: { vendorId: vendor.id, deletedAt: null } });
    
    // Count bookings that contain an item for this vendor
    const bookingsCount = await this.prisma.booking.count({ 
      where: { items: { some: { vendorId: vendor.id } } } 
    });
    
    // Calculate total revenue from completed booking items for this vendor
    const completedItems = await this.prisma.bookingItem.findMany({ 
      where: { 
        vendorId: vendor.id, 
        booking: { status: 'COMPLETED' } 
      },
      select: { totalPrice: true }
    });
    const revenue = completedItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
    
    // Get recent bookings involving this vendor
    const recentBookings = await this.prisma.booking.findMany({
      where: { items: { some: { vendorId: vendor.id } } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { fullName: true } } }
    });

    return {
      data: {
        revenue,
        bookingsCount,
        servicesCount,
        recentBookings
      }
    };
  }

  async getReviews(userId: string) {
    const vendor = await this.findMe(userId);
    const reviews = await this.prisma.review.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, avatar: true } } }
    });
    return { data: reviews };
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
