import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { Venue } from '../../../core/models/content.model';

@Component({
  selector: 'app-venues',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SkeletonLoaderComponent],
  template: `
    <section class="pt-32 pb-16" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">Stunning Locations</span>
        <h1 class="font-display text-5xl font-bold text-white mb-4">Our Venues</h1>
        <p class="text-white/70 text-lg max-w-2xl mx-auto">Discover premium venues across Ethiopia for any occasion</p>
      </div>
    </section>

    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Filters -->
        <div class="space-y-3 mb-8">
          <div class="relative w-full max-w-sm">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-base">search</span>
            <input [(ngModel)]="search" (ngModelChange)="load()" type="text" placeholder="Search venues by name or location..."
                   class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm">
          </div>
          <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            @for (city of cities; track city) {
              <button (click)="selectedCity.set(city); load()"
                      class="px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 whitespace-nowrap"
                      [class]="selectedCity() === city ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/80 hover:bg-gray-200'">
                {{ city || 'All Cities' }}
              </button>
            }
          </div>
        </div>

        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (i of [1,2,3,4,5,6]; track i) { <app-skeleton-loader type="card" /> }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (v of venues(); track v.id) {
              <a [routerLink]="['/venues', v.slug]"
                 class="group relative rounded-2xl overflow-hidden h-72 shadow-sm hover:shadow-luxury transition-all cursor-pointer">
                <div class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20">
                  @if (v.coverImage) {
                    <img [src]="v.coverImage" [alt]="v.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <span class="material-icons text-7xl text-gray-300">location_city</span>
                    </div>
                  }
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-5">
                  <h3 class="text-white font-semibold text-lg">{{ v.name }}</h3>
                  <div class="flex items-center justify-between mt-1">
                    <span class="flex items-center gap-1 text-white/70 text-sm">
                      <span class="material-icons text-sm">location_on</span> {{ v.city }}
                    </span>
                    @if (v.capacity) {
                      <span class="flex items-center gap-1 text-white/70 text-sm">
                        <span class="material-icons text-sm">people</span> {{ v.capacity }}
                      </span>
                    }
                  </div>
                  @if (v.pricePerDay) {
                    <p class="text-secondary font-bold text-sm mt-1">From {{ v.pricePerDay | number }} ETB/day</p>
                  }
                </div>
                <div class="absolute top-3 right-3">
                  <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-dark text-xs font-semibold">
                    <span class="material-icons text-secondary text-sm">star</span>
                    {{ v.averageRating | number:'1.1-1' }}
                  </span>
                </div>
              </a>
            }
          </div>
          @if (venues().length === 0) {
            <div class="text-center py-16">
              <span class="material-icons text-5xl text-gray-200 block mb-3">location_off</span>
              <p class="text-gray-400">No venues found. Try a different filter.</p>
            </div>
          } @else if (hasNext()) {
            <div class="mt-12 text-center">
              <button (click)="loadMore()" class="px-6 py-3 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary hover:text-white transition-colors inline-flex items-center gap-2">
                <span class="material-icons text-[18px]">refresh</span>
                Load More Venues
              </button>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class VenuesComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly venues = signal<Venue[]>([]);
  readonly loading = signal(true);
  readonly selectedCity = signal('');
  readonly page = signal(1);
  readonly hasNext = signal(false);
  search = '';
  cities = ['', 'Addis Ababa', 'Hawassa', 'Adama', 'Bahir Dar', 'Mekelle', 'Gondar'];

  ngOnInit() { this.load(); }

  load(isLoadMore = false) {
    if (!isLoadMore) {
      this.page.set(1);
      this.loading.set(true);
    }
    const params: any = { limit: 40, page: this.page() };
    if (this.selectedCity()) params['city'] = this.selectedCity();
    if (this.search) params['search'] = this.search;
    this.api.getPaginated<Venue>('venues', params).subscribe({
      next: (res) => {
        if (isLoadMore) {
          this.venues.update(curr => [...curr, ...res.data]);
        } else {
          this.venues.set(res.data);
        }
        this.hasNext.set(res.meta?.hasNext || false);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore() {
    this.page.update(p => p + 1);
    this.load(true);
  }
}
