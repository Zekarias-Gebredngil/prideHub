import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { Service } from '../../../core/models/content.model';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SkeletonLoaderComponent],
  template: `
    <!-- Hero -->
    <section class="pt-32 pb-16 bg-gradient-to-br from-primary to-dark">
      <div class="container mx-auto px-4 text-center">
        <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">What We Do</span>
        <h1 class="font-display text-5xl font-bold text-white mb-4">Our Services</h1>
        <p class="text-white/70 text-xl max-w-2xl mx-auto">Professional event services tailored to your vision and budget</p>
      </div>
    </section>

    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Filters -->
        <div class="flex flex-wrap gap-3 mb-8">
          <button (click)="selectedCat.set('')"
                  class="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  [class]="!selectedCat() ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
            All
          </button>
          @for (cat of categories(); track cat.id) {
            <button (click)="selectedCat.set(cat.id); loadServices()"
                    class="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    [class]="selectedCat() === cat.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
              {{ cat.name }}
            </button>
          }
        </div>

        <!-- Search -->
        <div class="relative mb-8 max-w-md">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400">search</span>
          <input [(ngModel)]="search" (ngModelChange)="loadServices()" type="text" placeholder="Search services..."
                 class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm">
        </div>

        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (i of [1,2,3,4,5,6]; track i) { <app-skeleton-loader type="card" /> }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (s of services(); track s.id) {
              <a [routerLink]="['/services', s.slug]"
                 class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury border border-gray-100 transition-all duration-300 hover:-translate-y-1">
                <div class="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden relative">
                  @if (s.coverImage) {
                    <img [src]="s.coverImage" [alt]="s.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <span class="material-icons text-5xl text-gray-200">room_service</span>
                    </div>
                  }
                  <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-primary text-xs font-semibold">{{ s.category?.name }}</span>
                </div>
                <div class="p-5">
                  <h3 class="font-semibold text-dark text-lg mb-2 group-hover:text-primary transition-colors">{{ s.name }}</h3>
                  <p class="text-gray-500 text-sm line-clamp-2 mb-4">{{ s.shortDesc }}</p>
                  <div class="flex items-center justify-between">
                    <div>
                      @if (s.price) {
                        <p class="text-xs text-gray-400">Starting from</p>
                        <p class="font-bold text-primary">{{ s.price | number }} ETB</p>
                      }
                    </div>
                    <a [routerLink]="['/services', s.slug]" class="px-4 py-2 rounded-xl bg-primary/5 text-primary text-sm font-medium hover:bg-primary hover:text-white transition-colors">
                      Learn More
                    </a>
                  </div>
                </div>
              </a>
            }
          </div>
          @if (services().length === 0) {
            <div class="text-center py-16">
              <span class="material-icons text-5xl text-gray-200 block mb-3">search_off</span>
              <p class="text-gray-400">No services found. Try a different search.</p>
            </div>
          } @else if (hasNext()) {
            <div class="mt-12 text-center">
              <button (click)="loadMore()" class="px-6 py-3 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary hover:text-white transition-colors inline-flex items-center gap-2">
                <span class="material-icons text-[18px]">refresh</span>
                Load More Services
              </button>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class ServicesComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly services = signal<Service[]>([]);
  readonly categories = signal<any[]>([]);
  readonly loading = signal(true);
  readonly selectedCat = signal('');
  readonly page = signal(1);
  readonly hasNext = signal(false);
  search = '';

  ngOnInit(): void {
    this.api.get<any[]>('services/categories').subscribe({ next: (d) => this.categories.set(d) });
    this.loadServices();
  }

  loadServices(isLoadMore = false): void {
    if (!isLoadMore) {
      this.page.set(1);
      this.loading.set(true);
    }
    const params: any = { limit: 40, page: this.page() };
    if (this.selectedCat()) params['categoryId'] = this.selectedCat();
    if (this.search) params['search'] = this.search;

    this.api.getPaginated<Service>('services', params).subscribe({
      next: (res) => {
        if (isLoadMore) {
          this.services.update(curr => [...curr, ...res.data]);
        } else {
          this.services.set(res.data);
        }
        this.hasNext.set(res.meta?.hasNext || false);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore() {
    this.page.update(p => p + 1);
    this.loadServices(true);
  }
}
