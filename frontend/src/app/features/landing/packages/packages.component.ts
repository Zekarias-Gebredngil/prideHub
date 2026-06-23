import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { Package } from '../../../core/models/content.model';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent],
  template: `
    <section class="pt-32 pb-16" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">All-Inclusive</span>
        <h1 class="font-display text-5xl font-bold text-white mb-4">Event Packages</h1>
        <p class="text-white/70 text-lg max-w-2xl mx-auto">Everything you need for the perfect event — bundled and priced to fit your budget.</p>
      </div>
    </section>

    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (i of [1,2,3,4]; track i) { <app-skeleton-loader type="card" /> }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (pkg of packages(); track pkg.id) {
              <div class="relative group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury border border-gray-100 transition-all duration-300 hover:-translate-y-1">
                @if (pkg.discountPct > 0) {
                  <div class="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold bg-secondary text-dark">
                    {{ pkg.discountPct }}% OFF
                  </div>
                }
                <div class="h-2 w-full" [style.background]="pkg.color || '#8B1538'"></div>
                <div class="p-6">
                  <span class="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
                        [style.background]="(pkg.color || '#8B1538') + '20'"
                        [style.color]="pkg.color || '#8B1538'">
                    {{ pkg.tier }}
                  </span>
                  <h3 class="font-display font-bold text-xl text-dark mb-2">{{ pkg.name }}</h3>
                  <p class="text-gray-400 text-sm mb-4">{{ pkg.shortDesc }}</p>

                  <ul class="space-y-2 mb-6">
                    @for (item of (pkg.items || []).slice(0, 5); track item.id) {
                      <li class="flex items-center gap-2 text-sm text-gray-600">
                        <span class="material-icons text-secondary text-sm">check_circle</span>
                        {{ item.description }}
                      </li>
                    }
                    @if ((pkg.items?.length ?? 0) > 5) {
                      <li class="text-xs text-gray-400 pl-5">+ {{ (pkg.items?.length ?? 0) - 5 }} more</li>
                    }
                  </ul>

                  <div class="border-t border-gray-100 pt-4 mb-4">
                    <p class="text-xs text-gray-400 mb-1">Starting from</p>
                    <p class="font-display font-bold text-2xl text-primary">{{ pkg.price | number }} <span class="text-sm font-normal text-gray-400">ETB</span></p>
                    @if (pkg.maxGuests) {
                      <p class="text-xs text-gray-400 mt-1">Up to {{ pkg.maxGuests }} guests</p>
                    }
                  </div>

                  <a [routerLink]="['/packages', pkg.slug]"
                     class="block w-full text-center py-3 rounded-xl font-semibold text-white bg-primary transition-colors"
                     [style.background]="pkg.color">
                    View Details
                  </a>
                </div>
              </div>
            }
          </div>
          @if (packages().length === 0) {
            <div class="text-center py-16">
              <span class="material-icons text-5xl text-gray-200 block mb-3">inventory_2</span>
              <p class="text-gray-400">No packages found.</p>
            </div>
          } @else if (hasNext()) {
            <div class="mt-12 text-center">
              <button (click)="loadMore()" class="px-6 py-3 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary hover:text-white transition-colors inline-flex items-center gap-2">
                <span class="material-icons text-[18px]">refresh</span>
                Load More Packages
              </button>
            </div>
          }
        }
      </div>
    </section>

    <!-- Compare CTA -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4 text-center">
        <h2 class="font-display text-3xl font-bold text-dark mb-4">Need a Custom Package?</h2>
        <p class="text-gray-500 text-lg mb-6">We'll tailor a package specifically for your event and budget.</p>
        <a routerLink="/contact" class="btn-primary inline-flex items-center gap-2">
          <span class="material-icons">chat</span> Request Custom Quote
        </a>
      </div>
    </section>
  `,
})
export class PackagesComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly packages = signal<Package[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly hasNext = signal(false);

  ngOnInit() {
    this.load();
  }

  load(isLoadMore = false) {
    if (!isLoadMore) {
      this.page.set(1);
      this.loading.set(true);
    }
    
    this.api.getPaginated<Package>('packages', { limit: 12, page: this.page() }).subscribe({
      next: (res) => { 
        if (isLoadMore) {
          this.packages.update(curr => [...curr, ...res.data]);
        } else {
          this.packages.set(res.data);
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
