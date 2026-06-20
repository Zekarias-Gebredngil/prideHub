import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async createLead(dto: { name: string; email: string; phone?: string; source?: string; interest?: string; budget?: number; notes?: string }) {
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

  async updateLead(id: string, dto: Partial<{ status: string; notes: string; budget: number }>) {
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
