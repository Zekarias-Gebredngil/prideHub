import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { Venue } from '../../../../core/models/content.model';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-venue-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StarRatingComponent],
  template: `
    @if (loading()) {
      <div class="min-h-screen flex items-center justify-center">
        <span class="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      </div>
    } @else if (venue()) {
      <!-- Hero -->
      <div class="relative h-80 md:h-[500px] bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
        @if (venue()!.coverImage) {
          <img [src]="venue()!.coverImage" [alt]="venue()!.name" class="w-full h-full object-cover">
        } @else {
          <div class="w-full h-full flex items-center justify-center">
            <span class="material-icons text-9xl text-gray-300">location_city</span>
          </div>
        }
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-8">
          <div class="container mx-auto px-4">
            <nav class="text-white/60 text-sm mb-3">
              <a routerLink="/venues" class="hover:text-white">Venues</a>
              <span class="mx-2">›</span>
              <span class="text-white">{{ venue()!.name }}</span>
            </nav>
            <h1 class="font-display text-4xl font-bold text-white">{{ venue()!.name }}</h1>
            <div class="flex flex-wrap items-center gap-4 mt-3">
              <span class="flex items-center gap-1 text-white/80"><span class="material-icons text-sm">location_on</span>{{ venue()!.address }}, {{ venue()!.city }}</span>
              @if (venue()!.capacity) {
                <span class="flex items-center gap-1 text-white/80"><span class="material-icons text-sm">people</span>Up to {{ venue()!.capacity }} guests</span>
              }
              <app-star-rating [value]="venue()!.averageRating" [showCount]="true" [count]="venue()!.totalReviews" />
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <!-- Description -->
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 class="font-display text-2xl font-bold text-dark mb-4">About This Venue</h2>
              <p class="text-gray-600 leading-relaxed">{{ venue()!.description }}</p>
            </div>

            <!-- Amenities -->
            @if (venue()!.amenities) {
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 class="font-semibold text-dark text-lg mb-4">Amenities</h2>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                  @for (item of getAmenities(); track item.label) {
                    <div class="flex items-center gap-2 text-sm" [class]="item.value ? 'text-gray-700' : 'text-gray-300 line-through'">
                      <span class="material-icons text-base" [class]="item.value ? 'text-green-500' : 'text-gray-300'">
                        {{ item.value ? 'check_circle' : 'cancel' }}
                      </span>
                      {{ item.label }}
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Reviews -->
            @if ((venue()!.reviews?.length ?? 0) > 0) {
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 class="font-semibold text-dark text-lg mb-4">Client Reviews</h2>
                <div class="space-y-4">
                  @for (review of venue()!.reviews!.slice(0,5); track review.id) {
                    <div class="flex gap-3 pb-4 border-b border-gray-50 last:border-0">
                      <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {{ review.user?.fullName?.[0] || 'U' }}
                      </div>
                      <div>
                        <p class="font-medium text-dark text-sm">{{ review.user?.fullName }}</p>
                        <app-star-rating [value]="review.rating" class="my-1" />
                        <p class="text-gray-500 text-sm">{{ review.comment }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Booking Card -->
          <div>
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              @if (venue()!.pricePerDay) {
                <p class="text-gray-500 text-sm mb-1">Price per day</p>
                <p class="font-display font-bold text-3xl text-primary mb-1">{{ venue()!.pricePerDay | number }} <span class="text-base font-normal text-gray-500">ETB</span></p>
              }
              @if (venue()!.capacity) {
                <p class="text-gray-500 text-sm mb-4 flex items-center gap-1">
                  <span class="material-icons text-sm">people</span>
                  Up to {{ venue()!.capacity }} guests
                </p>
              }
              <a routerLink="/book" [queryParams]="{ venueId: venue()!.id }"
                 class="block w-full text-center py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-900 transition-colors mb-3">
                Book This Venue
              </a>
              <a routerLink="/contact" class="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:border-primary hover:text-primary transition-colors">
                Ask a Question
              </a>

              @if (venue()!.googleMapsUrl) {
                <a [href]="venue()!.googleMapsUrl" target="_blank" rel="noopener"
                   class="flex items-center gap-2 justify-center mt-4 text-primary text-sm hover:underline">
                  <span class="material-icons text-sm">map</span> View on Google Maps
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class VenueDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly venue = signal<Venue | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.get<Venue>(`venues/${slug}`).subscribe({
      next: (v) => { this.venue.set(v); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getAmenities() {
    const a = this.venue()?.amenities || {};
    const labels: Record<string, string> = {
      parking: 'Parking', wifi: 'Wi-Fi', airConditioning: 'Air Conditioning',
      catering: 'Catering', audioVisual: 'Audio/Visual', security: 'Security',
    };
    return Object.entries(a).map(([key, val]) => ({ label: labels[key] || key, value: val }));
  }
}
