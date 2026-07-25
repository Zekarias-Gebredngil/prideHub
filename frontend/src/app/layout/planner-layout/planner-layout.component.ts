import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SystemSettingsService } from '../../core/services/system-settings.service';

interface SidebarLink { label: string; path: string; icon: string; }

@Component({
  selector: 'app-planner-layout',
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
             class="fixed left-0 top-0 bottom-0 h-screen max-h-screen w-64 z-40 flex flex-col shadow-xl overflow-hidden transition-transform duration-300 lg:translate-x-0"
             style="background: linear-gradient(180deg, #1a0533 0%, #2d1b69 50%, #4c1d95 100%);">

        <!-- Logo -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
          <div class="w-9 h-9 rounded-xl bg-purple-400/20 border border-purple-400/30 flex items-center justify-center shrink-0">
            <span class="material-icons text-purple-300 text-xl">event_note</span>
          </div>
          <div class="min-w-0">
            <span class="font-display font-bold text-white text-base truncate block leading-tight">{{ systemSettings.siteName() }}</span>
            <p class="text-xs text-white/40 truncate">Planner Hub</p>
          </div>
        </div>

        <!-- Profile Strip -->
        <div class="px-4 py-3 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {{ userInitial() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-white truncate">{{ auth.currentUser()?.fullName }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 font-medium">EVENT PLANNER</span>
            </div>
          </div>
        </div>

        <!-- Nav Links -->
        <nav class="flex-1 min-h-0 overflow-y-auto py-4 px-2 space-y-0.5">
          @for (link of navLinks; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="bg-purple-400/20 text-purple-300 border border-purple-400/20"
               [routerLinkActiveOptions]="{ exact: link.path === '/planner-dashboard' }"
               (click)="onNavClick()"
               class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all">
              <span class="material-icons text-xl shrink-0">{{ link.icon }}</span>
              <span class="text-sm font-medium truncate">{{ link.label }}</span>
            </a>
          }
        </nav>

        <!-- Logout -->
        <div class="p-3 border-t border-white/10 shrink-0">
          <button (click)="auth.logout()"
                  class="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
            <span class="material-icons text-xl">logout</span>
            <span class="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="lg:ml-64 flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300">

        <!-- Topbar -->
        <header class="h-16 bg-white dark:bg-dark border-b border-gray-100 dark:border-white/10 flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-30">
          <button (click)="sidebarOpen.set(!sidebarOpen())"
                  class="p-2 rounded-xl text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span class="material-icons text-xl">menu</span>
          </button>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
            <span class="text-sm font-semibold text-gray-800 dark:text-white truncate">Event Planner Dashboard</span>
          </div>
          <a routerLink="/planner-dashboard/messages"
             class="relative p-2 rounded-xl text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span class="material-icons text-xl">chat</span>
          </a>
          <a routerLink="/planner-dashboard/profile"
             class="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {{ userInitial() }}
            </div>
            <span class="hidden sm:inline text-sm font-medium text-gray-800 dark:text-white truncate">
              {{ auth.currentUser()?.firstName }}
            </span>
          </a>
        </header>

        <!-- Page Content -->
        <main class="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class PlannerLayoutComponent {
  readonly auth = inject(AuthService);
  readonly systemSettings = inject(SystemSettingsService);
  readonly sidebarOpen = signal(false);

  readonly navLinks: SidebarLink[] = [
    { label: 'Overview',    path: '/planner-dashboard',           icon: 'dashboard' },
    { label: 'My Events',   path: '/planner-dashboard/events',    icon: 'celebration' },
    { label: 'Clients',     path: '/planner-dashboard/clients',   icon: 'people' },
    { label: 'Vendors',     path: '/planner-dashboard/vendors',   icon: 'storefront' },
    { label: 'Schedule',    path: '/planner-dashboard/schedule',  icon: 'calendar_month' },
    { label: 'Bookings',    path: '/planner-dashboard/bookings',  icon: 'event_note' },
    { label: 'Messages',    path: '/planner-dashboard/messages',  icon: 'chat' },
    { label: 'Reports',     path: '/planner-dashboard/reports',   icon: 'bar_chart' },
    { label: 'Profile',     path: '/planner-dashboard/profile',   icon: 'person' },
    { label: 'Settings',    path: '/planner-dashboard/settings',  icon: 'settings' },
  ];

  onNavClick() {
    if (window.innerWidth < 1024) {
      this.sidebarOpen.set(false);
    }
  }

  userInitial() {
    const u = this.auth.currentUser();
    return u ? u.firstName[0].toUpperCase() : 'P';
  }
}
