import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PermissionGroup {
  domain: string;
  name: string;
  permissions: Array<{ code: string; name: string; description: string }>;
}

export class CreateRoleDto {
  name!: string;
  code!: string;
  description?: string;
  permissions?: string[];
}

export class UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Standard System Permissions Catalog ────────────────────────────────────
  private readonly permissionCatalog: PermissionGroup[] = [
    {
      domain: 'users',
      name: 'Users & Authentication',
      permissions: [
        { code: 'users:read', name: 'View Users', description: 'View user list and profile details' },
        { code: 'users:write', name: 'Manage Users', description: 'Create and update user accounts' },
        { code: 'users:delete', name: 'Delete Users', description: 'Soft-delete or ban user accounts' },
        { code: 'roles:manage', name: 'Manage Roles', description: 'Create and modify system roles & permissions' },
      ],
    },
    {
      domain: 'commission',
      name: 'Commission & Financial Engine',
      permissions: [
        { code: 'commission:read', name: 'View Commission Rules', description: 'View commission rules and global rates' },
        { code: 'commission:write', name: 'Configure Commission', description: 'Create and update commission rules and rates' },
        { code: 'settlement:manage', name: 'Manage Settlements', description: 'Run settlement batches and process payouts' },
        { code: 'finance:read', name: 'View Financial Ledger', description: 'Access financial ledgers and platform revenue stats' },
        { code: 'withdrawals:manage', name: 'Process Withdrawals', description: 'Approve or reject vendor withdrawal requests' },
      ],
    },
    {
      domain: 'bookings',
      name: 'Bookings & Events',
      permissions: [
        { code: 'bookings:read', name: 'View Bookings', description: 'Access booking list and event progress' },
        { code: 'bookings:write', name: 'Manage Bookings', description: 'Update booking status, notes, and timeline' },
        { code: 'events:manage', name: 'Manage Events', description: 'Create and monitor enterprise events' },
        { code: 'payments:manage', name: 'Manage Payments', description: 'View and manually confirm or refund payments' },
      ],
    },
    {
      domain: 'vendors',
      name: 'Vendors & Marketplace',
      permissions: [
        { code: 'vendors:manage', name: 'Manage Vendors', description: 'Verify, feature, or update vendor profiles' },
        { code: 'venues:manage', name: 'Manage Venues', description: 'Create, feature, and update venue listings' },
        { code: 'services:manage', name: 'Manage Services', description: 'Manage service categories and packages' },
        { code: 'subscriptions:manage', name: 'Manage SaaS Subscriptions', description: 'Manage vendor subscription plans and tiers' },
      ],
    },
    {
      domain: 'settings',
      name: 'Settings & Audit',
      permissions: [
        { code: 'settings:read', name: 'View Settings', description: 'View system configuration values' },
        { code: 'settings:write', name: 'Manage Settings', description: 'Update dynamic system branding and site configuration' },
        { code: 'audit:read', name: 'View Audit Logs', description: 'Access security events and financial audit logs' },
      ],
    },
    {
      domain: 'crm',
      name: 'CRM & Support',
      permissions: [
        { code: 'crm:manage', name: 'Manage CRM Leads', description: 'View and follow up with platform leads' },
        { code: 'support:manage', name: 'Support Tickets', description: 'Respond to and resolve user support tickets' },
        { code: 'blog:manage', name: 'Manage Content & Blog', description: 'Create and publish blog posts and FAQs' },
      ],
    },
  ];

  async onModuleInit() {
    await this.seedDefaultRoles();
  }

  private async seedDefaultRoles() {
    const allPermissionCodes = this.permissionCatalog
      .flatMap((g) => g.permissions)
      .map((p) => p.code);

    const defaultRoles = [
      {
        name: 'Super Administrator',
        code: 'SUPER_ADMIN',
        description: 'Full unconstrained system access and permission configuration capability',
        isSystem: true,
        permissions: allPermissionCodes,
      },
      {
        name: 'Administrator',
        code: 'ADMIN',
        description: 'Platform administration access including vendor verification, bookings, and settings',
        isSystem: true,
        permissions: allPermissionCodes.filter((p) => p !== 'roles:manage'),
      },
      {
        name: 'Financial Manager',
        code: 'FINANCIAL_MANAGER',
        description: 'Specialized access for commission rules, settlement batches, ledgers, and withdrawals',
        isSystem: true,
        permissions: [
          'commission:read',
          'commission:write',
          'settlement:manage',
          'finance:read',
          'withdrawals:manage',
          'payments:manage',
          'audit:read',
        ],
      },
      {
        name: 'Event Planner',
        code: 'EVENT_PLANNER',
        description: 'Event planner role for booking coordination, task management, and timeline execution',
        isSystem: true,
        permissions: ['bookings:read', 'bookings:write', 'events:manage', 'crm:manage'],
      },
      {
        name: 'Support Agent',
        code: 'SUPPORT_AGENT',
        description: 'Customer support access for resolving tickets, messages, and user inquiries',
        isSystem: true,
        permissions: ['users:read', 'bookings:read', 'support:manage', 'crm:manage'],
      },
    ];

    for (const roleDef of defaultRoles) {
      const existing = await this.prisma.customRole.findUnique({ where: { code: roleDef.code } });
      if (!existing) {
        await this.prisma.customRole.create({ data: roleDef });
        this.logger.log(`Seeded default role: ${roleDef.name} (${roleDef.code})`);
      }
    }
  }

  getPermissionCatalog(): PermissionGroup[] {
    return this.permissionCatalog;
  }

  async getRoles() {
    return this.prisma.customRole.findMany({
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getRoleByCode(code: string) {
    const role = await this.prisma.customRole.findUnique({ where: { code } });
    if (!role) throw new NotFoundException(`Role ${code} not found`);
    return role;
  }

  async createRole(dto: CreateRoleDto) {
    const code = (dto.code || dto.name).toUpperCase().replace(/[^A_Z0-9_]/g, '_');
    const existing = await this.prisma.customRole.findUnique({ where: { code } });
    if (existing) throw new BadRequestException(`Role with code ${code} already exists`);

    return this.prisma.customRole.create({
      data: {
        name: dto.name,
        code,
        description: dto.description,
        isSystem: false,
        permissions: dto.permissions || [],
      },
    });
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.customRole.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.customRole.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.permissions && { permissions: dto.permissions }),
      },
    });
  }

  async deleteRole(id: string) {
    const role = await this.prisma.customRole.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('Built-in system roles cannot be deleted');

    await this.prisma.customRole.delete({ where: { id } });
    return { message: `Role ${role.name} deleted` };
  }
}
