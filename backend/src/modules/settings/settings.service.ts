import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  async setMany(settings: { key: string; value: unknown; group?: string }[]) {
    return Promise.all(settings.map((s) => this.set(s.key, s.value, s.group)));
  }
}
