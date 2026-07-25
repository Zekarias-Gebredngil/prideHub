import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService, CreateServiceDto, UpdateServiceDto, ServiceQueryDto } from './services.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all services' })
  findAll(@Query() query: ServiceQueryDto, @CurrentUser() user?: any) {
    return this.servicesService.findAll(query, query.categoryId, query.vendorId, user?.sub);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured services' })
  findFeatured() {
    return this.servicesService.findFeatured();
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get service categories' })
  getCategories() {
    return this.servicesService.getCategories();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  @ApiOperation({ summary: 'Get my services (authenticated vendor)' })
  findMine(@CurrentUser() user: any) {
    return this.servicesService.findMine(user.sub);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get service by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.servicesService.findBySlug(slug);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR)
  @Post()
  @ApiOperation({ summary: 'Create service' })
  create(@Body() dto: CreateServiceDto, @CurrentUser() user: any) {
    return this.servicesService.create(dto, user.sub, user.role);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update service' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto, @CurrentUser() user: any) {
    return this.servicesService.update(id, dto, user.sub, user.role);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.softDelete(id, user.sub, user.role);
  }
}

