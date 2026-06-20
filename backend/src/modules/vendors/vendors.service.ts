import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import slugify from 'slugify';

export class CreateVendorProfileDto {
  businessName: string;
  categoryId: string;
  description?: string;
  bio?: string;
  address?: string;
  city?: string;
  website?: string;
  basePrice?: number;
  priceUnit?: string;
}

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
    const vendor = await this.prisma.vendorProfile.findFirst({
      where: { slug, deletedAt: null },
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

  async update(id: string, dto: Partial<CreateVendorProfileDto>) {
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
