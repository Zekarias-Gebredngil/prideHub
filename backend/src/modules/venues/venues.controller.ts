import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VenuesService, CreateVenueDto } from './venues.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Venues')
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Public() @Get()
  @ApiOperation({ summary: 'Get all venues' })
  findAll(@Query() dto: PaginationDto, @Query('city') city?: string) {
    return this.venuesService.findAll(dto, city);
  }

  @Public() @Get('featured')
  @ApiOperation({ summary: 'Get featured venues' })
  findFeatured() { return this.venuesService.findFeatured(); }

  @Public() @Get(':slug')
  @ApiOperation({ summary: 'Get venue by slug' })
  findBySlug(@Param('slug') slug: string) { return this.venuesService.findBySlug(slug); }

  @Public() @Get(':id/availability')
  @ApiOperation({ summary: 'Check venue availability' })
  checkAvailability(@Param('id') id: string, @Query('date') date: string) {
    return this.venuesService.checkAvailability(id, date);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateVenueDto) { return this.venuesService.create(dto); }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateVenueDto>) {
    return this.venuesService.update(id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.venuesService.softDelete(id); }
}
