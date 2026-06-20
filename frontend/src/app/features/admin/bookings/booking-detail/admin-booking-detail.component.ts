import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-admin-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/admin/bookings"
           class="p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 transition-colors">
          <span class="material-icons text-gray-600 dark:text-white">arrow_back</span>
        </a>
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Booking Detail</h1>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <span class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
        </div>
      } @else if (booking()) {
        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="font-mono font-bold text-primary text-lg">{{ booking().bookingNumber }}</h2>
              <p class="text-gray-500 text-sm">{{ booking().eventType }} · {{ booking().eventDate | date:'MMMM d, y' }}</p>
            </div>
            <span class="px-4 py-2 rounded-xl text-sm font-semibold bg-green-50 text-green-700">
              {{ booking().status }}
            </span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-gray-400">Client</p>
              <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking().client?.fullName }}</p>
            </div>
            <div>
              <p class="text-gray-400">Total Amount</p>
              <p class="font-bold text-primary mt-0.5">{{ booking().totalAmount | number }} ETB</p>
            </div>
            <div>
              <p class="text-gray-400">Paid</p>
              <p class="font-medium text-green-600 mt-0.5">{{ booking().paidAmount | number }} ETB</p>
            </div>
            @if (booking().venue) {
              <div>
                <p class="text-gray-400">Venue</p>
                <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking().venue.name }}</p>
              </div>
            }
            @if (booking().package) {
              <div>
                <p class="text-gray-400">Package</p>
                <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking().package.name }}</p>
              </div>
            }
            @if (booking().guestCount) {
              <div>
                <p class="text-gray-400">Guests</p>
                <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking().guestCount }}</p>
              </div>
            }
          </div>

          @if (booking().specialRequests) {
            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
              <p class="text-gray-400 text-sm mb-1">Special Requests</p>
              <p class="text-gray-600 dark:text-white/70 text-sm">{{ booking().specialRequests }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminBookingDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly booking = signal<any>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<any>(`bookings/${id}`).subscribe({
      next: (b) => { this.booking.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
