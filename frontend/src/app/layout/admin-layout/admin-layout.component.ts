import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      <!-- Sidebar -->
      <aside class="fixed left-0 top-0 h-full w-64 z-40 bg-dark flex flex-col shadow-2xl overflow-y-auto">
        <!-- Logo -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
            <img src="assets/images/prideHub logo.png" alt="PrideHub Logo" class="w-8 h-8">
          </div>
          <div>
            <p class="text-white/40 text-xs">Admin Panel</p>
          </div>
        </div>

        <nav class="flex-1 py-4 px-2">
          @for (group of navGroups; track group.label) {
            <p class="px-3 py-2 text-white/30 text-xs uppercase tracking-widest font-semibold">{{ group.label }}</p>
            @for (link of group.links; track link.path) {
              <a [routerLink]="link.path" routerLinkActive="bg-primary/20 text-secondary border-r-2 border-secondary"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-white/60 hover:text-white hover:bg-white/5 transition-all">
                <span class="material-icons text-lg">{{ link.icon }}</span>
                <span class="text-sm font-medium">{{ link.label }}</span>
              </a>
            }
          }
        </nav>

        <!-- User -->
        <div class="p-3 border-t border-white/10">
          <div class="flex items-center gap-3 px-2 py-2 mb-2">
            <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm">
              {{ auth.currentUser()?.firstName?.[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate text-white">{{ auth.currentUser()?.fullName }}</p>
              <p class="text-xs text-white/40">{{ auth.currentUser()?.role }}</p>
            </div>
          </div>
          <button (click)="auth.logout()"
                  class="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-red-400 hover:bg-red-900/20 transition-colors">
            <span class="material-icons text-lg">logout</span>
            <span class="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="ml-64 flex-1 flex flex-col min-h-screen">
        <header class="h-16 bg-white dark:bg-dark border-b border-gray-100 dark:border-white/10 flex items-center px-6 gap-4 sticky top-0 z-30">
          <h1 class="text-lg font-semibold text-gray-800 dark:text-white">Administration Panel</h1>
          <div class="flex-1"></div>
          <a routerLink="/" class="text-sm text-gray-500 hover:text-primary flex items-center gap-1">
            <span class="material-icons text-sm">open_in_new</span>
            View Site
          </a>
        </header>
        <main class="flex-1 p-6"><router-outlet /></main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);

  navGroups = [
    {
      label: 'Main',
      links: [
        { label: 'Dashboard', path: '/admin', icon: 'dashboard' },
        { label: 'Users', path: '/admin/users', icon: 'people' },
        { label: 'Bookings', path: '/admin/bookings', icon: 'event_note' },
        { label: 'Events', path: '/admin/events', icon: 'celebration' },
        { label: 'Payments', path: '/admin/payments', icon: 'payments' },
      ],
    },
    {
      label: 'Catalog',
      links: [
        { label: 'Services', path: '/admin/services', icon: 'room_service' },
        { label: 'Packages', path: '/admin/packages', icon: 'inventory_2' },
        { label: 'Venues', path: '/admin/venues', icon: 'location_city' },
        { label: 'Vendors', path: '/admin/vendors', icon: 'store' },
      ],
    },
    {
      label: 'Content',
      links: [
        { label: 'Gallery', path: '/admin/gallery', icon: 'photo_library' },
        { label: 'Blog', path: '/admin/blog', icon: 'article' },
        { label: 'Testimonials', path: '/admin/testimonials', icon: 'format_quote' },
      ],
    },
    {
      label: 'Business',
      links: [
        { label: 'CRM', path: '/admin/crm', icon: 'contacts' },
        { label: 'Reports', path: '/admin/reports', icon: 'bar_chart' },
        { label: 'Settings', path: '/admin/settings', icon: 'settings' },
      ],
    },
    {
      label: 'Financial Engine',
      links: [
        { label: 'Commission', path: '/admin/commission', icon: 'percent' },
        { label: 'Settlement', path: '/admin/settlement', icon: 'account_balance' },
        { label: 'Subscriptions', path: '/admin/subscriptions', icon: 'workspace_premium' },
        { label: 'Wallets', path: '/admin/wallets', icon: 'account_balance_wallet' },
      ],
    },
  ];
}
