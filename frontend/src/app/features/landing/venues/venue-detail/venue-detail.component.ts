import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { Venue } from '../../../../core/models/content.model';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-venue-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StarRatingComponent],
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

              <a [routerLink]="'/dashboard/messages'" [queryParams]="{ receiverId: getVendorUserId() }"
                 class="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-colors mb-3">
                <span class="material-icons text-base">chat</span> Send Message
              </a>

              <a [href]="'tel:' + getPhone()"
                 class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors mb-3">
                <span class="material-icons text-base">call</span> Call Venue: {{ getPhone() }}
              </a>

              <button (click)="openReachOutModal()"
                      class="w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-sm hover:border-secondary hover:text-dark transition-colors font-medium">
                <span class="material-icons text-base align-middle mr-1">contact_mail</span> Reach Out / Inquire
              </button>

              @if (venue()!.googleMapsUrl) {
                <a [href]="venue()!.googleMapsUrl" target="_blank" rel="noopener"
                   class="flex items-center gap-2 justify-center mt-4 text-primary text-sm hover:underline">
                  <span class="material-icons text-sm">map</span> View on Google Maps
                </a>
              }
            </div>
          </div>
        </div>

        <!-- Reach Out Modal -->
        @if (showReachOutModal()) {
          <div class="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 class="font-display font-bold text-lg text-dark">Reach Out to {{ venue()!.name }}</h3>
                <button (click)="showReachOutModal.set(false)" class="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                  <span class="material-icons">close</span>
                </button>
              </div>
              @if (reachOutSuccess()) {
                <div class="p-4 rounded-xl bg-green-50 text-green-800 text-sm text-center">
                  <span class="material-icons text-3xl text-green-500 block mb-1">check_circle</span>
                  Your inquiry message has been sent successfully!
                </div>
              } @else {
                <div class="space-y-3">
                  <p class="text-sm text-gray-500">Send a direct message inquiry to the venue management:</p>
                  <textarea [(ngModel)]="reachOutMessage" rows="4" placeholder="Hi, I'm inquiring about booking {{ venue()!.name }} for our upcoming celebration..."
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary resize-none"></textarea>
                  <div class="flex justify-end gap-3 pt-2">
                    <button (click)="showReachOutModal.set(false)" class="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">Cancel</button>
                    <button (click)="sendReachOutInquiry()" [disabled]="!reachOutMessage.trim() || sendingReachOut()"
                            class="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 disabled:opacity-50">
                      {{ sendingReachOut() ? 'Sending...' : 'Send Inquiry' }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }
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

  readonly showReachOutModal = signal(false);
  readonly sendingReachOut = signal(false);
  readonly reachOutSuccess = signal(false);
  reachOutMessage = '';

  getVendorUserId(): string {
    const v = this.venue() as any;
    return v?.vendor?.user?.id || v?.ownerId || v?.id || '';
  }

  getPhone(): string {
    const v = this.venue() as any;
    return v?.contactPhone || v?.vendor?.contactPhone || '+251 911 234 567';
  }

  openReachOutModal() {
    this.reachOutMessage = '';
    this.reachOutSuccess.set(false);
    this.showReachOutModal.set(true);
  }

  sendReachOutInquiry() {
    const targetUserId = this.getVendorUserId();
    if (!targetUserId || !this.reachOutMessage.trim()) return;
    this.sendingReachOut.set(true);
    this.api.post('messages', { receiverId: targetUserId, content: this.reachOutMessage.trim() }).subscribe({
      next: () => {
        this.sendingReachOut.set(false);
        this.reachOutSuccess.set(true);
        setTimeout(() => this.showReachOutModal.set(false), 2000);
      },
      error: () => {
        this.sendingReachOut.set(false);
        alert('Could not send inquiry. Please log in or try again.');
      },
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
