import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PackagesService, CreatePackageDto, UpdatePackageDto } from './packages.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Public() @Get()
  @ApiOperation({ summary: 'Get all packages' })
  findAll(@Query() dto: PaginationDto) { return this.packagesService.findAll(dto); }

  @Public() @Get('featured')
  @ApiOperation({ summary: 'Get featured packages' })
  findFeatured() { return this.packagesService.findFeatured(); }

  @Public() @Get(':slug')
  @ApiOperation({ summary: 'Get package by slug' })
  findBySlug(@Param('slug') slug: string) { return this.packagesService.findBySlug(slug); }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create package' })
  create(@Body() dto: CreatePackageDto) { return this.packagesService.create(dto); }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update package' })
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.update(id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete package' })
  remove(@Param('id') id: string) { return this.packagesService.softDelete(id); }
}
