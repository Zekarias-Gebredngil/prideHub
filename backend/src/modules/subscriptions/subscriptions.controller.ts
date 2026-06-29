import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, SubscriptionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SubscribeDto {
  @ApiProperty()
  @IsString()
  planId: string;

  @ApiPropertyOptional({ enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'] })
  @IsOptional()
  @IsString()
  billingCycle?: string;
}

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ── Public: View Plans ────────────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get plan details' })
  getPlan(@Param('id') id: string) {
    return this.subscriptionsService.getPlanById(id);
  }

  // ── Vendor Subscription ───────────────────────────────────────────────────

  @Get('my')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get my subscription' })
  getMySubscription(@CurrentUser() user: JwtUser) {
    return this.subscriptionsService.getVendorSubscription(user.sub);
  }

  @Post('subscribe')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Subscribe to a plan' })
  subscribe(@CurrentUser() user: JwtUser, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(user.sub, dto.planId, dto.billingCycle);
  }

  @Delete('cancel')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(@CurrentUser() user: JwtUser) {
    return this.subscriptionsService.cancelSubscription(user.sub);
  }

  @Get('history')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get subscription payment history' })
  getHistory(@CurrentUser() user: JwtUser) {
    return this.subscriptionsService.getSubscriptionHistory(user.sub);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  @Get('admin/all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all vendor subscriptions (admin)' })
  getAll(
    @Query('status') status?: SubscriptionStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.subscriptionsService.getAllSubscriptions(status, +page, +limit);
  }

  @Get('admin/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get subscription statistics' })
  getStats() {
    return this.subscriptionsService.getSubscriptionStats();
  }

  @Patch('admin/plans/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a subscription plan' })
  updatePlan(@Param('id') id: string, @Body() data: any) {
    return this.subscriptionsService.updatePlan(id, data);
  }
}
