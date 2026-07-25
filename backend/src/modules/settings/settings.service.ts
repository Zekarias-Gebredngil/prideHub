import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Type } from 'class-transformer';
import { Allow, IsArray, IsBoolean, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';

export class SetSettingDto {
  @IsString()
  @MaxLength(150)
  key: string;

  @Allow()
  value: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  group?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class BulkSetSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetSettingDto)
  settings: SetSettingDto[];
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const defaults = [
      { key: 'system.logo', value: 'assets/images/prideHub logo.png', group: 'branding', description: 'System logo image URL', isPublic: true },
      { key: 'system.name', value: 'PrideHub', group: 'branding', description: 'Platform brand name', isPublic: true },
      { key: 'system.tagline', value: 'Where Every Celebration Comes to Life', group: 'branding', description: 'Platform tagline', isPublic: true },
      { key: 'contact.email', value: 'contact@pridehub.com', group: 'contact', description: 'Public contact email', isPublic: true },
      { key: 'contact.phone', value: '+251 911 234 567', group: 'contact', description: 'Public contact phone', isPublic: true },
      { key: 'contact.address', value: 'Bole Road, Addis Ababa, Ethiopia', group: 'contact', description: 'Office address', isPublic: true },
      { key: 'contact.officeHours', value: 'Mon–Sat, 8am–6pm', group: 'contact', description: 'Office operating hours', isPublic: true },
    ];
    let seeded = 0;
    for (const def of defaults) {
      const existing = await this.prisma.systemSetting.findUnique({ where: { key: def.key } });
      if (!existing) {
        await this.prisma.systemSetting.create({ data: def as any });
        seeded++;
      }
    }
    if (seeded > 0) this.logger.log(`Seeded ${seeded} default system settings.`);
  }

  async get(key: string) {
    return this.prisma.systemSetting.findUnique({ where: { key } });
  }

  async getPublic() {
    return this.prisma.systemSetting.findMany({ where: { isPublic: true } });
  }

  async getAllSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  }

  async getByGroup(group: string) {
    return this.prisma.systemSetting.findMany({ where: { group } });
  }

  async set(key: string, value: unknown, group?: string, description?: string, isPublic = false) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any, group, description, isPublic },
    });
  }

  async setMany(settings: SetSettingDto[]) {
    return Promise.all(settings.map((s) => this.set(s.key, s.value, s.group)));
  }
}
