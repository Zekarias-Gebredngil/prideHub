import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

export class CreateReviewDto {
  venueId?: string;
  vendorId?: string;
  rating: number;
  comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const review = await this.prisma.review.create({
      data: { ...dto, userId },
      include: { user: { select: { fullName: true, avatar: true } } },
    });
    await this.recalculateRating(dto.venueId, dto.vendorId);
    return review;
  }

  async findAll(dto: PaginationDto, approved?: boolean) {
    const where: any = {
      ...(approved !== undefined && { isApproved: approved }),
      deletedAt: null,
    };
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where, skip: dto.skip, take: dto.take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, avatar: true } } },
      }),
      this.prisma.review.count({ where }),
    ]);
    return paginate(data, total, dto);
  }

  async approve(id: string) {
    const review = await this.prisma.review.findFirst({ where: { id, deletedAt: null } });
    if (!review) throw new NotFoundException('Review not found');
    const updated = await this.prisma.review.update({
      where: { id },
      data: { isApproved: true, approvedAt: new Date() },
    });
    await this.recalculateRating(review.venueId || undefined, review.vendorId || undefined);
    return updated;
  }

  async softDelete(id: string) {
    await this.prisma.review.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Review deleted' };
  }

  private async recalculateRating(venueId?: string | null, vendorId?: string | null) {
    if (venueId) {
      const agg = await this.prisma.review.aggregate({
        where: { venueId, isApproved: true, deletedAt: null },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await this.prisma.venue.update({
        where: { id: venueId },
        data: { averageRating: agg._avg.rating || 0, totalReviews: agg._count.rating },
      });
    }
    if (vendorId) {
      const agg = await this.prisma.review.aggregate({
        where: { vendorId, isApproved: true, deletedAt: null },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await this.prisma.vendorProfile.update({
        where: { id: vendorId },
        data: { averageRating: agg._avg.rating || 0, totalReviews: agg._count.rating },
      });
    }
  }
}
