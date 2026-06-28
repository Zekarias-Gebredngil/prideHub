import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { CommissionService } from './commission.service';
import {
  CreateCommissionRuleDto,
  UpdateCommissionRuleDto,
  CalculateCommissionDto,
  UpdateSettingsDto,
} from './dto/commission.dto';

@ApiTags('Commission')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commission')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  // ── Settings (Admin) ──────────────────────────────────────────────────────

  @Get('settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get commission settings' })
  getSettings() {
    return this.commissionService.getSettings();
  }

  @Patch('settings')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update commission settings' })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.commissionService.updateSettings(dto);
  }

  // ── Rules ──────────────────────────────────────────────────────────────────

  @Get('rules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all commission rules' })
  getRules() {
    return this.commissionService.getRules();
  }

  @Post('rules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create commission rule' })
  createRule(@Body() dto: CreateCommissionRuleDto, @CurrentUser() user: JwtUser) {
    return this.commissionService.createRule(dto, user.sub);
  }

  @Patch('rules/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update commission rule' })
  updateRule(@Param('id') id: string, @Body() dto: UpdateCommissionRuleDto) {
    return this.commissionService.updateRule(id, dto);
  }

  @Delete('rules/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate commission rule' })
  deleteRule(@Param('id') id: string) {
    return this.commissionService.deleteRule(id);
  }

  // ── Calculate (preview) ───────────────────────────────────────────────────

  @Post('calculate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview commission calculation for a given amount' })
  calculate(@Body() dto: CalculateCommissionDto) {
    return this.commissionService.calculateCommission(dto.amount, dto.vendorId);
  }

  // ── Commission Transactions ───────────────────────────────────────────────

  @Get('transactions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all commission transactions (admin)' })
  getAllTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.commissionService.getCommissionTransactions(undefined, +page, +limit);
  }

  @Get('transactions/vendor')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get vendor commission transactions' })
  async getVendorTransactions(
    @CurrentUser() user: JwtUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const vendor = await this.getVendorId(user.sub);
    return this.commissionService.getCommissionTransactions(vendor, +page, +limit);
  }

  // ── Escrow ────────────────────────────────────────────────────────────────

  @Post('escrow/:bookingId/release')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Release escrow for a completed booking' })
  releaseEscrow(@Param('bookingId') bookingId: string, @CurrentUser() user: JwtUser) {
    return this.commissionService.releaseEscrow(bookingId, user.sub);
  }

  // ── Revenue Analytics ─────────────────────────────────────────────────────

  @Get('revenue/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Platform revenue statistics' })
  getRevenueStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.commissionService.getPlatformRevenueStats(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  // ── Vendor Wallet ──────────────────────────────────────────────────────────

  @Get('wallet')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get vendor wallet balance' })
  async getWallet(@CurrentUser() user: JwtUser) {
    const vendorId = await this.getVendorId(user.sub);
    return this.commissionService.getVendorWallet(vendorId);
  }

  @Get('wallet/transactions')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get wallet transaction history' })
  async getWalletTransactions(
    @CurrentUser() user: JwtUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const vendorId = await this.getVendorId(user.sub);
    return this.commissionService.getWalletTransactions(vendorId, +page, +limit);
  }

  @Post('wallet/withdraw')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Request withdrawal from wallet' })
  async requestWithdrawal(
    @CurrentUser() user: JwtUser,
    @Body() dto: {
      amount: number;
      method: string;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    },
  ) {
    const vendorId = await this.getVendorId(user.sub);
    return this.commissionService.requestWithdrawal(vendorId, dto);
  }

  @Get('wallet/withdraw')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Get withdrawal requests' })
  async getWithdrawals(
    @CurrentUser() user: JwtUser,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    let vendorId: string | undefined;
    if (user.role === UserRole.VENDOR) {
      vendorId = await this.getVendorId(user.sub);
    }
    return this.commissionService.getWithdrawals({
      status,
      vendorId,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Patch('wallet/withdraw/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve withdrawal request' })
  approveWithdrawal(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.commissionService.processWithdrawal(id, true, user.sub);
  }

  @Patch('wallet/withdraw/:id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject withdrawal request' })
  rejectWithdrawal(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body('reason') reason: string,
  ) {
    return this.commissionService.processWithdrawal(id, false, user.sub, reason);
  }

  // ── Ledger ─────────────────────────────────────────────────────────────────

  @Get('ledger/:accountId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get ledger entries for an account' })
  getLedger(
    @Param('accountId') accountId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.commissionService.getLedgerEntries(accountId, +page, +limit);
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private prismaService: any;

  private async getVendorId(userId: string): Promise<string> {
    // Lazy-get prisma through the commission service
    const vendor = (this.commissionService as any).prisma.vendorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    const result = await vendor;
    if (!result) throw new Error('Vendor profile not found');
    return result.id;
  }
}
