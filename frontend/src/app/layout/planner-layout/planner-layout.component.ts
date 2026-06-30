import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface SidebarLink { label: string; path: string; icon: string; }

@Component({
  selector: 'app-planner-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      <!-- Sidebar -->
      <aside [class]="sidebarClass()"
             class="fixed left-0 top-0 h-full z-40 flex flex-col shadow-xl transition-all duration-300"
             style="background: linear-gradient(180deg, #1a0533 0%, #2d1b69 50%, #4c1d95 100%);">

        <!-- Logo -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div class="w-9 h-9 rounded-xl bg-purple-400/20 border border-purple-400/30 flex items-center justify-center shrink-0">
            <span class="material-icons text-purple-300 text-xl">event_note</span>
          </div>
          @if (sidebarOpen()) {
            <div>
              <span class="font-display font-bold text-white text-base">Planner Hub</span>
              <p class="text-xs text-white/40">PrideHub</p>
            </div>
          }
        </div>

        <!-- Profile Strip -->
        @if (sidebarOpen()) {
          <div class="px-4 py-3 border-b border-white/10 bg-white/5">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {{ userInitial() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ auth.currentUser()?.fullName }}</p>
                <span class="text-xs px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 font-medium">EVENT PLANNER</span>
              </div>
            </div>
          </div>
        }

        <!-- Nav Links -->
        <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          @for (link of navLinks; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="bg-purple-400/20 text-purple-300 border border-purple-400/20"
               [routerLinkActiveOptions]="{ exact: link.path === '/planner-dashboard' }"
               class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all">
              <span class="material-icons text-xl shrink-0">{{ link.icon }}</span>
              @if (sidebarOpen()) {
                <span class="text-sm font-medium">{{ link.label }}</span>
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
          <div class="flex items-center gap-2 flex-1">
            <span class="w-2 h-2 rounded-full bg-purple-500"></span>
            <span class="text-sm font-medium text-gray-600 dark:text-white/60">Event Planner Dashboard</span>
          </div>
          <a routerLink="/planner-dashboard/messages"
             class="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span class="material-icons text-gray-600 dark:text-white">chat</span>
          </a>
          <a routerLink="/planner-dashboard/profile"
             class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
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
export class PlannerLayoutComponent {
  readonly auth = inject(AuthService);
  readonly sidebarOpen = signal(true);

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

  toggleSidebar() { this.sidebarOpen.set(!this.sidebarOpen()); }
  sidebarClass() { return this.sidebarOpen() ? 'w-60' : 'w-16'; }
  mainClass()    { return this.sidebarOpen() ? 'ml-60' : 'ml-16'; }
  userInitial()  {
    const u = this.auth.currentUser();
    return u ? u.firstName[0].toUpperCase() : 'P';
  }
}
