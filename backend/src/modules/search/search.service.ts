import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(query: string, limit = 5) {
    if (!query || query.trim().length < 2) return { results: [] };

    const q = query.trim();
    const ilike = { contains: q, mode: 'insensitive' as const };

    const [services, packages, venues, vendors, blogs] = await Promise.all([
      this.prisma.service.findMany({
        where: { isActive: true, deletedAt: null, OR: [{ name: ilike }, { description: ilike }] },
        take: limit,
        select: { id: true, name: true, slug: true, coverImage: true },
      }),
      this.prisma.package.findMany({
        where: { isActive: true, deletedAt: null, name: ilike },
        take: limit,
        select: { id: true, name: true, slug: true, tier: true, coverImage: true },
      }),
      this.prisma.venue.findMany({
        where: { isActive: true, deletedAt: null, OR: [{ name: ilike }, { city: ilike }] },
        take: limit,
        select: { id: true, name: true, slug: true, city: true, coverImage: true },
      }),
      this.prisma.vendorProfile.findMany({
        where: { deletedAt: null, OR: [{ businessName: ilike }, { description: ilike }] },
        take: limit,
        select: { id: true, businessName: true, slug: true, logo: true },
      }),
      this.prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', deletedAt: null, OR: [{ title: ilike }, { excerpt: ilike }] },
        take: limit,
        select: { id: true, title: true, slug: true, coverImage: true },
      }),
    ]);

    return {
      results: [
        ...services.map((s) => ({ type: 'service', ...s })),
        ...packages.map((p) => ({ type: 'package', ...p })),
        ...venues.map((v) => ({ type: 'venue', ...v })),
        ...vendors.map((v) => ({ type: 'vendor', name: v.businessName, slug: v.slug, image: v.logo })),
        ...blogs.map((b) => ({ type: 'blog', ...b })),
      ],
      counts: {
        services: services.length,
        packages: packages.length,
        venues: venues.length,
        vendors: vendors.length,
        blogs: blogs.length,
      },
    };
  }

  async fullTextSearch(query: string, entity: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const ilike = { contains: query, mode: 'insensitive' as const };

    switch (entity) {
      case 'services':
        return this.prisma.service.findMany({
          where: { isActive: true, deletedAt: null, OR: [{ name: ilike }, { description: ilike }] },
          skip, take: limit,
          include: { category: true, media: { take: 1 } },
        });
      case 'venues':
        return this.prisma.venue.findMany({
          where: { isActive: true, deletedAt: null, OR: [{ name: ilike }, { description: ilike }, { city: ilike }] },
          skip, take: limit,
          include: { media: { take: 1 } },
        });
      case 'vendors':
        return this.prisma.vendorProfile.findMany({
          where: { deletedAt: null, OR: [{ businessName: ilike }, { description: ilike }] },
          skip, take: limit,
          include: { category: true },
        });
      case 'blogs':
        return this.prisma.blogPost.findMany({
          where: { status: 'PUBLISHED', deletedAt: null, OR: [{ title: ilike }, { content: ilike }] },
          skip, take: limit,
          include: { author: { select: { fullName: true } }, category: true },
        });
      default:
        return [];
    }
  }
}
