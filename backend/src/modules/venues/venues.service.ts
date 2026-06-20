import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import slugify from 'slugify';

export class CreateVenueDto {
  name: string;
  description?: string;
  shortDesc?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  capacity?: number;
  minCapacity?: number;
  pricePerDay?: number;
  amenities?: Record<string, unknown>;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDesc?: string;
}

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
    const venue = await this.prisma.venue.findFirst({
      where: { slug, deletedAt: null },
      include: {
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
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async update(id: string, dto: Partial<CreateVenueDto>) {
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
