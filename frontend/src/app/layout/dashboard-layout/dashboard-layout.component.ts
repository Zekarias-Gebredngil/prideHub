import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SystemSettingsService } from '../../core/services/system-settings.service';

interface SidebarLink { label: string; path: string; icon: string; }

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      <!-- Mobile Backdrop -->
      @if (sidebarOpen()) {
        <div (click)="sidebarOpen.set(false)" class="fixed inset-0 bg-dark/60 backdrop-blur-sm z-30 lg:hidden"></div>
      }

      <!-- Sidebar -->
      <aside [class.translate-x-0]="sidebarOpen()" [class.-translate-x-full]="!sidebarOpen()"
             class="fixed left-0 top-0 bottom-0 h-screen max-h-screen w-64 z-40 flex flex-col bg-white dark:bg-dark shadow-lg overflow-hidden transition-transform duration-300 lg:translate-x-0">

        <!-- Logo -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
            <img [src]="systemSettings.logo()" [alt]="systemSettings.siteName()" class="w-8 h-8 object-contain">
          </div>
          <div class="min-w-0">
            <span class="font-display font-bold text-primary dark:text-secondary text-lg truncate block leading-tight">{{ systemSettings.siteName() }}</span>
          </div>
        </div>

        <!-- Nav Links -->
        <nav class="flex-1 min-h-0 overflow-y-auto py-4 px-2">
          @for (link of navLinks(); track link.path) {
            <a [routerLink]="link.path" routerLinkActive="bg-primary text-white shadow-sm"
               [routerLinkActiveOptions]="{ exact: link.path === '/dashboard' }"
               (click)="onNavClick()"
               class="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-gray-600 dark:text-white/60 hover:bg-primary/5 hover:text-primary transition-all group">
              <span class="material-icons text-xl shrink-0">{{ link.icon }}</span>
              <span class="text-sm font-medium truncate">{{ link.label }}</span>
            </a>
          }

          <!-- Become a Vendor CTA -->
          @if (showBeVendorCta()) {
            <div class="mt-4 mx-1 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p class="text-xs font-semibold text-primary mb-1">Become a Vendor</p>
              <p class="text-xs text-gray-500 dark:text-white/50 mb-2">
                List your services and start earning
              </p>
              <a routerLink="/vendor-setup" (click)="onNavClick()"
                 class="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <span class="material-icons text-sm">add_business</span>
                Set up your profile
              </a>
            </div>
          }
        </nav>

        <!-- User & Logout -->
        <div class="p-3 border-t border-gray-100 dark:border-white/10 shrink-0">
          <div class="flex items-center gap-3 px-2 py-2 mb-2">
            <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {{ userInitial() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate text-gray-800 dark:text-white">{{ auth.currentUser()?.fullName }}</p>
              <p class="text-xs text-gray-400 truncate">{{ auth.currentUser()?.role }}</p>
            </div>
          </div>
          <button (click)="auth.logout()"
                  class="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <span class="material-icons text-xl">logout</span>
            <span class="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="lg:ml-64 flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300">

        <!-- Topbar -->
        <header class="h-16 bg-white dark:bg-dark border-b border-gray-100 dark:border-white/10 flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-30">
          <button (click)="sidebarOpen.set(!sidebarOpen())"
                  class="p-2 rounded-xl text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span class="material-icons text-xl">menu</span>
          </button>
          <div class="flex-1 min-w-0">
            <span class="text-sm font-semibold text-gray-800 dark:text-white truncate">Client Dashboard</span>
          </div>
          <button routerLink="/dashboard/notifications"
                  class="relative p-2 rounded-xl text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span class="material-icons text-xl">notifications</span>
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          <a routerLink="/dashboard/profile"
             class="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
              {{ userInitial() }}
            </div>
            <span class="hidden sm:inline text-sm font-medium text-gray-800 dark:text-white truncate">
              {{ auth.currentUser()?.firstName }}
            </span>
          </a>
        </header>

        <!-- Content -->
        <main class="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class DashboardLayoutComponent {
  readonly auth = inject(AuthService);
  readonly systemSettings = inject(SystemSettingsService);
  readonly sidebarOpen = signal(false);

  readonly coreLinks: SidebarLink[] = [
    { label: 'Overview', path: '/dashboard', icon: 'dashboard' },
    { label: 'My Bookings', path: '/dashboard/bookings', icon: 'event_note' },
    { label: 'Payments', path: '/dashboard/payments', icon: 'payments' },
    { label: 'Messages', path: '/dashboard/messages', icon: 'chat' },
    { label: 'Notifications', path: '/dashboard/notifications', icon: 'notifications' },
    { label: 'Profile', path: '/dashboard/profile', icon: 'person' },
    { label: 'Security', path: '/dashboard/security', icon: 'security' },
    { label: 'Settings', path: '/dashboard/settings', icon: 'settings' },
  ];

  readonly vendorLinks: SidebarLink[] = [
    { label: 'Wallet', path: '/dashboard/wallet', icon: 'account_balance_wallet' },
    { label: 'Subscription', path: '/dashboard/subscription', icon: 'workspace_premium' },
  ];

  readonly navLinks = computed<SidebarLink[]>(() => {
    const core = this.coreLinks;
    if (this.auth.hasVendorAccess()) {
      return [
        ...core.slice(0, 3),
        ...this.vendorLinks,
        ...core.slice(3),
      ];
    }
    return core;
  });

  readonly showBeVendorCta = computed(() =>
    !this.auth.hasVendorAccess() && !this.auth.isAdmin() && !this.auth.isPlanner(),
  );

  onNavClick() {
    if (window.innerWidth < 1024) {
      this.sidebarOpen.set(false);
    }
  }

  userInitial() {
    const u = this.auth.currentUser();
    return u ? u.firstName[0].toUpperCase() : 'U';
  }
}
