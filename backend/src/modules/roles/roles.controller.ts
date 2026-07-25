import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesService, CreateRoleDto, UpdateRoleDto } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Roles & Permissions')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getPermissionCatalog() {
    return this.rolesService.getPermissionCatalog();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getRoles() {
    return this.rolesService.getRoles();
  }

  @Get(':code')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getRoleByCode(@Param('code') code: string) {
    return this.rolesService.getRoleByCode(code);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }
}
