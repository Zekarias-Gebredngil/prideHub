import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { Package } from '../../../../core/models/content.model';

@Component({
  selector: 'app-package-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="min-h-screen flex items-center justify-center">
        <span class="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      </div>
    } @else if (pkg()) {
      <section class="pt-28 pb-16" [style.background]="'linear-gradient(135deg,' + (pkg()!.color || '#8B1538') + ', #2B2B2B)'">
        <div class="container mx-auto px-4">
          <nav class="text-white/60 text-sm mb-4 flex items-center gap-2">
            <a routerLink="/packages" class="hover:text-white">Packages</a>
            <span>›</span> <span class="text-white">{{ pkg()!.name }}</span>
          </nav>
          <div class="flex items-center gap-3 mb-3">
            <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                  [style.background]="(pkg()!.color || '#8B1538') + '40'"
                  style="color:#D4AF37">{{ pkg()!.tier }}</span>
            @if (pkg()!.discountPct > 0) {
              <span class="px-3 py-1.5 rounded-full bg-secondary text-dark text-xs font-bold">{{ pkg()!.discountPct }}% OFF</span>
            }
          </div>
          <h1 class="font-display text-4xl md:text-5xl font-bold text-white mb-4">{{ pkg()!.name }}</h1>
          <p class="text-white/70 text-lg max-w-2xl">{{ pkg()!.shortDesc }}</p>
        </div>
      </section>

      <section class="section bg-white">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 class="font-semibold text-dark text-lg mb-4">What's Included</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  @for (item of pkg()!.items || []; track item.id) {
                    <div class="flex items-center gap-2 p-3 rounded-xl"
                         [class]="item.isIncluded ? 'bg-green-50' : 'bg-gray-50'">
                      <span class="material-icons text-base"
                            [class]="item.isIncluded ? 'text-green-500' : 'text-gray-300'">
                        {{ item.isIncluded ? 'check_circle' : 'cancel' }}
                      </span>
                      <span class="text-sm" [class]="item.isIncluded ? 'text-gray-700' : 'text-gray-400 line-through'">
                        {{ item.description }}
                      </span>
                    </div>
                  }
                </div>
              </div>

              @if ((pkg()!.addOns?.length ?? 0) > 0) {
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 class="font-semibold text-dark text-lg mb-4">Optional Add-Ons</h2>
                  <div class="space-y-2">
                    @for (addon of pkg()!.addOns!; track addon.id) {
                      <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <span class="text-sm text-gray-700">{{ addon.name }}</span>
                        <span class="font-bold text-primary text-sm">+ {{ addon.price | number }} ETB</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div>
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                @if (pkg()!.discountPct > 0) {
                  <p class="text-gray-400 text-sm line-through">{{ pkg()!.price | number }} ETB</p>
                  <p class="font-display font-bold text-3xl text-primary">
                    {{ discountedPrice() | number }} <span class="text-base font-normal text-gray-400">ETB</span>
                  </p>
                  <p class="text-green-600 text-sm font-medium mb-4">You save {{ savings() | number }} ETB</p>
                } @else {
                  <p class="text-gray-400 text-sm mb-1">Price</p>
                  <p class="font-display font-bold text-3xl text-primary mb-4">
                    {{ pkg()!.price | number }} <span class="text-base font-normal text-gray-400">ETB</span>
                  </p>
                }
                @if (pkg()!.maxGuests) {
                  <p class="text-sm text-gray-500 flex items-center gap-1 mb-4">
                    <span class="material-icons text-sm">people</span> Up to {{ pkg()!.maxGuests }} guests
                  </p>
                }
                <a routerLink="/book" [queryParams]="{ packageId: pkg()!.id }"
                   class="block w-full text-center py-4 rounded-xl font-semibold text-white transition-colors hover:opacity-90 mb-3"
                   [style.background]="pkg()!.color || '#8B1538'">
                  Book This Package
                </a>
                <a routerLink="/contact"
                   class="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:border-primary hover:text-primary transition-colors">
                  Request Custom Quote
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    }
  `,
})
export class PackageDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly pkg = signal<Package | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.get<Package>(`packages/${slug}`).subscribe({
      next: (p) => { this.pkg.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  discountedPrice(): number {
    const p = this.pkg()!;
    return p.price * (1 - p.discountPct / 100);
  }

  savings(): number {
    return this.pkg()!.price - this.discountedPrice();
  }
}
