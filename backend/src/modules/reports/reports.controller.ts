import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  revenueReport(@Query('start') start: string, @Query('end') end: string) {
    return this.reportsService.revenueReport(
      start || new Date(new Date().setMonth(0, 1)).toISOString(),
      end || new Date().toISOString(),
    );
  }

  @Get('bookings')
  bookingsReport(@Query('start') start: string, @Query('end') end: string) {
    return this.reportsService.bookingsReport(
      start || new Date(new Date().setMonth(0, 1)).toISOString(),
      end || new Date().toISOString(),
    );
  }

  @Get('customers')
  customersReport(@Query('start') start: string, @Query('end') end: string) {
    return this.reportsService.customersReport(
      start || new Date(new Date().setMonth(0, 1)).toISOString(),
      end || new Date().toISOString(),
    );
  }

  @Get('vendor-performance')
  vendorPerformance() { return this.reportsService.vendorPerformanceReport(); }

  @Get('popular-packages')
  popularPackages() { return this.reportsService.popularPackages(); }

  @Get('popular-venues')
  popularVenues() { return this.reportsService.popularVenues(); }
}
