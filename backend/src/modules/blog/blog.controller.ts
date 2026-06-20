import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlogService, CreateBlogPostDto } from './blog.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UserRole, BlogStatus } from '@prisma/client';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public() @Get()
  findAll(@Query() dto: PaginationDto, @Query('categoryId') cat?: string) {
    return this.blogService.findAll(dto, cat);
  }

  @Public() @Get('categories')
  getCategories() { return this.blogService.getCategories(); }

  @Public() @Get('tags')
  getTags() { return this.blogService.getTags(); }

  @Public() @Get(':slug')
  findBySlug(@Param('slug') slug: string) { return this.blogService.findBySlug(slug); }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER)
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateBlogPostDto) {
    return this.blogService.create(user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateBlogPostDto>) {
    return this.blogService.update(id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.blogService.softDelete(id); }
}
