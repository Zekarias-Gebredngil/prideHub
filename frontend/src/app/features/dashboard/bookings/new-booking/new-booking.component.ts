import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-booking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/dashboard/bookings" class="p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 transition-colors">
          <span class="material-icons text-gray-600 dark:text-white">arrow_back</span>
        </a>
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">New Booking</h1>
      </div>
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-8 text-center shadow-sm">
        <span class="material-icons text-5xl text-primary/30 block mb-4">event_available</span>
        <p class="text-gray-500 dark:text-white/50 mb-6">Ready to plan your perfect event? Use our full booking flow.</p>
        <a routerLink="/book" class="btn-primary inline-flex items-center gap-2">
          <span class="material-icons">celebration</span> Go to Booking Wizard
        </a>
      </div>
    </div>
  `,
})
export class NewBookingComponent {}
