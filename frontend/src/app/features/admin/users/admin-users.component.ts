import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Users</h1>
        <div class="flex items-center gap-3">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-base">search</span>
            <input [(ngModel)]="search" (ngModelChange)="load()" type="text" placeholder="Search users..."
                   class="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm focus:outline-none focus:border-primary w-56">
          </div>
        </div>
      </div>

      <!-- Stats bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        @for (s of stats(); track s.label) {
          <div class="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10 shadow-sm text-center">
            <p class="font-bold text-xl text-dark dark:text-white">{{ s.value }}</p>
            <p class="text-gray-400 text-xs">{{ s.label }}</p>
          </div>
        }
      </div>

      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-white/5 text-xs text-gray-400 uppercase tracking-wider">
                <th class="text-left px-5 py-3 font-medium">User</th>
                <th class="text-left px-5 py-3 font-medium">Role</th>
                <th class="text-left px-5 py-3 font-medium">Status</th>
                <th class="text-left px-5 py-3 font-medium">Joined</th>
                <th class="text-left px-5 py-3 font-medium">Last Login</th>
                <th class="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-white/5">
              @if (loading()) {
                @for (i of [1,2,3,4,5]; track i) {
                  <tr>
                    <td colspan="6" class="px-5 py-4">
                      <div class="skeleton h-5 w-full rounded"></div>
                    </td>
                  </tr>
                }
              }
              @for (u of users(); track u.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {{ u.firstName?.[0] }}{{ u.lastName?.[0] }}
                      </div>
                      <div>
                        <p class="font-medium text-dark dark:text-white">{{ u.fullName }}</p>
                        <p class="text-gray-400 text-xs">{{ u.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3.5">
                    <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/5 text-primary">{{ u.role }}</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span class="flex items-center gap-1 text-xs font-medium"
                          [class]="u.status === 'ACTIVE' ? 'text-green-600' : 'text-red-500'">
                      <span class="w-1.5 h-1.5 rounded-full"
                            [class]="u.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-400'"></span>
                      {{ u.status }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-gray-500 dark:text-white/50 text-xs">{{ u.createdAt | date:'MMM d, y' }}</td>
                  <td class="px-5 py-3.5 text-gray-500 dark:text-white/50 text-xs">{{ u.lastLoginAt | date:'MMM d, y' }}</td>
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-1">
                      <button (click)="toggleBan(u)"
                              class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                              [class]="u.status === 'BANNED' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'">
                        {{ u.status === 'BANNED' ? 'Unban' : 'Ban' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly users = signal<any[]>([]);
  readonly stats = signal<any[]>([]);
  readonly loading = signal(true);
  search = '';

  ngOnInit(): void {
    this.loadStats();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: any = { limit: 50 };
    if (this.search) params['search'] = this.search;
    this.api.getPaginated<any>('users', params).subscribe({
      next: (res) => { this.users.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadStats(): void {
    this.api.get<any>('users/stats').subscribe({
      next: (s) => this.stats.set([
        { label: 'Total Users', value: s.total },
        { label: 'Active', value: s.active },
        { label: 'Clients', value: s.clients },
        { label: 'Vendors', value: s.vendors },
      ]),
    });
  }

  toggleBan(user: any): void {
    const action = user.status === 'BANNED' ? 'activate' : 'ban';
    this.api.patch(`admin/users/${user.id}/${action}`, {}).subscribe({
      next: () => {
        this.users.update(us => us.map(u =>
          u.id === user.id ? { ...u, status: action === 'ban' ? 'BANNED' : 'ACTIVE' } : u
        ));
      },
    });
  }
}
