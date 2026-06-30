import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-vendor-reviews',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Reviews</h1>
      </div>

      <div *ngIf="loading()" class="text-center py-12 text-gray-500">
        Loading reviews...
      </div>

      <div *ngIf="!loading() && reviews().length === 0" class="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <span class="material-icons text-5xl mb-3 text-gray-300">star_border</span>
        <p>You haven't received any reviews yet.</p>
      </div>

      <div *ngIf="!loading() && reviews().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let r of reviews()" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {{ r.user?.fullName?.[0] || 'U' }}
              </div>
              <div>
                <p class="font-bold text-gray-900 dark:text-white text-sm">{{ r.user?.fullName || 'Anonymous' }}</p>
                <p class="text-xs text-gray-500">{{ r.createdAt | date:'MMM d, y' }}</p>
              </div>
            </div>
            <div class="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
              <span class="material-icons text-amber-400 text-sm mr-1">star</span>
              <span class="font-bold text-sm text-amber-700">{{ r.rating }}</span>
            </div>
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-300 flex-grow">{{ r.comment }}</p>
          
          <div *ngIf="!r.isApproved" class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-amber-600 flex items-center gap-1">
            <span class="material-icons text-sm">pending</span>
            Pending Approval
          </div>
        </div>
      </div>
    </div>
  `
})
export class VendorReviewsComponent implements OnInit {
  private api = inject(ApiService);
  reviews = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.get<{ data: any[] }>('vendors/me/reviews').subscribe({
      next: (res) => {
        this.reviews.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load reviews', err);
        this.loading.set(false);
      }
    });
  }
}
