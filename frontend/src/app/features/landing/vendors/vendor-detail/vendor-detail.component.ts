import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StarRatingComponent],
  template: `
    @if (loading()) {
      <div class="min-h-screen flex items-center justify-center">
        <span class="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      </div>
    } @else if (vendor()) {
      <div class="pt-20">
        <!-- Cover -->
        <div class="h-64 bg-gradient-to-br from-primary/20 to-secondary/10 overflow-hidden relative">
          @if (vendor().coverImage) {
            <img [src]="vendor().coverImage" [alt]="vendor().businessName" class="w-full h-full object-cover">
          }
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <div class="container mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-16">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
              <!-- Profile card -->
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div class="flex items-start gap-5">
                  <div class="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    @if (vendor().logo) {
                      <img [src]="vendor().logo" [alt]="vendor().businessName" class="w-full h-full object-cover">
                    } @else {
                      <span class="font-display font-bold text-3xl text-primary">{{ vendor().businessName[0] }}</span>
                    }
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h1 class="font-display text-2xl font-bold text-dark">{{ vendor().businessName }}</h1>
                      @if (vendor().isVerified) {
                        <span class="flex items-center gap-1 text-blue-500 text-sm font-medium">
                          <span class="material-icons text-base">verified</span> Verified
                        </span>
                      }
                    </div>
                    <p class="text-primary font-medium text-sm mb-2">{{ vendor().category?.name }}</p>
                    <app-star-rating [value]="vendor().averageRating" [showCount]="true" [count]="vendor().totalReviews" />
                    @if (vendor().city) {
                      <p class="flex items-center gap-1 text-gray-400 text-sm mt-1">
                        <span class="material-icons text-sm">location_on</span> {{ vendor().city }}
                      </p>
                    }
                  </div>
                </div>
                <p class="text-gray-600 leading-relaxed mt-4">{{ vendor().description }}</p>
              </div>

              <!-- Portfolio Media -->
              @if ((vendor().media?.length ?? 0) > 0) {
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 class="font-semibold text-dark text-lg mb-4">Portfolio</h2>
                  <div class="grid grid-cols-3 gap-3">
                    @for (m of vendor().media.slice(0,9); track m.id) {
                      <div class="aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img [src]="m.url" [alt]="m.title || 'Portfolio'" class="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer">
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Reviews -->
              @if ((vendor().reviews?.length ?? 0) > 0) {
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 class="font-semibold text-dark text-lg mb-4">Client Reviews</h2>
                  <div class="space-y-4">
                    @for (r of vendor().reviews.slice(0,5); track r.id) {
                      <div class="flex gap-3 pb-4 border-b border-gray-50 last:border-0">
                        <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {{ r.user?.fullName?.[0] || 'U' }}
                        </div>
                        <div>
                          <p class="font-medium text-dark text-sm">{{ r.user?.fullName }}</p>
                          <app-star-rating [value]="r.rating" class="my-1" />
                          <p class="text-gray-500 text-sm">{{ r.comment }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Booking Sidebar -->
            <div>
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                @if (vendor().basePrice) {
                  <p class="text-gray-400 text-sm mb-1">Starting price</p>
                  <p class="font-display font-bold text-3xl text-primary mb-1">
                    {{ vendor().basePrice | number }} <span class="text-sm font-normal text-gray-500">ETB</span>
                  </p>
                  <p class="text-gray-400 text-xs mb-5">{{ vendor().priceUnit }}</p>
                }
                <a routerLink="/book" [queryParams]="{ vendorId: vendor().id }"
                   class="block w-full text-center py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-900 transition-colors mb-3">
                  Book This Vendor
                </a>
                <a routerLink="/dashboard/messages"
                   class="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:border-primary hover:text-primary transition-colors">
                  Send Message
                </a>
                @if (vendor().website) {
                  <a [href]="vendor().website" target="_blank" class="flex items-center justify-center gap-2 mt-3 text-primary text-sm hover:underline">
                    <span class="material-icons text-sm">language</span> Visit Website
                  </a>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class VendorDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly vendor = signal<any>(null);
  readonly loading = signal(true);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.get<any>(`vendors/${slug}`).subscribe({
      next: (v) => { this.vendor.set(v); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
