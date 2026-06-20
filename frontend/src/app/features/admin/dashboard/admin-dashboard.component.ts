import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Admin Dashboard</h1>
        <p class="text-gray-500 dark:text-white/50 text-sm">Platform overview and key metrics</p>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        @for (kpi of kpis(); track kpi.label) {
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" [style.background]="kpi.color + '20'">
                <span class="material-icons text-lg" [style.color]="kpi.color">{{ kpi.icon }}</span>
              </div>
              <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">{{ kpi.label }}</span>
            </div>
            <p class="font-display font-bold text-2xl text-dark dark:text-white">{{ kpi.value }}</p>
            <p class="text-green-500 text-xs mt-1 flex items-center gap-1">
              <span class="material-icons text-xs">trending_up</span>
              {{ kpi.change }}
            </p>
          </div>
        }
      </div>

      <!-- Revenue & Bookings row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        <!-- Revenue by month -->
        <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
          <h2 class="font-semibold text-dark dark:text-white mb-5">Monthly Revenue</h2>
          @if (revenue().length > 0) {
            <div class="flex items-end gap-2 h-32">
              @for (month of revenue(); track month.month) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <p class="text-xs text-gray-400">{{ (month.revenue/1000).toFixed(0) }}k</p>
                  <div class="w-full rounded-t-lg bg-primary/20 hover:bg-primary transition-colors cursor-default"
                       [style.height]="getBarHeight(month.revenue) + 'px'"></div>
                  <p class="text-xs text-gray-400">{{ month.month }}</p>
                </div>
              }
            </div>
          } @else {
            <div class="h-32 flex items-center justify-center text-gray-300">
              <span class="material-icons text-4xl">bar_chart</span>
            </div>
          }
        </div>

        <!-- Bookings by status -->
        <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
          <h2 class="font-semibold text-dark dark:text-white mb-5">Bookings by Status</h2>
          <div class="space-y-3">
            @for (item of bookingsByStatus(); track item.status) {
              <div class="flex items-center gap-3">
                <span class="text-xs font-medium w-24 text-gray-600 dark:text-white/60 truncate">{{ item.status }}</span>
                <div class="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div class="h-full rounded-full bg-primary"
                       [style.width]="getTotalBookings() > 0 ? (item.count / getTotalBookings() * 100) + '%' : '0%'"></div>
                </div>
                <span class="text-xs font-bold text-dark dark:text-white w-8 text-right">{{ item.count }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Bookings -->
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
          <h2 class="font-semibold text-dark dark:text-white">Recent Bookings</h2>
          <a routerLink="/admin/bookings" class="text-primary text-sm font-medium hover:underline">View All</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-white/5 text-xs text-gray-400 uppercase tracking-wider">
                <th class="text-left px-5 py-3 font-medium">Booking #</th>
                <th class="text-left px-5 py-3 font-medium">Client</th>
                <th class="text-left px-5 py-3 font-medium">Event Type</th>
                <th class="text-left px-5 py-3 font-medium">Date</th>
                <th class="text-left px-5 py-3 font-medium">Amount</th>
                <th class="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-white/5">
              @for (b of recentBookings(); track b.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td class="px-5 py-3 font-mono text-xs text-primary">{{ b.bookingNumber }}</td>
                  <td class="px-5 py-3 text-gray-700 dark:text-white/70">{{ b.client?.fullName }}</td>
                  <td class="px-5 py-3 text-gray-600 dark:text-white/60">{{ b.eventType }}</td>
                  <td class="px-5 py-3 text-gray-600 dark:text-white/60">{{ b.eventDate | date:'MMM d, y' }}</td>
                  <td class="px-5 py-3 font-medium text-dark dark:text-white">{{ b.totalAmount | number }} ETB</td>
                  <td class="px-5 py-3">
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">{{ b.status }}</span>
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
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly kpis = signal<any[]>([]);
  readonly revenue = signal<any[]>([]);
  readonly bookingsByStatus = signal<any[]>([]);
  readonly recentBookings = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any>('dashboard/admin').subscribe({
      next: (data) => {
        const k = data.kpis || {};
        this.kpis.set([
          { label: 'Total Users', value: k.totalUsers || 0, icon: 'people', color: '#3B82F6', change: `+${k.newUsersThisMonth || 0} this month` },
          { label: 'Bookings', value: k.totalBookings || 0, icon: 'event_note', color: '#8B1538', change: `+${k.bookingsThisMonth || 0} this month` },
          { label: 'Revenue', value: `${((k.totalRevenue || 0) / 1000).toFixed(0)}k ETB`, icon: 'payments', color: '#D4AF37', change: `${((k.revenueThisMonth || 0) / 1000).toFixed(0)}k this month` },
          { label: 'Pending', value: k.pendingBookings || 0, icon: 'pending', color: '#F59E0B', change: 'Need attention' },
        ]);
        this.recentBookings.set(data.recentBookings || []);
        this.revenue.set(data.revenueByMonth || []);
      },
    });

    this.api.get<any[]>('dashboard/bookings-by-status').subscribe({
      next: (data) => this.bookingsByStatus.set(data || []),
    });
  }

  maxRevenue(): number {
    const vals = this.revenue().map((m: any) => Number(m.revenue) || 0);
    return Math.max(...vals, 1);
  }

  getBarHeight(val: number): number {
    return Math.max(4, (Number(val) / this.maxRevenue()) * 96);
  }

  getTotalBookings(): number {
    return this.bookingsByStatus().reduce((s: number, i: any) => s + (i.count || i._count || 0), 0);
  }
}
