import { Injectable, NotFoundException } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import slugify from 'slugify';

export class CreateVenueDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDesc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  googleMapsUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCapacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerDay?: number;

  @IsOptional()
  @IsObject()
  amenities?: Record<string, unknown>;

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
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;
}

export class UpdateVenueDto extends PartialType(CreateVenueDto) {}

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  private makeSlug(name: string) {
    return slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }

  async create(dto: CreateVenueDto) {
    return this.prisma.venue.create({
      data: {
        ...dto,
        slug: this.makeSlug(dto.name),
        amenities: dto.amenities ? (dto.amenities as any) : undefined,
      },
    });
  }

  async findAll(dto: PaginationDto, city?: string) {
    const where: any = {
      isActive: true,
      deletedAt: null,
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(dto.search && {
        OR: [
          { name: { contains: dto.search, mode: 'insensitive' } },
          { city: { contains: dto.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.venue.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: dto.sortBy
          ? { [dto.sortBy]: dto.sortOrder }
          : { isFeatured: 'desc' },
        include: { media: { take: 3 }, _count: { select: { reviews: true } } },
      }),
      this.prisma.venue.count({ where }),
    ]);

    return paginate(data, total, dto);
  }

  async findFeatured() {
    return this.prisma.venue.findMany({
      where: { isFeatured: true, isActive: true, deletedAt: null },
      take: 6,
      include: { media: { take: 1 } },
    });
  }

  async findBySlug(slug: string) {
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const venue = await this.prisma.venue.findFirst({
      where: {
        ...(isId ? { id: slug } : { slug }),
        deletedAt: null
      },
      include: {
        media: true,
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { fullName: true, avatar: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        availability: { where: { date: { gte: new Date() } }, take: 60 },
        vendor: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            slug: true,
            user: { select: { id: true, fullName: true, avatar: true } },
          },
        },
      },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async update(id: string, dto: UpdateVenueDto) {
    const venue = await this.prisma.venue.findFirst({ where: { id, deletedAt: null } });
    if (!venue) throw new NotFoundException('Venue not found');
    return this.prisma.venue.update({
      where: { id },
      data: {
        ...dto,
        amenities: dto.amenities ? (dto.amenities as any) : undefined,
        slug: dto.name ? this.makeSlug(dto.name) : undefined,
      },
    });
  }

  async checkAvailability(id: string, date: string) {
    const venue = await this.prisma.venue.findFirst({ where: { id, deletedAt: null } });
    if (!venue) throw new NotFoundException('Venue not found');
    const avail = await this.prisma.venueAvailability.findUnique({
      where: { venueId_date: { venueId: id, date: new Date(date) } },
    });
    return { available: !avail?.isBooked, date };
  }

  async softDelete(id: string) {
    const venue = await this.prisma.venue.findFirst({ where: { id, deletedAt: null } });
    if (!venue) throw new NotFoundException('Venue not found');
    await this.prisma.venue.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Venue deleted' };
  }
}
