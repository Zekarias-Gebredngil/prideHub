import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

export interface PermissionItem {
  code: string;
  name: string;
  description: string;
}

export interface PermissionGroup {
  domain: string;
  name: string;
  permissions: PermissionItem[];
}

export interface RoleModel {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  permissions: string[];
  createdAt?: string;
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Role & Permission Management</h1>
          <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Configure granular access control permissions for platform roles</p>
        </div>
        <button (click)="openCreateModal()"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 shadow-sm transition-colors">
          <span class="material-icons text-base">add_moderator</span>
          New Role
        </button>
      </div>

      @if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <span class="material-icons text-base text-red-500">error</span>
          {{ error() }}
        </div>
      }

      <!-- Roles Grid -->
      @if (loading()) {
        <div class="p-12 text-center text-gray-400">
          <span class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin inline-block mb-3"></span>
          <p>Loading roles and permissions...</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (role of roles(); track role.id) {
            <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 mb-3">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-primary text-xl">admin_panel_settings</span>
                    <h3 class="font-bold text-dark dark:text-white text-base truncate">{{ role.name }}</h3>
                  </div>
                  @if (role.isSystem) {
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">System</span>
                  } @else {
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Custom</span>
                  }
                </div>
                <p class="text-xs text-gray-400 mb-4 line-clamp-2 min-h-[2rem]">{{ role.description || 'No description provided.' }}</p>
                <div class="space-y-1 mb-4">
                  <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Assigned Permissions</span>
                    <span class="font-bold text-dark dark:text-white">{{ role.permissions.length }}</span>
                  </div>
                  <div class="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-primary h-full rounded-full transition-all"
                         [style.width.%]="(role.permissions.length / totalPermissionsCount()) * 100"></div>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                <span class="text-xs text-gray-400 font-mono">{{ role.code }}</span>
                <div class="flex items-center gap-1">
                  <button (click)="openEditModal(role)" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/10">
                    Edit Permissions
                  </button>
                  @if (!role.isSystem) {
                    <button (click)="deleteRole(role)" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <span class="material-icons text-base">delete</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create / Edit Permission Matrix Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-white dark:bg-dark rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4 shrink-0">
              <div>
                <h2 class="font-display font-bold text-xl text-dark dark:text-white">
                  {{ isEditing() ? 'Edit Role Permissions: ' + activeRole.name : 'Create Custom Role' }}
                </h2>
                <p class="text-xs text-gray-400 mt-0.5">Toggle permissions assigned to this role</p>
              </div>
              <button (click)="closeModal()" class="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400">
                <span class="material-icons">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto space-y-5 pr-1">
              <!-- Basic Metadata -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Role Name *</span>
                  <input [(ngModel)]="activeRole.name" type="text" placeholder="e.g. Finance Auditor"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>
                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Role Code / Identifier</span>
                  <input [(ngModel)]="activeRole.code" type="text" [readonly]="isEditing()" placeholder="AUTO_GENERATED"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary font-mono text-xs">
                </label>
                <label class="space-y-1 md:col-span-2">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Description</span>
                  <input [(ngModel)]="activeRole.description" type="text" placeholder="Describe the responsibilities of this role..."
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>
              </div>

              <!-- Permission Matrix -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold text-sm text-dark dark:text-white">Permission Matrix</h3>
                  <div class="flex gap-2">
                    <button type="button" (click)="selectAllPermissions()" class="text-xs text-primary hover:underline">Select All</button>
                    <span class="text-gray-300">|</span>
                    <button type="button" (click)="deselectAllPermissions()" class="text-xs text-gray-400 hover:underline">Deselect All</button>
                  </div>
                </div>

                <div class="space-y-4">
                  @for (group of permissionCatalog(); track group.domain) {
                    <div class="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-4 space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-xs text-dark dark:text-white uppercase tracking-wider">{{ group.name }}</span>
                        <button type="button" (click)="toggleGroupPermissions(group)" class="text-xs text-gray-400 hover:text-primary">
                          Toggle Group
                        </button>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        @for (perm of group.permissions; track perm.code) {
                          <label class="flex items-start gap-2.5 p-2 rounded-lg bg-white dark:bg-dark border border-gray-100 dark:border-white/5 hover:border-primary/40 cursor-pointer transition-colors">
                            <input type="checkbox"
                                   [checked]="isPermissionSelected(perm.code)"
                                   (change)="togglePermission(perm.code)"
                                   class="mt-0.5 accent-primary rounded">
                            <div class="min-w-0">
                              <p class="font-medium text-xs text-dark dark:text-white truncate">{{ perm.name }}</p>
                              <p class="text-[11px] text-gray-400 truncate">{{ perm.description }}</p>
                            </div>
                          </label>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/10 shrink-0">
              <button (click)="closeModal()" class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-white/70">Cancel</button>
              <button (click)="saveRole()" [disabled]="saving() || !activeRole.name.trim()"
                      class="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 disabled:opacity-50 transition-colors">
                {{ saving() ? 'Saving...' : 'Save Role Permissions' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminRolesComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly roles = signal<RoleModel[]>([]);
  readonly permissionCatalog = signal<PermissionGroup[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly showModal = signal(false);
  readonly isEditing = signal(false);

  activeRole: RoleModel = { id: '', name: '', code: '', description: '', isSystem: false, permissions: [] };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set('');
    Promise.all([
      this.api.get<RoleModel[]>('roles').toPromise(),
      this.api.get<PermissionGroup[]>('roles/permissions').toPromise(),
    ]).then(([roles, permissions]) => {
      this.roles.set(roles || []);
      this.permissionCatalog.set(permissions || []);
      this.loading.set(false);
    }).catch(err => {
      this.error.set(err?.error?.message || 'Could not load role configurations');
      this.loading.set(false);
    });
  }

  totalPermissionsCount(): number {
    return this.permissionCatalog().reduce((sum, g) => sum + g.permissions.length, 0) || 1;
  }

  openCreateModal() {
    this.activeRole = { id: '', name: '', code: '', description: '', isSystem: false, permissions: [] };
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  openEditModal(role: RoleModel) {
    this.activeRole = JSON.parse(JSON.stringify(role));
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  isPermissionSelected(code: string): boolean {
    return this.activeRole.permissions.includes(code);
  }

  togglePermission(code: string) {
    const idx = this.activeRole.permissions.indexOf(code);
    if (idx >= 0) {
      this.activeRole.permissions.splice(idx, 1);
    } else {
      this.activeRole.permissions.push(code);
    }
  }

  toggleGroupPermissions(group: PermissionGroup) {
    const groupCodes = group.permissions.map((p) => p.code);
    const allSelected = groupCodes.every((c) => this.isPermissionSelected(c));
    if (allSelected) {
      this.activeRole.permissions = this.activeRole.permissions.filter((c) => !groupCodes.includes(c));
    } else {
      const merged = new Set([...this.activeRole.permissions, ...groupCodes]);
      this.activeRole.permissions = Array.from(merged);
    }
  }

  selectAllPermissions() {
    const all = this.permissionCatalog().flatMap((g) => g.permissions.map((p) => p.code));
    this.activeRole.permissions = all;
  }

  deselectAllPermissions() {
    this.activeRole.permissions = [];
  }

  saveRole() {
    if (!this.activeRole.name.trim()) return;
    this.saving.set(true);

    if (this.isEditing()) {
      this.api.put<RoleModel>(`roles/${this.activeRole.id}`, {
        name: this.activeRole.name,
        description: this.activeRole.description,
        permissions: this.activeRole.permissions,
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          alert(err?.error?.message || 'Failed to update role');
        },
      });
    } else {
      this.api.post<RoleModel>('roles', {
        name: this.activeRole.name,
        code: this.activeRole.code,
        description: this.activeRole.description,
        permissions: this.activeRole.permissions,
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          alert(err?.error?.message || 'Failed to create role');
        },
      });
    }
  }

  deleteRole(role: RoleModel) {
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;
    this.api.delete(`roles/${role.id}`).subscribe({
      next: () => this.loadData(),
      error: (err) => alert(err?.error?.message || 'Could not delete role'),
    });
  }
}
