import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() { return this.adminService.getPlatformOverview(); }

  @Get('activity')
  getActivity() { return this.adminService.getRecentActivity(); }

  @Get('audit-logs')
  getAuditLogs(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.adminService.getAuditLogs(+page, +limit);
  }

  @Get('pending-approvals')
  getPendingApprovals() { return this.adminService.getPendingApprovals(); }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('users/:id/ban')
  banUser(@Param('id') id: string) { return this.adminService.banUser(id); }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('users/:id/activate')
  activateUser(@Param('id') id: string) { return this.adminService.activateUser(id); }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('users/:id/role')
  changeRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.adminService.changeUserRole(id, role);
  }
}
