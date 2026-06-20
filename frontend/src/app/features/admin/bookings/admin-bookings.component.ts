import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Booking } from '../../../core/models/booking.model';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">All Bookings</h1>
        <div class="flex gap-3">
          <select [(ngModel)]="statusFilter" (ngModelChange)="load()"
                  class="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm focus:outline-none focus:border-primary dark:text-white">
            <option value="">All Statuses</option>
            @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
          </select>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        @for (s of stats(); track s.label) {
          <div class="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10 text-center shadow-sm">
            <p class="font-bold text-xl text-dark dark:text-white">{{ s.value }}</p>
            <p class="text-gray-400 text-xs">{{ s.label }}</p>
          </div>
        }
      </div>

      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-white/5 text-xs text-gray-400 uppercase tracking-wider">
                <th class="text-left px-4 py-3 font-medium">Booking #</th>
                <th class="text-left px-4 py-3 font-medium">Client</th>
                <th class="text-left px-4 py-3 font-medium">Event</th>
                <th class="text-left px-4 py-3 font-medium">Date</th>
                <th class="text-left px-4 py-3 font-medium">Amount</th>
                <th class="text-left px-4 py-3 font-medium">Status</th>
                <th class="text-left px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-white/5">
              @if (loading()) {
                @for (i of [1,2,3,4,5]; track i) {
                  <tr><td colspan="7" class="px-4 py-4"><div class="skeleton h-4 rounded w-full"></div></td></tr>
                }
              }
              @for (b of bookings(); track b.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td class="px-4 py-3 font-mono text-xs text-primary font-semibold">{{ b.bookingNumber }}</td>
                  <td class="px-4 py-3 text-dark dark:text-white">{{ b.client?.fullName }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-white/60">{{ b.eventType }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-white/60 text-xs">{{ b.eventDate | date:'MMM d, y' }}</td>
                  <td class="px-4 py-3 font-semibold text-dark dark:text-white">{{ b.totalAmount | number }} ETB</td>
                  <td class="px-4 py-3">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold" [class]="statusClass(b.status)">{{ b.status }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <a [routerLink]="['/admin/bookings', b.id]" class="text-primary text-xs hover:underline">View</a>
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
export class AdminBookingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly bookings = signal<Booking[]>([]);
  readonly stats = signal<any[]>([]);
  readonly loading = signal(true);
  statusFilter = '';
  statuses = ['PENDING', 'CONFIRMED', 'PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  ngOnInit(): void {
    this.api.get<any>('bookings/stats').subscribe({
      next: (s) => this.stats.set([
        { label: 'Total', value: s.total },
        { label: 'Pending', value: s.pending },
        { label: 'Confirmed', value: s.confirmed },
        { label: 'Completed', value: s.completed },
      ]),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: any = { limit: 100 };
    if (this.statusFilter) params['status'] = this.statusFilter;
    this.api.getPaginated<Booking>('bookings', params).subscribe({
      next: (res) => { this.bookings.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING: 'bg-yellow-50 text-yellow-700', CONFIRMED: 'bg-green-50 text-green-700',
      COMPLETED: 'bg-blue-50 text-blue-700', CANCELLED: 'bg-red-50 text-red-700',
      PLANNING: 'bg-purple-50 text-purple-700', IN_PROGRESS: 'bg-orange-50 text-orange-700',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }
}
