import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-vendor-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-dark dark:text-white">
            Good {{ greeting() }}, {{ auth.currentUser()?.firstName }}! 👋
          </h1>
          <p class="text-sm text-gray-500 dark:text-white/50 mt-0.5">Here's how your vendor business is performing.</p>
        </div>
        <a routerLink="/vendor-dashboard/services"
           class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-white font-semibold text-sm transition-all shadow-sm hover:-translate-y-0.5">
          <span class="material-icons text-base">add</span>
          Add Service
        </a>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @for (card of statCards(); track card.label) {
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center" [class]="card.bg">
                <span class="material-icons" [class]="card.color">{{ card.icon }}</span>
              </div>
              @if (card.trend) {
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class]="card.trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'">
                  {{ card.trend > 0 ? '+' : '' }}{{ card.trend }}%
                </span>
              }
            </div>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ card.value }}</p>
            <p class="text-sm text-gray-500 dark:text-white/50 mt-0.5">{{ card.label }}</p>
          </div>
        }
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Recent Bookings -->
        <div class="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
            <h2 class="font-semibold text-dark dark:text-white">Recent Bookings</h2>
            <a routerLink="/vendor-dashboard/bookings" class="text-amber-500 text-sm font-medium hover:underline">View All</a>
          </div>
          @if (loading()) {
            <div class="p-8 text-center text-gray-400">Loading...</div>
          } @else if (!bookings().length) {
            <div class="p-10 text-center">
              <span class="material-icons text-5xl text-gray-200 block mb-3">event_note</span>
              <p class="text-gray-400 text-sm">No bookings yet. Complete your profile to get discovered!</p>
              <a routerLink="/vendor-dashboard/profile"
                 class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-amber-400 text-white text-sm font-medium hover:bg-amber-500">
                Complete Profile
              </a>
            </div>
          } @else {
            <div class="divide-y divide-gray-50 dark:divide-white/5">
              @for (b of bookings(); track b.id) {
                <div class="flex items-center gap-4 p-4">
                  <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <span class="material-icons text-amber-500 text-base">event</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-dark dark:text-white text-sm truncate">{{ b.bookingNumber }}</p>
                    <p class="text-gray-400 text-xs">{{ b.eventType }} · {{ b.eventDate | date:'MMM d, y' }}</p>
                  </div>
                  <div class="text-right">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                          [class]="statusClass(b.status)">{{ b.status }}</span>
                    <p class="text-xs text-gray-400 mt-1">{{ b.totalAmount | number }} ETB</p>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right Column -->
        <div class="space-y-4">

          <!-- Wallet Summary -->
          <div class="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
            <div class="flex items-center gap-2 mb-4">
              <span class="material-icons">account_balance_wallet</span>
              <p class="font-semibold text-sm">Wallet Balance</p>
            </div>
            <p class="font-display font-bold text-3xl mb-1">{{ (wallet()?.availableBalance || 0) | number:'1.0-0' }}</p>
            <p class="text-white/70 text-xs">ETB Available</p>
            <div class="mt-4 pt-4 border-t border-white/20 flex justify-between text-xs">
              <div>
                <p class="text-white/60">Pending</p>
                <p class="font-semibold">{{ (wallet()?.pendingBalance || 0) | number:'1.0-0' }} ETB</p>
              </div>
              <div>
                <p class="text-white/60">Lifetime</p>
                <p class="font-semibold">{{ (wallet()?.lifetimeEarnings || 0) | number:'1.0-0' }} ETB</p>
              </div>
            </div>
            <a routerLink="/vendor-dashboard/wallet"
               class="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors">
              <span class="material-icons text-base">open_in_new</span>
              Manage Wallet
            </a>
          </div>

          <!-- Subscription Status -->
          <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
            <h3 class="font-semibold text-dark dark:text-white mb-3">Subscription</h3>
            @if (subscription()) {
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <span class="material-icons text-purple-600">workspace_premium</span>
                </div>
                <div>
                  <p class="font-semibold text-dark dark:text-white">{{ subscription()?.plan?.name }} Plan</p>
                  <p class="text-xs text-gray-400">{{ subscription()?.status }}</p>
                </div>
              </div>
            } @else {
              <div class="text-center py-2">
                <p class="text-sm text-gray-500 mb-3">No active subscription</p>
                <a routerLink="/vendor-dashboard/subscription"
                   class="text-sm font-semibold text-amber-500 hover:underline">Choose a Plan →</a>
              </div>
            }
          </div>

          <!-- Quick Actions -->
          <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
            <h3 class="font-semibold text-dark dark:text-white mb-3">Quick Actions</h3>
            <div class="space-y-2">
              @for (action of quickActions; track action.label) {
                <a [routerLink]="action.path"
                   class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <div class="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-400 flex items-center justify-center transition-colors">
                    <span class="material-icons text-amber-500 group-hover:text-white text-base transition-colors">{{ action.icon }}</span>
                  </div>
                  <span class="text-sm text-gray-700 dark:text-white/70">{{ action.label }}</span>
                  <span class="material-icons text-gray-300 text-sm ml-auto">chevron_right</span>
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class VendorOverviewComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly bookings = signal<any[]>([]);
  readonly wallet = signal<any>(null);
  readonly subscription = signal<any>(null);
  readonly statCards = signal<any[]>([]);

  readonly quickActions = [
    { label: 'Add New Service',   path: '/vendor-dashboard/services',     icon: 'add_circle' },
    { label: 'View Analytics',    path: '/vendor-dashboard/analytics',    icon: 'bar_chart' },
    { label: 'Request Payout',    path: '/vendor-dashboard/wallet',       icon: 'payments' },
    { label: 'Manage Subscription', path: '/vendor-dashboard/subscription', icon: 'workspace_premium' },
  ];

  greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  ngOnInit(): void {
    // Load wallet
    this.api.get<any>('commission/wallet').subscribe({
      next: (w) => this.wallet.set(w),
      error: () => {},
    });

    // Load subscription
    this.api.get<any>('subscriptions/my').subscribe({
      next: (s) => this.subscription.set(s),
      error: () => {},
    });

    // Load analytics (stats & recent bookings)
    this.api.get<any>('vendors/me/analytics').subscribe({
      next: (res) => {
        const data = res.data;
        this.bookings.set(data.recentBookings || []);
        this.loading.set(false);
        this.buildStats(data);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildStats(data: any): void {
    this.statCards.set([
      { label: 'Total Bookings',    value: data.bookingsCount || 0, icon: 'event_note',             bg: 'bg-blue-50',    color: 'text-blue-500',   trend: 0 },
      { label: 'Active Listings',   value: data.servicesCount || 0, icon: 'inventory_2',            bg: 'bg-amber-50',   color: 'text-amber-500',  trend: 0 },
      { label: 'Avg. Rating',       value: '—',                     icon: 'star',                   bg: 'bg-yellow-50',  color: 'text-yellow-500', trend: null },
      { label: 'Lifetime Earned',   value: (data.revenue || 0) + ' ETB', icon: 'account_balance_wallet', bg: 'bg-green-50', color: 'text-green-500',  trend: 0 },
    ]);
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING: 'bg-yellow-50 text-yellow-700', CONFIRMED: 'bg-green-50 text-green-700',
      COMPLETED: 'bg-blue-50 text-blue-700',   CANCELLED: 'bg-red-50 text-red-700',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }
}
