import { Injectable } from '@nestjs/common';
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
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string) {
    return this.prisma.systemSetting.findUnique({ where: { key } });
  }

  async getPublic() {
    return this.prisma.systemSetting.findMany({ where: { isPublic: true } });
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
