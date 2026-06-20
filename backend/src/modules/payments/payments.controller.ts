import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService, CreatePaymentDto, CreateInvoiceDto } from './payments.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  findAll(@Query() dto: PaginationDto, @CurrentUser() user: JwtUser) {
    return this.paymentsService.findAll(dto, {
      userId: user.sub,
      isAdmin:
        user.role === UserRole.SUPER_ADMIN ||
        user.role === UserRole.ADMIN,
    });
  }

  @Get('stats/revenue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get revenue stats' })
  getRevenueStats() { return this.paymentsService.getRevenueStats(); }

  @Post()
  @ApiOperation({ summary: 'Create payment' })
  createPayment(@Body() dto: CreatePaymentDto) { return this.paymentsService.createPayment(dto); }

  @Post('invoices')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER)
  @ApiOperation({ summary: 'Create invoice' })
  createInvoice(@Body() dto: CreateInvoiceDto) { return this.paymentsService.createInvoice(dto); }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  getInvoice(@Param('id') id: string) { return this.paymentsService.getInvoice(id); }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get payments by booking' })
  getByBooking(@Param('bookingId') id: string) { return this.paymentsService.getPaymentsByBooking(id); }

  @Patch(':id/confirm')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Confirm payment' })
  confirm(@Param('id') id: string, @Body('transactionRef') ref: string) {
    return this.paymentsService.confirmPayment(id, ref);
  }

  @Post(':id/chapa')
  @ApiOperation({ summary: 'Initiate Chapa payment' })
  initiateChapa(@Param('id') id: string) { return this.paymentsService.initiateChapa(id); }
}
