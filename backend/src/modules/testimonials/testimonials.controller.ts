import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TestimonialsService, CreateTestimonialDto } from './testimonials.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Reviews')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Public() @Get()
  findAll(@Query() dto: PaginationDto, @Query('approvedOnly') approvedOnly?: string) {
    return this.testimonialsService.findAll(dto, approvedOnly !== 'false');
  }

  @Public() @Get('featured')
  findFeatured() { return this.testimonialsService.findFeatured(); }

  @Public() @Post()
  create(@Body() dto: CreateTestimonialDto) { return this.testimonialsService.create(dto); }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string) { return this.testimonialsService.approve(id); }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.testimonialsService.delete(id); }
}
