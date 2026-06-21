import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
            <div class="flex items-center gap-2">
              @if (updatingStatus()) {
                <span class="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
              }
              <select [ngModel]="booking().status" (ngModelChange)="updateStatus($event)"
                      [disabled]="updatingStatus()"
                      class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-semibold focus:outline-none focus:border-primary"
                      [class]="statusClass(booking().status)">
                @for (s of statuses; track s) {
                  <option [value]="s" class="text-dark bg-white">{{ s }}</option>
                }
              </select>
            </div>
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

      <!-- Confirmation Dialog -->
      @if (pendingStatus()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div class="bg-white dark:bg-dark rounded-2xl border border-gray-100 dark:border-white/10 p-6 max-w-sm w-full shadow-luxury animate-fade-in">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <span class="material-icons text-xl">info</span>
              </div>
              <h3 class="text-lg font-bold text-dark dark:text-white">Change Status</h3>
            </div>
            <p class="text-gray-600 dark:text-white/70 mb-6">Are you sure you want to change the booking status to <strong>{{ pendingStatus() }}</strong>?</p>
            <div class="flex items-center justify-end gap-3">
              <button (click)="pendingStatus.set(null)" class="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button (click)="confirmUpdateStatus()" class="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-900 transition-colors shadow-sm">
                Confirm
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Alert Dialog -->
      @if (alertMessage()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div class="bg-white dark:bg-dark rounded-2xl border border-gray-100 dark:border-white/10 p-6 max-w-sm w-full shadow-luxury animate-fade-in">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <span class="material-icons text-xl">error</span>
              </div>
              <h3 class="text-lg font-bold text-dark dark:text-white">Error</h3>
            </div>
            <p class="text-gray-600 dark:text-white/70 mb-6">{{ alertMessage() }}</p>
            <div class="flex justify-end">
              <button (click)="alertMessage.set(null)" class="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/10 text-dark dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                Close
              </button>
            </div>
          </div>
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
  readonly updatingStatus = signal(false);
  readonly pendingStatus = signal<string | null>(null);
  readonly alertMessage = signal<string | null>(null);
  statuses = ['PENDING', 'CONFIRMED', 'PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.api.get<any>(`bookings/${id}`).subscribe({
      next: (b) => { this.booking.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

    updateStatus(status: string): void {
      this.pendingStatus.set(status);
    }
  
    confirmUpdateStatus(): void {
      const status = this.pendingStatus();
      if (!status) return;
  
      this.updatingStatus.set(true);
      const id = this.route.snapshot.paramMap.get('id')!;
      this.api.patch(`bookings/${id}/status`, { status }).subscribe({
        next: () => {
          this.updatingStatus.set(false);
          this.pendingStatus.set(null);
          this.load();
        },
        error: () => {
          this.updatingStatus.set(false);
          this.pendingStatus.set(null);
          this.alertMessage.set('Failed to update status. Please try again.');
        }
      });
    }
  
    statusClass(s: string): string {
      const m: Record<string, string> = {
        PENDING: 'text-yellow-700', CONFIRMED: 'text-green-700',
        COMPLETED: 'text-blue-700', CANCELLED: 'text-red-700',
        PLANNING: 'text-purple-700', IN_PROGRESS: 'text-orange-700',
      };
      return m[s] || 'text-gray-600';
    }
  }
