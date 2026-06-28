import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async submit(dto: { name: string; email: string; phone?: string; subject: string; message: string; userId?: string }) {
    const contact = await this.prisma.contact.create({ data: dto });
    
    // Fetch target admin email from settings, fallback if not set
    const emailSetting = await this.prisma.systemSetting.findUnique({ where: { key: 'site.email' } });
    const targetEmail = (emailSetting?.value as string) || 'admin@pridehub.com';

    // Fire & forget email sending
    this.mailService.sendContactNotification(
      dto.name,
      dto.email,
      dto.subject,
      dto.message,
      targetEmail,
    ).catch(e => console.error('Failed to send contact notification email:', e));

    return contact;
  }

  async findAll(dto: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        skip: dto.skip, take: dto.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count(),
    ]);
    return paginate(data, total, dto);
  }

  async markRead(id: string) {
    return this.prisma.contact.update({ where: { id }, data: { isRead: true } });
  }
}
