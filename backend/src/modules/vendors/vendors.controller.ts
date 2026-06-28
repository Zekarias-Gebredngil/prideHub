import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService, CreateVendorProfileDto, UpdateVendorProfileDto } from './vendors.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public() @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  findAll(@Query() dto: PaginationDto, @Query('categoryId') categoryId?: string) {
    return this.vendorsService.findAll(dto, categoryId);
  }

  @Public() @Get('categories')
  @ApiOperation({ summary: 'Get vendor categories' })
  getCategories() { return this.vendorsService.getCategories(); }

  @Public() @Get(':slug')
  @ApiOperation({ summary: 'Get vendor by slug' })
  findBySlug(@Param('slug') slug: string) { return this.vendorsService.findBySlug(slug); }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @ApiOperation({ summary: 'Create vendor profile' })
  createProfile(@CurrentUser() user: JwtUser, @Body() dto: CreateVendorProfileDto) {
    return this.vendorsService.createProfile(user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current vendor profile' })
  findMe(@CurrentUser() user: JwtUser) {
    return this.vendorsService.findMe(user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me/analytics')
  @ApiOperation({ summary: 'Get current vendor analytics' })
  getAnalytics(@CurrentUser() user: JwtUser) {
    return this.vendorsService.getAnalytics(user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me/reviews')
  @ApiOperation({ summary: 'Get current vendor reviews' })
  getReviews(@CurrentUser() user: JwtUser) {
    return this.vendorsService.getReviews(user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Update current vendor profile' })
  updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateVendorProfileDto) {
    return this.vendorsService.updateMe(user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVendorProfileDto) {
    return this.vendorsService.update(id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body('isVerified') isVerified: boolean) {
    return this.vendorsService.verify(id, isVerified);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.vendorsService.softDelete(id); }
}
