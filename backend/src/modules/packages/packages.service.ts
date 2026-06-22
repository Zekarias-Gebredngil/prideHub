import { Injectable, NotFoundException } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import slugify from 'slugify';

export class PackageItemDto {
  @IsString()
  description: string;

  @IsBoolean()
  isIncluded: boolean;
}

export class PackageAddOnDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreatePackageDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(50)
  tier: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDesc?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPct?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxGuests?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageItemDto)
  items?: PackageItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageAddOnDto)
  addOns?: PackageAddOnDto[];
}

export class UpdatePackageDto extends PartialType(CreatePackageDto) {}

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  private makeSlug(name: string) {
    return slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }

  async create(dto: CreatePackageDto) {
    const { items, addOns, ...rest } = dto;
    return this.prisma.package.create({
      data: {
        ...rest,
        slug: this.makeSlug(dto.name),
        items: items ? { createMany: { data: items.map((i, idx) => ({ ...i, sortOrder: idx })) } } : undefined,
        addOns: addOns ? { createMany: { data: addOns } } : undefined,
      },
      include: { items: true, addOns: true, media: { take: 1 } },
    });
  }

  async findAll(dto: PaginationDto) {
    const where: any = {
      isActive: true,
      deletedAt: null,
      ...(dto.search && { name: { contains: dto.search, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: { sortOrder: 'asc' },
        include: { items: { orderBy: { sortOrder: 'asc' } }, addOns: true, media: { take: 1 } },
      }),
      this.prisma.package.count({ where }),
    ]);

    return paginate(data, total, dto);
  }

  async findFeatured() {
    return this.prisma.package.findMany({
      where: { isFeatured: true, isActive: true, deletedAt: null },
      take: 4,
      orderBy: { sortOrder: 'asc' },
      include: { items: { orderBy: { sortOrder: 'asc' } }, addOns: true, media: { take: 1 } },
    });
  }

  async findBySlug(slug: string) {
    const pkg = await this.prisma.package.findFirst({
      where: { slug, deletedAt: null },
      include: { items: { orderBy: { sortOrder: 'asc' } }, addOns: true, media: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto) {
    const pkg = await this.prisma.package.findFirst({ where: { id, deletedAt: null } });
    if (!pkg) throw new NotFoundException('Package not found');
    const { items, addOns, ...rest } = dto;
    return this.prisma.package.update({
      where: { id },
      data: { 
        ...rest, 
        slug: dto.name ? this.makeSlug(dto.name) : undefined,
        ...(items !== undefined && {
          items: {
            deleteMany: {},
            createMany: { data: items.map((i, idx) => ({ ...i, sortOrder: idx })) }
          }
        }),
        ...(addOns !== undefined && {
          addOns: {
            deleteMany: {},
            createMany: { data: addOns }
          }
        }),
      },
      include: { items: true, addOns: true },
    });
  }

  async softDelete(id: string) {
    const pkg = await this.prisma.package.findFirst({ where: { id, deletedAt: null } });
    if (!pkg) throw new NotFoundException('Package not found');
    await this.prisma.package.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Package deleted' };
  }
}
