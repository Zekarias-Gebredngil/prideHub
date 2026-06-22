import { Injectable, NotFoundException } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

export class CreateLeadDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  interest?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}

export class CreateFollowUpDto {
  @IsString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCrmNoteDto {
  @IsString()
  note: string;
}

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async createLead(dto: CreateLeadDto) {
    return this.prisma.lead.create({ data: dto });
  }

  async findAllLeads(dto: PaginationDto, status?: string) {
    const where: any = { ...(status && { status }) };
    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where, skip: dto.skip, take: dto.take,
        orderBy: { createdAt: 'desc' },
        include: { followUps: { orderBy: { scheduledAt: 'asc' }, take: 1 } },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return paginate(data, total, dto);
  }

  async updateLead(id: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.prisma.lead.update({ where: { id }, data: dto });
  }

  async addFollowUp(leadId: string, userId: string, scheduledAt: string, notes?: string) {
    return this.prisma.followUp.create({
      data: { leadId, userId, scheduledAt: new Date(scheduledAt), notes },
    });
  }

  async completeFollowUp(id: string) {
    return this.prisma.followUp.update({
      where: { id },
      data: { isDone: true, completedAt: new Date() },
    });
  }

  async addNote(userId: string, note: string) {
    return this.prisma.crmNote.create({ data: { userId, note } });
  }

  async getLeadStats() {
    const [total, newLeads, converted] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { status: 'NEW' } }),
      this.prisma.lead.count({ where: { convertedAt: { not: null } } }),
    ]);
    return { total, newLeads, converted, conversionRate: total ? (converted / total * 100).toFixed(1) : 0 };
  }
}
