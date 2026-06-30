import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-planner-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-dark dark:text-white">
            Good {{ greeting() }}, {{ auth.currentUser()?.firstName }}! 🎉
          </h1>
          <p class="text-sm text-gray-500 dark:text-white/50 mt-0.5">Manage your events, clients, and vendors all in one place.</p>
        </div>
        <a routerLink="/planner-dashboard/events"
           class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-sm hover:-translate-y-0.5">
          <span class="material-icons text-base">add</span>
          New Event
        </a>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @for (card of statCards; track card.label) {
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-3" [class]="card.bg">
              <span class="material-icons" [class]="card.color">{{ card.icon }}</span>
            </div>
            <p class="font-display font-bold text-2xl text-dark dark:text-white">{{ card.value }}</p>
            <p class="text-sm text-gray-500 dark:text-white/50 mt-0.5">{{ card.label }}</p>
          </div>
        }
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Upcoming Events -->
        <div class="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
            <h2 class="font-semibold text-dark dark:text-white">Upcoming Events</h2>
            <a routerLink="/planner-dashboard/events" class="text-purple-600 text-sm font-medium hover:underline">View All</a>
          </div>
          @if (loading()) {
            <div class="p-8 text-center text-gray-400 text-sm">Loading events...</div>
          } @else if (!events().length) {
            <div class="p-10 text-center">
              <span class="material-icons text-5xl text-gray-200 block mb-3">celebration</span>
              <p class="text-gray-400 text-sm">No events yet. Create your first event!</p>
              <a routerLink="/planner-dashboard/events"
                 class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">
                Create Event
              </a>
            </div>
          } @else {
            <div class="divide-y divide-gray-50 dark:divide-white/5">
              @for (event of events(); track event.id) {
                <div class="flex items-center gap-4 p-4">
                  <div class="w-12 h-12 rounded-xl bg-purple-50 flex flex-col items-center justify-center text-center shrink-0">
                    <p class="text-xs font-bold text-purple-600">{{ event.eventDate | date:'MMM' }}</p>
                    <p class="text-lg font-bold text-purple-800 leading-none">{{ event.eventDate | date:'d' }}</p>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-dark dark:text-white text-sm">{{ event.eventType }}</p>
                    <p class="text-gray-400 text-xs truncate">{{ event.bookingNumber }}</p>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                        [class]="statusClass(event.status)">{{ event.status }}</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right Column -->
        <div class="space-y-4">

          <!-- Quick Actions -->
          <div class="bg-gradient-to-br from-purple-600 to-purple-900 rounded-2xl p-5 text-white shadow-lg">
            <h3 class="font-semibold mb-4 flex items-center gap-2">
              <span class="material-icons text-purple-300">bolt</span>
              Quick Actions
            </h3>
            <div class="space-y-2">
              @for (action of quickActions; track action.label) {
                <a [routerLink]="action.path"
                   class="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <span class="material-icons text-purple-200 text-base">{{ action.icon }}</span>
                  <span class="text-sm font-medium">{{ action.label }}</span>
                  <span class="material-icons text-purple-300 text-sm ml-auto">chevron_right</span>
                </a>
              }
            </div>
          </div>

          <!-- Recent Clients -->
          <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-dark dark:text-white">Recent Clients</h3>
              <a routerLink="/planner-dashboard/clients" class="text-purple-600 text-xs font-medium hover:underline">All</a>
            </div>
            @if (!clients().length) {
              <p class="text-sm text-gray-400 text-center py-3">No clients yet</p>
            } @else {
              <div class="space-y-3">
                @for (client of clients().slice(0, 4); track client.id) {
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {{ client.fullName?.[0] || 'C' }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-dark dark:text-white truncate">{{ client.fullName }}</p>
                      <p class="text-xs text-gray-400 truncate">{{ client.email }}</p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PlannerOverviewComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly events = signal<any[]>([]);
  readonly clients = signal<any[]>([]);

  readonly statCards = [
    { label: 'Active Events',    value: '—', icon: 'celebration',  bg: 'bg-purple-50',  color: 'text-purple-600' },
    { label: 'Total Clients',    value: '—', icon: 'people',       bg: 'bg-blue-50',    color: 'text-blue-600' },
    { label: 'Vendors Booked',   value: '—', icon: 'storefront',   bg: 'bg-amber-50',   color: 'text-amber-600' },
    { label: 'Events This Month',value: '—', icon: 'calendar_month', bg: 'bg-green-50', color: 'text-green-600' },
  ];

  readonly quickActions = [
    { label: 'Create New Event',   path: '/planner-dashboard/events',   icon: 'add_circle' },
    { label: 'Add Client',         path: '/planner-dashboard/clients',  icon: 'person_add' },
    { label: 'Browse Vendors',     path: '/vendors',                    icon: 'storefront' },
    { label: 'View Schedule',      path: '/planner-dashboard/schedule', icon: 'calendar_month' },
  ];

  greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  ngOnInit(): void {
    this.api.getPaginated<any>('bookings', { limit: 5 }).subscribe({
      next: (res) => { this.events.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING: 'bg-yellow-50 text-yellow-700', CONFIRMED: 'bg-green-50 text-green-700',
      COMPLETED: 'bg-blue-50 text-blue-700',   CANCELLED: 'bg-red-50 text-red-700',
      PLANNING: 'bg-purple-50 text-purple-700',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }
}
