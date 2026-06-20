import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent],
  template: `
    <div>
      <!-- Greeting -->
      <div class="mb-8">
        <h1 class="font-display text-3xl font-bold text-dark dark:text-white">
          Good {{ greeting() }}, {{ auth.currentUser()?.firstName }}! 👋
        </h1>
        <p class="text-gray-500 dark:text-white/50 mt-1">Here's an overview of your events and bookings.</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/10">
            <div class="flex items-center justify-between mb-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center" [class]="stat.bgColor">
                <span class="material-icons" [class]="stat.iconColor">{{ stat.icon }}</span>
              </div>
              <span class="text-xs font-medium px-2 py-1 rounded-full" [class]="stat.badgeClass">
                {{ stat.badge }}
              </span>
            </div>
            <p class="font-display font-bold text-2xl text-dark dark:text-white">{{ stat.value }}</p>
            <p class="text-gray-500 dark:text-white/50 text-sm mt-0.5">{{ stat.label }}</p>
          </div>
        }
      </div>

      <!-- Recent Bookings -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
          <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
            <h2 class="font-semibold text-dark dark:text-white">Recent Bookings</h2>
            <a routerLink="/dashboard/bookings" class="text-primary text-sm font-medium hover:underline">View All</a>
          </div>

          @if (loading()) {
            <div class="p-4 space-y-3">
              @for (i of [1,2,3]; track i) { <app-skeleton-loader type="list-item" /> }
            </div>
          } @else if (bookings().length === 0) {
            <div class="p-10 text-center">
              <span class="material-icons text-5xl text-gray-200 block mb-3">event_note</span>
              <p class="text-gray-400">No bookings yet</p>
              <a routerLink="/book" class="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
                <span class="material-icons text-sm">add</span> Book an Event
              </a>
            </div>
          } @else {
            <div class="divide-y divide-gray-50 dark:divide-white/5">
              @for (booking of bookings(); track booking.id) {
                <a [routerLink]="['/dashboard/bookings', booking.id]"
                   class="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       [class]="getStatusBg(booking.status)">
                    <span class="material-icons text-base" [class]="getStatusColor(booking.status)">event</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-dark dark:text-white text-sm">{{ booking.bookingNumber }}</p>
                    <p class="text-gray-400 text-xs truncate">{{ booking.eventType }} · {{ booking.eventDate | date:'MMM d, y' }}</p>
                  </div>
                  <div class="text-right">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold" [class]="getStatusClass(booking.status)">
                      {{ booking.status }}
                    </span>
                    <p class="text-xs text-gray-400 mt-1">{{ booking.totalAmount | number }} ETB</p>
                  </div>
                </a>
              }
            </div>
          }
        </div>

        <!-- Quick Actions -->
        <div class="space-y-4">
          <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
            <h2 class="font-semibold text-dark dark:text-white mb-4">Quick Actions</h2>
            <div class="space-y-2">
              @for (action of quickActions; track action.label) {
                <a [routerLink]="action.path"
                   class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <div class="w-9 h-9 rounded-xl bg-primary/5 group-hover:bg-primary flex items-center justify-center transition-colors">
                    <span class="material-icons text-primary group-hover:text-white text-lg transition-colors">{{ action.icon }}</span>
                  </div>
                  <span class="text-sm font-medium text-gray-700 dark:text-white/70">{{ action.label }}</span>
                  <span class="material-icons text-gray-300 text-sm ml-auto">chevron_right</span>
                </a>
              }
            </div>
          </div>

          <!-- Upcoming Event -->
          @if (upcomingEvent()) {
            <div class="bg-gradient-to-br from-primary to-primary-900 rounded-2xl p-5 text-white">
              <div class="flex items-center gap-2 mb-3">
                <span class="material-icons text-secondary">celebration</span>
                <p class="text-white/70 text-xs uppercase tracking-wider font-semibold">Upcoming Event</p>
              </div>
              <p class="font-semibold text-lg mb-1">{{ upcomingEvent()?.eventType }}</p>
              <p class="text-white/70 text-sm">{{ upcomingEvent()?.eventDate | date:'MMMM d, y' }}</p>
              <div class="mt-4 h-1.5 rounded-full bg-white/20">
                <div class="h-full rounded-full bg-secondary" style="width:40%"></div>
              </div>
              <p class="text-white/60 text-xs mt-1">Planning in progress</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class OverviewComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly bookings = signal<any[]>([]);
  readonly upcomingEvent = signal<any>(null);
  readonly stats = signal<any[]>([]);

  quickActions = [
    { label: 'Book New Event', path: '/book', icon: 'add_circle' },
    { label: 'View Packages', path: '/packages', icon: 'inventory_2' },
    { label: 'Browse Venues', path: '/venues', icon: 'location_city' },
    { label: 'Hire Vendors', path: '/vendors', icon: 'store' },
    { label: 'My Payments', path: '/dashboard/payments', icon: 'payments' },
  ];

  greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  ngOnInit(): void {
    this.api.get<any>('dashboard/client').subscribe({
      next: (data) => {
        this.bookings.set(data.bookings || []);
        this.upcomingEvent.set(data.upcomingEvent);
        this.stats.set([
          { label: 'Total Bookings', value: data.bookings?.length || 0, icon: 'event_note', bgColor: 'bg-blue-50', iconColor: 'text-blue-500', badge: 'All time', badgeClass: 'bg-blue-50 text-blue-600' },
          { label: 'Total Spent', value: `${(data.totalSpent || 0).toLocaleString()} ETB`, icon: 'payments', bgColor: 'bg-green-50', iconColor: 'text-green-500', badge: 'Lifetime', badgeClass: 'bg-green-50 text-green-600' },
          { label: 'Upcoming Events', value: data.upcomingEvent ? 1 : 0, icon: 'celebration', bgColor: 'bg-primary/5', iconColor: 'text-primary', badge: 'Scheduled', badgeClass: 'bg-primary/5 text-primary' },
          { label: 'Unread Messages', value: 0, icon: 'chat', bgColor: 'bg-secondary/10', iconColor: 'text-secondary-600', badge: 'New', badgeClass: 'bg-secondary/10 text-secondary-700' },
        ]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-50 text-yellow-700',
      CONFIRMED: 'bg-green-50 text-green-700',
      COMPLETED: 'bg-blue-50 text-blue-700',
      CANCELLED: 'bg-red-50 text-red-700',
      PLANNING: 'bg-purple-50 text-purple-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }

  getStatusBg(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-50', CONFIRMED: 'bg-green-50',
      COMPLETED: 'bg-blue-50', CANCELLED: 'bg-red-50',
    };
    return map[status] || 'bg-gray-50';
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'text-yellow-500', CONFIRMED: 'text-green-500',
      COMPLETED: 'text-blue-500', CANCELLED: 'text-red-500',
    };
    return map[status] || 'text-gray-400';
  }
}
