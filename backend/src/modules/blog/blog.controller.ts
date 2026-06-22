import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiPropertyOptional } from '@nestjs/swagger';
import { BlogService, CreateBlogCommentDto, CreateBlogPostDto, UpdateBlogPostDto } from './blog.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UserRole, BlogStatus } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class BlogQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: BlogStatus | 'ALL';
}

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public() @Get()
  findAll(@Query() dto: BlogQueryDto) {
    return this.blogService.findAll(dto, dto.categoryId, dto.status);
  }

  @Public() @Get('categories')
  getCategories() { return this.blogService.getCategories(); }

  @Public() @Get('tags')
  getTags() { return this.blogService.getTags(); }

  @Public() @Get(':slug')
  findBySlug(@Param('slug') slug: string) { return this.blogService.findBySlug(slug); }

  @Public()
  @Post(':slug/comments')
  @ApiOperation({ summary: 'Submit a blog comment for moderation' })
  createComment(@Param('slug') slug: string, @Body() dto: CreateBlogCommentDto) {
    return this.blogService.createComment(slug, dto);
  }

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
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.update(id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.blogService.softDelete(id); }
}
