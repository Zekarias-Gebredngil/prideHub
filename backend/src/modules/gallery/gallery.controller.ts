import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Public() @Get('albums')
  findAllAlbums(@Query() dto: PaginationDto, @Query('category') cat?: string) {
    return this.galleryService.findAllAlbums(dto, cat);
  }

  @Public() @Get('albums/:slug')
  findAlbum(@Param('slug') slug: string) { return this.galleryService.findAlbum(slug); }

  @Public() @Get('albums/:id/media')
  getMedia(@Param('id') id: string, @Query() dto: PaginationDto) {
    return this.galleryService.getMediaByAlbum(id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('albums')
  createAlbum(@Body() dto: { title: string; description?: string; category?: string }) {
    return this.galleryService.createAlbum(dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('albums/:id/media')
  addMedia(@Param('id') id: string, @Body() dto: { url: string; title?: string; type?: string }) {
    return this.galleryService.addMedia(id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete('media/:id')
  deleteMedia(@Param('id') id: string) { return this.galleryService.deleteMedia(id); }
}
