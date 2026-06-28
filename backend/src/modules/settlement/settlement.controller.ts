import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { SettlementService } from './settlement.service';
import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateDisputeDto {
  @ApiProperty()
  @IsUUID()
  bookingId: string;

  @ApiProperty()
  @IsUUID()
  againstId: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsNumber()
  disputedAmount: number;
}

class ResolveDisputeDto {
  @ApiProperty()
  @IsString()
  resolution: string;

  @ApiProperty()
  favorsClient: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  refundAmount?: number;
}

@ApiTags('Settlement')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  // ── Settlement Batches (Admin) ────────────────────────────────────────────

  @Get('batches')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List settlement batches' })
  getBatches(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.settlementService.getSettlementBatches(+page, +limit);
  }

  @Get('batches/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get settlement batch details' })
  getBatchDetails(@Param('id') id: string) {
    return this.settlementService.getBatchDetails(id);
  }

  @Post('batches/trigger')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually trigger settlement batch' })
  triggerSettlement(@CurrentUser() user: JwtUser) {
    return this.settlementService.triggerManualSettlement(user.sub);
  }

  @Patch('batches/settlements/:id/mark-paid')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark settlement as paid' })
  markPaid(
    @Param('id') id: string,
    @Body('paymentRef') paymentRef: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.settlementService.markSettlementPaid(id, paymentRef, user.sub);
  }

  // ── Vendor Settlements ────────────────────────────────────────────────────

  @Get('vendor')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get vendor settlement history' })
  async getVendorSettlements(
    @CurrentUser() user: JwtUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const vendorProfile = await this.getVendorId(user.sub);
    return this.settlementService.getVendorSettlements(vendorProfile, +page, +limit);
  }

  // ── Escrow ────────────────────────────────────────────────────────────────

  @Get('escrow/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get escrow statistics' })
  getEscrowStats() {
    return this.settlementService.getEscrowStats();
  }

  @Post('escrow/release-mature')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually trigger release of mature escrow accounts' })
  releaseMatureEscrows() {
    return this.settlementService.releaseMatureEscrows();
  }

  // ── Disputes ──────────────────────────────────────────────────────────────

  @Get('disputes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List disputes' })
  getDisputes(@Query('status') status?: string) {
    return this.settlementService.getDisputes(status);
  }

  @Post('disputes')
  @ApiOperation({ summary: 'Create a dispute' })
  createDispute(@Body() dto: CreateDisputeDto, @CurrentUser() user: JwtUser) {
    return this.settlementService.createDispute({ ...dto, initiatedById: user.sub });
  }

  @Patch('disputes/:id/resolve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Resolve a dispute' })
  resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.settlementService.resolveDispute(
      id, user.sub, dto.resolution, dto.favorsClient, dto.refundAmount,
    );
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private async getVendorId(userId: string): Promise<string> {
    const svc = (this.settlementService as any);
    const vendor = await svc.prisma.vendorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!vendor) throw new Error('Vendor profile not found');
    return vendor.id;
  }
}
