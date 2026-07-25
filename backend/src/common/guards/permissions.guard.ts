import { SetMetadata, Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtUser } from '../decorators/current-user.decorator';
import { RolesService } from '../../modules/roles/roles.service';
import { UserRole } from '@prisma/client';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: JwtUser = request.user;
    if (!user) throw new ForbiddenException('Access denied');

    // SUPER_ADMIN has unconstrained access
    if (user.role === UserRole.SUPER_ADMIN) return true;

    try {
      const role = await this.rolesService.getRoleByCode(user.role);
      const userPermissions = role.permissions || [];
      const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));
      if (!hasAll) {
        throw new ForbiddenException(`Missing required permission: ${requiredPermissions.join(', ')}`);
      }
      return true;
    } catch (_err) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
