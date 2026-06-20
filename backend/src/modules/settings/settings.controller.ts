import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public() @Get('public')
  getPublic() { return this.settingsService.getPublic(); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('group/:group')
  getByGroup(@Param('group') group: string) { return this.settingsService.getByGroup(group); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  set(@Body() dto: { key: string; value: unknown; group?: string; description?: string; isPublic?: boolean }) {
    return this.settingsService.set(dto.key, dto.value, dto.group, dto.description, dto.isPublic);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('bulk')
  setMany(@Body() settings: { key: string; value: unknown; group?: string }[]) {
    return this.settingsService.setMany(settings);
  }
}
