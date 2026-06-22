import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCrmNoteDto, CreateFollowUpDto, CreateLeadDto, CrmService, UpdateLeadDto } from './crm.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('CRM')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_PLANNER)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('leads')
  findLeads(@Query() dto: PaginationDto, @Query('status') status?: string) {
    return this.crmService.findAllLeads(dto, status);
  }

  @Get('leads/stats')
  getStats() { return this.crmService.getLeadStats(); }

  @Post('leads')
  createLead(@Body() dto: CreateLeadDto) { return this.crmService.createLead(dto); }

  @Patch('leads/:id')
  updateLead(@Param('id') id: string, @Body() dto: UpdateLeadDto) { return this.crmService.updateLead(id, dto); }

  @Post('leads/:id/follow-ups')
  addFollowUp(@Param('id') id: string, @CurrentUser() user: JwtUser, @Body() dto: CreateFollowUpDto) {
    return this.crmService.addFollowUp(id, user.sub, dto.scheduledAt, dto.notes);
  }

  @Patch('follow-ups/:id/complete')
  completeFollowUp(@Param('id') id: string) { return this.crmService.completeFollowUp(id); }

  @Post('notes')
  addNote(@CurrentUser() user: JwtUser, @Body() dto: CreateCrmNoteDto) {
    return this.crmService.addNote(user.sub, dto.note);
  }
}
