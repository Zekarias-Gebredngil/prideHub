import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface SidebarLink { label: string; path: string; icon: string; }

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      <!-- Sidebar -->
      <aside [class]="sidebarClass()"
             class="fixed left-0 top-0 h-full z-40 flex flex-col bg-white dark:bg-dark shadow-lg transition-all duration-300">

        <!-- Logo -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-gray-100 dark:border-white/10">
          <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <span class="text-secondary font-bold text-lg">P</span>
          </div>
          @if (sidebarOpen()) {
            <span class="font-display font-bold text-primary dark:text-secondary text-lg">PrideHub</span>
          }
        </div>

        <!-- Nav Links -->
        <nav class="flex-1 overflow-y-auto py-4 px-2">
          @for (link of navLinks; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="bg-primary text-white shadow-sm"
               [routerLinkActiveOptions]="{ exact: link.path === '/dashboard' }"
               class="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-gray-600 dark:text-white/60 hover:bg-primary/5 hover:text-primary transition-all group">
              <span class="material-icons text-xl shrink-0">{{ link.icon }}</span>
              @if (sidebarOpen()) {
                <span class="text-sm font-medium">{{ link.label }}</span>
              }
            </a>
          }
        </nav>

        <!-- User & Logout -->
        <div class="p-3 border-t border-gray-100 dark:border-white/10">
          @if (sidebarOpen()) {
            <div class="flex items-center gap-3 px-2 py-2 mb-2">
              <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {{ userInitial() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate text-gray-800 dark:text-white">{{ auth.currentUser()?.fullName }}</p>
                <p class="text-xs text-gray-400 truncate">{{ auth.currentUser()?.role }}</p>
              </div>
            </div>
          }
          <button (click)="auth.logout()"
                  class="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <span class="material-icons text-xl">logout</span>
            @if (sidebarOpen()) { <span class="text-sm font-medium">Logout</span> }
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div [class]="mainClass()" class="flex-1 flex flex-col min-h-screen transition-all duration-300">

        <!-- Topbar -->
        <header class="h-16 bg-white dark:bg-dark border-b border-gray-100 dark:border-white/10 flex items-center px-6 gap-4 sticky top-0 z-30">
          <button (click)="toggleSidebar()"
                  class="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span class="material-icons text-gray-600 dark:text-white">
              {{ sidebarOpen() ? 'menu_open' : 'menu' }}
            </span>
          </button>
          <div class="flex-1"></div>
          <button routerLink="/dashboard/notifications"
                  class="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span class="material-icons text-gray-600 dark:text-white">notifications</span>
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          <a routerLink="/dashboard/profile"
             class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {{ userInitial() }}
            </div>
            <span class="hidden md:block text-sm font-medium text-gray-800 dark:text-white">
              {{ auth.currentUser()?.firstName }}
            </span>
          </a>
        </header>

        <!-- Content -->
        <main class="flex-1 p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class DashboardLayoutComponent {
  readonly auth = inject(AuthService);
  readonly sidebarOpen = signal(true);

  navLinks: SidebarLink[] = [
    { label: 'Overview', path: '/dashboard', icon: 'dashboard' },
    { label: 'My Bookings', path: '/dashboard/bookings', icon: 'event_note' },
    { label: 'Payments', path: '/dashboard/payments', icon: 'payments' },
    { label: 'Messages', path: '/dashboard/messages', icon: 'chat' },
    { label: 'Notifications', path: '/dashboard/notifications', icon: 'notifications' },
    { label: 'Profile', path: '/dashboard/profile', icon: 'person' },
    { label: 'Settings', path: '/dashboard/settings', icon: 'settings' },
  ];

  toggleSidebar() { this.sidebarOpen.set(!this.sidebarOpen()); }

  sidebarClass() {
    return this.sidebarOpen() ? 'w-60' : 'w-16';
  }
  mainClass() {
    return this.sidebarOpen() ? 'ml-60' : 'ml-16';
  }
  userInitial() {
    const u = this.auth.currentUser();
    return u ? u.firstName[0].toUpperCase() : 'U';
  }
}
