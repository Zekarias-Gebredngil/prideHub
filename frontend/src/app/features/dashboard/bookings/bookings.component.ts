import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Booking } from '../../../core/models/booking.model';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SkeletonLoaderComponent],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold text-dark dark:text-white">My Bookings</h1>
          <p class="text-gray-500 dark:text-white/50 text-sm">Track and manage all your event bookings</p>
        </div>
        <a routerLink="/dashboard/bookings/new"
           class="btn-primary inline-flex items-center gap-2 text-sm">
          <span class="material-icons text-base">add</span> New Booking
        </a>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button (click)="statusFilter.set('')"
                class="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                [class]="!statusFilter() ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60 hover:bg-gray-200'">
          All
        </button>
        @for (s of statuses; track s) {
          <button (click)="statusFilter.set(s)"
                  class="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                  [class]="statusFilter() === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60 hover:bg-gray-200'">
            {{ s }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3,4]; track i) { <app-skeleton-loader type="list-item" /> }
        </div>
      } @else if (bookings().length === 0) {
        <div class="text-center py-16 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
          <span class="material-icons text-5xl text-gray-200 block mb-3">event_busy</span>
          <h3 class="font-semibold text-dark dark:text-white mb-1">No bookings found</h3>
          <p class="text-gray-400 text-sm mb-4">Start planning your first event today</p>
          <a routerLink="/dashboard/bookings/new" class="btn-primary inline-flex items-center gap-2 text-sm">
            <span class="material-icons text-sm">add</span> Create Booking
          </a>
        </div>
      } @else {
        <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 dark:bg-white/5 text-xs text-gray-400 uppercase tracking-wider">
                  <th class="text-left px-5 py-3 font-medium">Booking #</th>
                  <th class="text-left px-5 py-3 font-medium">Event</th>
                  <th class="text-left px-5 py-3 font-medium">Date</th>
                  <th class="text-left px-5 py-3 font-medium">Venue</th>
                  <th class="text-left px-5 py-3 font-medium">Amount</th>
                  <th class="text-left px-5 py-3 font-medium">Status</th>
                  <th class="text-left px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-white/5">
                @for (b of filteredBookings(); track b.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td class="px-5 py-3.5 font-mono text-xs text-primary font-semibold">{{ b.bookingNumber }}</td>
                    <td class="px-5 py-3.5">
                      <p class="font-medium text-dark dark:text-white">{{ b.eventType }}</p>
                      @if (b.package) {
                        <p class="text-gray-400 text-xs">{{ b.package.name }}</p>
                      }
                    </td>
                    <td class="px-5 py-3.5 text-gray-600 dark:text-white/60">{{ b.eventDate | date:'MMM d, y' }}</td>
                    <td class="px-5 py-3.5 text-gray-600 dark:text-white/60">{{ b.venue?.name || '—' }}</td>
                    <td class="px-5 py-3.5 font-semibold text-dark dark:text-white">{{ b.totalAmount | number }} ETB</td>
                    <td class="px-5 py-3.5">
                      <span class="px-2.5 py-1 rounded-full text-xs font-semibold" [class]="statusClass(b.status)">
                        {{ b.status }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5">
                      <a [routerLink]="['/dashboard/bookings', b.id]"
                         class="text-primary hover:underline text-xs font-medium flex items-center gap-1">
                        View <span class="material-icons text-xs">arrow_forward</span>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class BookingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(true);
  readonly statusFilter = signal('');

  statuses = ['PENDING', 'CONFIRMED', 'PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  readonly filteredBookings = () => {
    const s = this.statusFilter();
    if (!s) return this.bookings();
    return this.bookings().filter(b => b.status === s);
  };

  ngOnInit(): void {
    this.api.getPaginated<Booking>('bookings', { limit: 50 }).subscribe({
      next: (res) => { this.bookings.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING: 'bg-yellow-50 text-yellow-700',
      CONFIRMED: 'bg-green-50 text-green-700',
      COMPLETED: 'bg-blue-50 text-blue-700',
      CANCELLED: 'bg-red-50 text-red-700',
      PLANNING: 'bg-purple-50 text-purple-700',
      IN_PROGRESS: 'bg-orange-50 text-orange-700',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }
}
