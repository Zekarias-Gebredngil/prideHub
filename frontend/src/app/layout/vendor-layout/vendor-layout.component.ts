import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface SidebarLink { label: string; path: string; icon: string; badge?: string; }

@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      <!-- Sidebar -->
      <aside [class]="sidebarClass()"
             class="fixed left-0 top-0 h-full z-40 flex flex-col shadow-xl transition-all duration-300"
             style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);">

        <!-- Logo -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div class="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <span class="material-icons text-amber-400 text-xl">storefront</span>
          </div>
          @if (sidebarOpen()) {
            <div>
              <span class="font-display font-bold text-white text-base">PrideHub</span>
              <p class="text-xs text-white/40">Vendor Hub</p>
            </div>
          }
        </div>

        <!-- Profile Strip -->
        @if (sidebarOpen()) {
          <div class="px-4 py-3 border-b border-white/10 bg-white/5">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-white font-bold text-sm">
                {{ userInitial() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ auth.currentUser()?.fullName }}</p>
                <span class="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-medium">VENDOR</span>
              </div>
            </div>
          </div>
        }

        <!-- Nav Links -->
        <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          @for (link of navLinks; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="bg-amber-400/20 text-amber-300 border border-amber-400/20"
               [routerLinkActiveOptions]="{ exact: link.path === '/vendor-dashboard' }"
               class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all group relative">
              <span class="material-icons text-xl shrink-0">{{ link.icon }}</span>
              @if (sidebarOpen()) {
                <span class="text-sm font-medium">{{ link.label }}</span>
                @if (link.badge) {
                  <span class="ml-auto px-2 py-0.5 rounded-full bg-amber-400 text-white text-xs font-bold">{{ link.badge }}</span>
                }
              }
            </a>
          }
        </nav>

        <!-- Logout -->
        <div class="p-3 border-t border-white/10">
          <button (click)="auth.logout()"
                  class="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
            <span class="material-icons text-xl">logout</span>
            @if (sidebarOpen()) { <span class="text-sm font-medium">Logout</span> }
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div [class]="mainClass()" class="flex-1 flex flex-col min-h-screen transition-all duration-300">

        <!-- Topbar -->
        <header class="h-16 bg-white dark:bg-dark border-b border-gray-100 dark:border-white/10 flex items-center px-6 gap-4 sticky top-0 z-30">
          <button (click)="toggleSidebar()"
                  class="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span class="material-icons text-gray-600 dark:text-white">
              {{ sidebarOpen() ? 'menu_open' : 'menu' }}
            </span>
          </button>

          <!-- Breadcrumb / Title area -->
          <div class="flex items-center gap-2 flex-1">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span class="text-sm font-medium text-gray-600 dark:text-white/60">Vendor Dashboard</span>
          </div>

          <a routerLink="/vendor-dashboard/notifications"
             class="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span class="material-icons text-gray-600 dark:text-white">notifications</span>
          </a>
          <a routerLink="/vendor-dashboard/profile"
             class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <div class="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white text-sm font-bold">
              {{ userInitial() }}
            </div>
            <span class="hidden md:block text-sm font-medium text-gray-800 dark:text-white">
              {{ auth.currentUser()?.firstName }}
            </span>
          </a>
        </header>

        <!-- Page Content -->
        <main class="flex-1 p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class VendorLayoutComponent {
  readonly auth = inject(AuthService);
  readonly sidebarOpen = signal(true);

  readonly navLinks: SidebarLink[] = [
    { label: 'Overview', path: '/vendor-dashboard', icon: 'dashboard' },
    { label: 'My Services', path: '/vendor-dashboard/services', icon: 'inventory_2' },
    { label: 'Bookings', path: '/vendor-dashboard/bookings', icon: 'event_note' },
    { label: 'Wallet', path: '/vendor-dashboard/wallet', icon: 'account_balance_wallet' },
    { label: 'Subscription', path: '/vendor-dashboard/subscription', icon: 'workspace_premium' },
    { label: 'Analytics', path: '/vendor-dashboard/analytics', icon: 'bar_chart' },
    { label: 'Reviews', path: '/vendor-dashboard/reviews', icon: 'star' },
    { label: 'Messages', path: '/vendor-dashboard/messages', icon: 'chat' },
    { label: 'Profile', path: '/vendor-dashboard/profile', icon: 'person' },
    { label: 'Settings', path: '/vendor-dashboard/settings', icon: 'settings' },
  ];

  toggleSidebar() { this.sidebarOpen.set(!this.sidebarOpen()); }
  sidebarClass() { return this.sidebarOpen() ? 'w-60' : 'w-16'; }
  mainClass() { return this.sidebarOpen() ? 'ml-60' : 'ml-16'; }
  userInitial() {
    const u = this.auth.currentUser();
    return u ? u.firstName[0].toUpperCase() : 'V';
  }
}
