import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import slugify from 'slugify';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGalleryAlbumDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;
}

export class AddGalleryMediaDto {
  @IsString()
  @MaxLength(500)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string;
}

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async createAlbum(dto: CreateGalleryAlbumDto) {
    return this.prisma.galleryAlbum.create({
      data: { ...dto, slug: slugify(dto.title, { lower: true }) + '-' + Date.now().toString(36) },
    });
  }

  async updateAlbum(id: string, dto: Partial<CreateGalleryAlbumDto>) {
    const album = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!album) throw new NotFoundException('Album not found');
    return this.prisma.galleryAlbum.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.title && { slug: slugify(dto.title, { lower: true }) + '-' + Date.now().toString(36) }),
      },
    });
  }

  async findAllAlbums(dto: PaginationDto, category?: string) {
    const where: any = { isPublic: true, ...(category && { category }) };
    const [data, total] = await Promise.all([
      this.prisma.galleryAlbum.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { media: true } }, media: { take: 1, orderBy: { sortOrder: 'asc' } } },
      }),
      this.prisma.galleryAlbum.count({ where }),
    ]);
    return paginate(data, total, dto);
  }

  async findAlbum(slug: string) {
    const album = await this.prisma.galleryAlbum.findFirst({
      where: { slug },
      include: { media: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!album) throw new NotFoundException('Album not found');
    return album;
  }

  async addMedia(albumId: string, dto: AddGalleryMediaDto) {
    const album = await this.prisma.galleryAlbum.findUnique({ where: { id: albumId } });
    if (!album) throw new NotFoundException('Album not found');
    return this.prisma.media.create({
      data: { ...dto, galleryId: albumId, type: (dto.type as any) || 'IMAGE' },
    });
  }

  async getMediaByAlbum(albumId: string, dto: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where: { galleryId: albumId },
        skip: dto.skip,
        take: dto.take,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.media.count({ where: { galleryId: albumId } }),
    ]);
    return paginate(data, total, dto);
  }

  async deleteMedia(id: string) {
    await this.prisma.media.delete({ where: { id } });
    return { message: 'Media deleted' };
  }
}
