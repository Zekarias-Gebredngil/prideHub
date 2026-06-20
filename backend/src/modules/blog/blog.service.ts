import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { BlogStatus } from '@prisma/client';
import slugify from 'slugify';

export class CreateBlogPostDto {
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  status?: BlogStatus;
  scheduledAt?: string;
  seoTitle?: string;
  seoDesc?: string;
  tags?: string[];
}

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  private makeSlug(title: string) {
    return slugify(title, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }

  private estimateReadTime(content: string): number {
    return Math.ceil(content.split(' ').length / 200);
  }

  async create(authorId: string, dto: CreateBlogPostDto) {
    const { tags, ...rest } = dto;
    return this.prisma.blogPost.create({
      data: {
        ...rest,
        authorId,
        slug: this.makeSlug(dto.title),
        readTime: this.estimateReadTime(dto.content),
        publishedAt: dto.status === BlogStatus.PUBLISHED ? new Date() : undefined,
        tags: tags
          ? {
              create: tags.map((tagId) => ({ tag: { connect: { id: tagId } } })),
            }
          : undefined,
      },
      include: { author: { select: { fullName: true, avatar: true } }, category: true, tags: { include: { tag: true } } },
    });
  }

  async findAll(dto: PaginationDto, categoryId?: string, status?: BlogStatus) {
    const where: any = {
      deletedAt: null,
      ...(categoryId && { categoryId }),
      ...(status ? { status } : { status: BlogStatus.PUBLISHED }),
      ...(dto.search && {
        OR: [
          { title: { contains: dto.search, mode: 'insensitive' } },
          { excerpt: { contains: dto.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { fullName: true, avatar: true } },
          category: true,
          tags: { include: { tag: true } },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return paginate(data, total, dto);
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, deletedAt: null },
      include: {
        author: { select: { fullName: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
        media: true,
        comments: {
          where: { isApproved: true, parentId: null },
          include: { replies: { where: { isApproved: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    await this.prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
    return post;
  }

  async update(id: string, dto: Partial<CreateBlogPostDto>) {
    const post = await this.prisma.blogPost.findFirst({ where: { id, deletedAt: null } });
    if (!post) throw new NotFoundException('Post not found');
    const { tags, ...rest } = dto;
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...rest,
        slug: dto.title ? this.makeSlug(dto.title) : undefined,
        publishedAt: dto.status === BlogStatus.PUBLISHED && !post.publishedAt ? new Date() : undefined,
      },
    });
  }

  async softDelete(id: string) {
    const post = await this.prisma.blogPost.findFirst({ where: { id, deletedAt: null } });
    if (!post) throw new NotFoundException('Post not found');
    await this.prisma.blogPost.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Post deleted' };
  }

  async getCategories() {
    return this.prisma.category.findMany({ include: { _count: { select: { blogPosts: true } } } });
  }

  async getTags() {
    return this.prisma.tag.findMany({ include: { _count: { select: { blogPosts: true } } } });
  }
}
