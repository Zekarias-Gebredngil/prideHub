import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SkeletonLoaderComponent, StarRatingComponent],
  template: `
    <section class="pt-32 pb-16" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">Trusted Professionals</span>
        <h1 class="font-display text-5xl font-bold text-white mb-4">Our Vendors</h1>
        <p class="text-white/70 text-lg max-w-2xl mx-auto mb-8">Connect with verified professionals for your perfect event</p>
        <a routerLink="/vendor-setup" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-dark font-semibold hover:bg-secondary/90 transition-colors shadow-lg">
          <span class="material-icons text-[18px]">add_circle</span>
          Become a Vendor
        </a>
      </div>
    </section>

    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          <button (click)="selectedCat.set(''); load()"
                  class="px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 whitespace-nowrap"
                  [class]="!selectedCat() ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/80 hover:bg-gray-200'">
            All Categories
          </button>
          @for (cat of categories(); track cat.id) {
            <button (click)="selectedCat.set(cat.id); load()"
                    class="px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 whitespace-nowrap"
                    [class]="selectedCat() === cat.id ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/80 hover:bg-gray-200'">
              {{ cat.icon }} {{ cat.name }}
            </button>
          }
        </div>

        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            @for (i of [1,2,3,4,5,6,7,8]; track i) { <app-skeleton-loader type="card" /> }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            @for (v of vendors(); track v.id) {
              <a [routerLink]="['/vendors', v.slug]"
                 class="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-luxury border border-gray-100 transition-all duration-300 hover:-translate-y-1">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                    @if (v.logo) {
                      <img [src]="v.logo" [alt]="v.businessName" class="w-full h-full object-cover">
                    } @else {
                      <span class="font-display font-bold text-xl text-primary">{{ v.businessName[0] }}</span>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-dark text-sm truncate group-hover:text-primary transition-colors">{{ v.businessName }}</h3>
                    <span class="text-xs text-gray-400">{{ v.category?.name }}</span>
                  </div>
                  @if (v.isVerified) {
                    <span class="material-icons text-blue-500 text-lg" title="Verified">verified</span>
                  }
                </div>
                <p class="text-gray-500 text-xs line-clamp-2 mb-3">{{ v.description }}</p>
                <div class="flex items-center justify-between">
                  <app-star-rating [value]="v.averageRating" [showCount]="true" [count]="v.totalReviews" />
                  @if (v.basePrice) {
                    <span class="text-primary font-bold text-xs">From {{ v.basePrice | number }}</span>
                  }
                </div>
              </a>
            }
          </div>
          @if (vendors().length === 0) {
            <div class="text-center py-16">
              <span class="material-icons text-5xl text-gray-200 block mb-3">store_mall_directory</span>
              <p class="text-gray-400">No vendors found for this category.</p>
            </div>
          } @else if (hasNext()) {
            <div class="mt-12 text-center">
              <button (click)="loadMore()" class="px-6 py-3 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary hover:text-white transition-colors inline-flex items-center gap-2">
                <span class="material-icons text-[18px]">refresh</span>
                Load More Vendors
              </button>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class VendorsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly vendors = signal<any[]>([]);
  readonly categories = signal<any[]>([]);
  readonly loading = signal(true);
  readonly selectedCat = signal('');
  readonly page = signal(1);
  readonly hasNext = signal(false);

  ngOnInit() {
    this.api.get<any[]>('vendors/categories').subscribe({ next: (d) => this.categories.set(d) });
    this.load();
  }

  load(isLoadMore = false) {
    if (!isLoadMore) {
      this.page.set(1);
      this.loading.set(true);
    }
    const params: any = { limit: 40, page: this.page() };
    if (this.selectedCat()) params['categoryId'] = this.selectedCat();
    this.api.getPaginated<any>('vendors', params).subscribe({
      next: (res) => {
        if (isLoadMore) {
          this.vendors.update(curr => [...curr, ...res.data]);
        } else {
          this.vendors.set(res.data);
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
