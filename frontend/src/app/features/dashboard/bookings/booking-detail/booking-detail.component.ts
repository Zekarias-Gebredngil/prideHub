import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Booking } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="flex items-center justify-center py-20">
        <span class="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      </div>
    } @else if (booking()) {
      <div>
        <!-- Header -->
        <div class="flex items-center gap-4 mb-6">
          <a routerLink="/dashboard/bookings" class="p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 transition-colors">
            <span class="material-icons text-gray-600 dark:text-white">arrow_back</span>
          </a>
          <div>
            <h1 class="font-display text-2xl font-bold text-dark dark:text-white">{{ booking()!.bookingNumber }}</h1>
            <p class="text-gray-500 dark:text-white/50 text-sm">{{ booking()!.eventType }} · {{ booking()!.eventDate | date:'MMMM d, y' }}</p>
          </div>
          <div class="ml-auto">
            <span class="px-4 py-2 rounded-xl text-sm font-semibold" [class]="statusClass(booking()!.status)">
              {{ booking()!.status }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-5">

            <!-- Event Details -->
            <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
              <h2 class="font-semibold text-dark dark:text-white mb-4">Event Details</h2>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-400">Event Type</p>
                  <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.eventType }}</p>
                </div>
                <div>
                  <p class="text-gray-400">Event Date</p>
                  <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.eventDate | date:'EEEE, MMMM d, y' }}</p>
                </div>
                @if (booking()!.guestCount) {
                  <div>
                    <p class="text-gray-400">Guest Count</p>
                    <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.guestCount }} guests</p>
                  </div>
                }
                @if (booking()!.venue) {
                  <div>
                    <p class="text-gray-400">Venue</p>
                    <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.venue!.name }}</p>
                  </div>
                }
                @if (booking()!.package) {
                  <div>
                    <p class="text-gray-400">Package</p>
                    <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.package!.name }}</p>
                  </div>
                }
                @if (booking()!.planner) {
                  <div>
                    <p class="text-gray-400">Assigned Planner</p>
                    <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.planner!.fullName }}</p>
                  </div>
                }
              </div>
              @if (booking()!.specialRequests) {
                <div class="mt-4 pt-4 border-t border-gray-50 dark:border-white/10">
                  <p class="text-gray-400 text-sm mb-1">Special Requests</p>
                  <p class="text-gray-600 dark:text-white/70 text-sm">{{ booking()!.specialRequests }}</p>
                </div>
              }
            </div>

            <!-- Tasks / Checklist -->
            @if ((booking()!.tasks?.length ?? 0) > 0) {
              <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
                <h2 class="font-semibold text-dark dark:text-white mb-4">Tasks</h2>
                <div class="space-y-2">
                  @for (task of booking()!.tasks!; track task.id) {
                    <div class="flex items-center gap-3 p-3 rounded-xl" [class]="task.isCompleted ? 'bg-green-50 dark:bg-green-900/10' : 'bg-gray-50 dark:bg-white/5'">
                      <span class="material-icons text-lg" [class]="task.isCompleted ? 'text-green-500' : 'text-gray-300'">
                        {{ task.isCompleted ? 'check_circle' : 'radio_button_unchecked' }}
                      </span>
                      <div class="flex-1">
                        <p class="text-sm font-medium" [class]="task.isCompleted ? 'line-through text-gray-400' : 'text-dark dark:text-white'">
                          {{ task.title }}
                        </p>
                        @if (task.dueDate) {
                          <p class="text-xs text-gray-400">Due: {{ task.dueDate | date:'MMM d' }}</p>
                        }
                      </div>
                      <span class="px-2 py-0.5 rounded-full text-xs"
                            [class]="task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : task.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-500'">
                        {{ task.priority }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Payments -->
            @if ((booking()!.payments?.length ?? 0) > 0) {
              <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
                <h2 class="font-semibold text-dark dark:text-white mb-4">Payment History</h2>
                <div class="space-y-3">
                  @for (p of booking()!.payments!; track p.id) {
                    <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                      <div class="flex items-center gap-3">
                        <span class="material-icons text-green-500">payments</span>
                        <div>
                          <p class="text-sm font-medium text-dark dark:text-white">{{ p.amount | number }} ETB</p>
                          <p class="text-xs text-gray-400">{{ p.method }} · {{ p.paidAt | date:'MMM d, y' }}</p>
                        </div>
                      </div>
                      <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">{{ p.status }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Sidebar -->
          <div class="space-y-5">
            <!-- Financial Summary -->
            <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
              <h2 class="font-semibold text-dark dark:text-white mb-4">Financial Summary</h2>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-white/50">Total Amount</span>
                  <span class="font-semibold text-dark dark:text-white">{{ booking()!.totalAmount | number }} ETB</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-white/50">Paid</span>
                  <span class="font-semibold text-green-600">{{ booking()!.paidAmount | number }} ETB</span>
                </div>
                <div class="flex justify-between border-t border-gray-100 dark:border-white/10 pt-3">
                  <span class="text-gray-500 dark:text-white/50">Remaining</span>
                  <span class="font-bold text-primary">{{ (booking()!.totalAmount - booking()!.paidAmount) | number }} ETB</span>
                </div>
              </div>
              @if (booking()!.totalAmount > booking()!.paidAmount) {
                <a routerLink="/dashboard/payments"
                   class="block w-full mt-4 text-center py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-900 transition-colors">
                  Make Payment
                </a>
              }
            </div>

            <!-- Quick Actions -->
            <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
              <h2 class="font-semibold text-dark dark:text-white mb-3">Quick Actions</h2>
              <div class="space-y-2">
                @for (action of actions; track action.label) {
                  <button (click)="action.handler()"
                          class="flex items-center gap-3 w-full p-3 rounded-xl text-sm text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <span class="material-icons text-primary text-base">{{ action.icon }}</span>
                    <span class="text-gray-700 dark:text-white/70">{{ action.label }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class BookingDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  readonly booking = signal<Booking | null>(null);
  readonly loading = signal(true);

  actions = [
    { icon: 'chat', label: 'Message Planner', handler: () => {} },
    { icon: 'download', label: 'Download Invoice', handler: () => {} },
    { icon: 'share', label: 'Share Booking', handler: () => {} },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<Booking>(`bookings/${id}`).subscribe({
      next: (b) => { this.booking.set(b); this.loading.set(false); },
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
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }
}
