import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { Service, Package, Venue, Testimonial, BlogPost } from '../../../core/models/content.model';
import { PaginatedResponse } from '../../../core/models/api.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent, StarRatingComponent],
  template: `
    <!-- ── Hero ─────────────────────────────────────────────────────────── -->
    <section class="relative min-h-screen flex items-center overflow-hidden"
             style="background: linear-gradient(135deg, #8B1538 0%, #2B2B2B 80%);">
      <!-- BG Pattern -->
      <div class="absolute inset-0 opacity-10"
           [style.backgroundImage]="heroBgPattern">
      </div>

      <!-- Decorative circles -->
      <div class="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-900/30 blur-3xl"></div>

      <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-16">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Text -->
          <div class="text-white animate-fade-in-up">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/20 border border-secondary/30 mb-6">
              <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span class="text-secondary text-sm font-medium">Ethiopia's #1 Event Platform</span>
            </div>

            <h1 class="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Where Every<br>
              <span class="text-secondary">Celebration</span><br>
              Comes to Life
            </h1>

            <p class="text-white/70 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              From intimate gatherings to grand weddings — plan, book, and experience unforgettable events with Ethiopia's most trusted platform.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 mb-12">
              <a routerLink="/book"
                 class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-secondary text-dark font-bold text-lg hover:bg-secondary/90 transition-all shadow-luxury hover:-translate-y-0.5">
                <span class="material-icons">celebration</span>
                Plan Your Event
              </a>
              <a routerLink="/packages"
                 class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition-all">
                <span class="material-icons">inventory_2</span>
                View Packages
              </a>
            </div>

            <!-- Trust badges -->
            <div class="flex flex-wrap gap-6">
              @for (badge of trustBadges; track badge.label) {
                <div class="flex items-center gap-2 text-white/70">
                  <span class="material-icons text-secondary text-lg">{{ badge.icon }}</span>
                  <span class="text-sm">{{ badge.label }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Stats Card -->
          <div class="grid grid-cols-2 gap-4 animate-fade-in-up" style="animation-delay:.2s">
            @for (stat of stats; track stat.label) {
              <div class="glass-card p-6 text-center hover:scale-105 transition-transform cursor-default">
                <div class="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-3">
                  <span class="material-icons text-secondary text-xl">{{ stat.icon }}</span>
                </div>
                <p class="font-display font-bold text-3xl text-white mb-1">{{ stat.value }}</p>
                <p class="text-white/60 text-sm">{{ stat.label }}</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Wave -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" fill="#ffffff">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"/>
        </svg>
      </div>
    </section>

    <!-- ── Featured Services ──────────────────────────────────────────────── -->
    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <span class="text-secondary text-sm font-semibold uppercase tracking-widest">What We Offer</span>
          <h2 class="font-display text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">Our Services</h2>
          <p class="text-gray-500 text-lg max-w-2xl mx-auto">From concept to completion, we handle every detail to make your event extraordinary.</p>
        </div>

        @if (servicesLoading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (i of [1,2,3,4,5,6]; track i) {
              <app-skeleton-loader type="card" />
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (service of services(); track service.id) {
              <a [routerLink]="['/services', service.slug]"
                 class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div class="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                  @if (service.coverImage) {
                    <img [src]="service.coverImage" [alt]="service.name"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <span class="material-icons text-6xl text-primary/20">celebration</span>
                    </div>
                  }
                  <div class="absolute top-3 left-3">
                    <span class="px-3 py-1 rounded-full bg-white/90 text-primary text-xs font-semibold shadow-sm">
                      {{ service.category?.name }}
                    </span>
                  </div>
                </div>
                <div class="p-5">
                  <h3 class="font-semibold text-dark text-lg mb-2 group-hover:text-primary transition-colors">{{ service.name }}</h3>
                  <p class="text-gray-500 text-sm line-clamp-2 mb-4">{{ service.shortDesc }}</p>
                  <div class="flex items-center justify-between">
                    <div>
                      @if (service.price) {
                        <p class="text-xs text-gray-400">Starting from</p>
                        <p class="font-bold text-primary">{{ service.price | number }} ETB</p>
                      }
                    </div>
                    <span class="w-9 h-9 rounded-xl bg-primary/5 group-hover:bg-primary flex items-center justify-center transition-colors">
                      <span class="material-icons text-primary group-hover:text-white text-lg transition-colors">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </a>
            }
          </div>
        }

        <div class="text-center mt-10">
          <a routerLink="/services" class="btn-outline inline-flex items-center gap-2">
            View All Services <span class="material-icons text-lg">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ── Featured Packages ──────────────────────────────────────────────── -->
    <section class="section" style="background: linear-gradient(to bottom, #F8F5F2, #fff);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <span class="text-secondary text-sm font-semibold uppercase tracking-widest">All-Inclusive</span>
          <h2 class="font-display text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">Our Packages</h2>
          <p class="text-gray-500 text-lg max-w-2xl mx-auto">Choose the perfect package for your celebration — every detail covered.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          @if (packagesLoading()) {
            @for (i of [1,2,3,4]; track i) {
              <app-skeleton-loader type="card" />
            }
          } @else {
            @for (pkg of packages(); track pkg.id) {
              <a [routerLink]="['/packages', pkg.slug]"
                 class="relative group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                @if (pkg.discountPct > 0) {
                  <div class="absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-xs font-bold"
                       style="background:#D4AF37;color:#2B2B2B">
                    {{ pkg.discountPct }}% OFF
                  </div>
                }
                <div class="h-3 w-full" [style.background]="pkg.color || '#8B1538'"></div>
                <div class="p-6">
                  <div class="mb-3">
                    <span class="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                          [style.background]="(pkg.color || '#8B1538') + '20'"
                          [style.color]="pkg.color || '#8B1538'">
                      {{ pkg.tier }}
                    </span>
                  </div>
                  <h3 class="font-display font-bold text-xl text-dark mb-2">{{ pkg.name }}</h3>
                  <p class="text-gray-500 text-sm line-clamp-2 mb-4">{{ pkg.shortDesc }}</p>

                  @if (pkg.items && pkg.items.length > 0) {
                    <ul class="space-y-1.5 mb-5">
                      @for (item of pkg.items.slice(0, 4); track item.id) {
                        <li class="flex items-center gap-2 text-sm text-gray-600">
                          <span class="material-icons text-secondary text-sm">check_circle</span>
                          {{ item.description }}
                        </li>
                      }
                      @if ((pkg.items?.length ?? 0) > 4) {
                        <li class="text-xs text-gray-400">+ {{ (pkg.items?.length ?? 0) - 4 }} more inclusions</li>
                      }
                    </ul>
                  }

                  <div class="border-t border-gray-100 pt-4">
                    <p class="text-xs text-gray-400 mb-1">Starting from</p>
                    <p class="font-display font-bold text-2xl text-primary">{{ pkg.price | number }} <span class="text-sm font-normal text-gray-500">ETB</span></p>
                  </div>

                  <button class="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                          [style.background]="pkg.color || '#8B1538'"
                          style="color:white">
                    Book This Package
                  </button>
                </div>
              </a>
            }
          }
        </div>

        <div class="text-center mt-10">
          <a routerLink="/packages" class="btn-primary inline-flex items-center gap-2">
            Compare All Packages <span class="material-icons text-lg">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ── Featured Venues ────────────────────────────────────────────────── -->
    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <span class="text-secondary text-sm font-semibold uppercase tracking-widest">Stunning Locations</span>
          <h2 class="font-display text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">Featured Venues</h2>
          <p class="text-gray-500 text-lg max-w-2xl mx-auto">Handpicked venues across Ethiopia for every occasion and budget.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @if (venuesLoading()) {
            @for (i of [1,2,3]; track i) { <app-skeleton-loader type="card" /> }
          } @else {
            @for (venue of venues(); track venue.id) {
              <a [routerLink]="['/venues', venue.slug]"
                 class="group relative rounded-2xl overflow-hidden h-72 shadow-sm hover:shadow-luxury transition-all duration-300 cursor-pointer">
                <div class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20">
                  @if (venue.coverImage) {
                    <img [src]="venue.coverImage" [alt]="venue.name"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <span class="material-icons text-7xl text-gray-300">location_city</span>
                    </div>
                  }
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-5">
                  <h3 class="text-white font-semibold text-lg mb-1">{{ venue.name }}</h3>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1 text-white/80 text-sm">
                      <span class="material-icons text-sm">location_on</span>
                      {{ venue.city }}
                    </div>
                    <div class="flex items-center gap-1">
                      <span class="material-icons text-secondary text-sm">star</span>
                      <span class="text-white text-sm font-medium">{{ venue.averageRating | number:'1.1-1' }}</span>
                    </div>
                  </div>
                  @if (venue.capacity) {
                    <div class="flex items-center gap-1 text-white/60 text-xs mt-1">
                      <span class="material-icons text-xs">people</span>
                      Up to {{ venue.capacity }} guests
                    </div>
                  }
                </div>
              </a>
            }
          }
        </div>

        <div class="text-center mt-10">
          <a routerLink="/venues" class="btn-outline inline-flex items-center gap-2">
            Explore All Venues <span class="material-icons text-lg">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ── Testimonials ───────────────────────────────────────────────────── -->
    <section class="section" style="background:linear-gradient(135deg,#8B1538 0%,#2B2B2B 100%);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <span class="text-secondary text-sm font-semibold uppercase tracking-widest">Happy Clients</span>
          <h2 class="font-display text-4xl md:text-5xl font-bold text-white mt-2 mb-4">What They Say</h2>
          <p class="text-white/60 text-lg max-w-2xl mx-auto">Real stories from real clients who trusted PrideHub with their most important celebrations.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (t of testimonials(); track t.id) {
            <div class="glass-card p-6">
              <div class="flex items-center gap-1 mb-4">
                @for (s of [1,2,3,4,5]; track s) {
                  <span class="material-icons text-secondary text-lg">{{ s <= t.rating ? 'star' : 'star_border' }}</span>
                }
              </div>
              <p class="text-white/80 text-sm leading-relaxed mb-6 italic">"{{ t.content }}"</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                  {{ t.clientName[0] }}
                </div>
                <div>
                  <p class="text-white font-semibold text-sm">{{ t.clientName }}</p>
                  <p class="text-white/50 text-xs">{{ t.clientTitle }} · {{ t.eventType }}</p>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="text-center mt-10">
          <a routerLink="/testimonials"
             class="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
            Read All Reviews <span class="material-icons">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ── Blog Preview ───────────────────────────────────────────────────── -->
    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <span class="text-secondary text-sm font-semibold uppercase tracking-widest">Insights & Tips</span>
          <h2 class="font-display text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">From Our Blog</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @if (blogsLoading()) {
            @for (i of [1,2,3]; track i) { <app-skeleton-loader type="card" /> }
          } @else {
            @for (post of blogs(); track post.id) {
              <a [routerLink]="['/blog', post.slug]"
                 class="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-luxury transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div class="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                  @if (post.coverImage) {
                    <img [src]="post.coverImage" [alt]="post.title"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  }
                </div>
                <div class="p-5">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-xs font-medium">
                      {{ post.category?.name }}
                    </span>
                    <span class="text-gray-400 text-xs">{{ post.readTime }} min read</span>
                  </div>
                  <h3 class="font-semibold text-dark text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {{ post.title }}
                  </h3>
                  <p class="text-gray-500 text-sm line-clamp-2">{{ post.excerpt }}</p>
                  <div class="flex items-center gap-2 mt-4 text-xs text-gray-400">
                    <span class="material-icons text-xs">person</span>
                    {{ post.author?.fullName }}
                    <span>·</span>
                    <span>{{ post.publishedAt | date:'MMM d, y' }}</span>
                  </div>
                </div>
              </a>
            }
          }
        </div>

        <div class="text-center mt-10">
          <a routerLink="/blog" class="btn-outline inline-flex items-center gap-2">
            View All Posts <span class="material-icons text-lg">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ── CTA ────────────────────────────────────────────────────────────── -->
    <section class="py-20 relative overflow-hidden bg-secondary">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 class="font-display text-4xl md:text-5xl font-bold text-dark mb-4">
          Ready to Plan Your Dream Event?
        </h2>
        <p class="text-dark/70 text-lg mb-8 max-w-2xl mx-auto">
          Join hundreds of happy clients who trusted PrideHub to make their celebrations unforgettable.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/book"
             class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-lg hover:bg-primary-900 transition-all shadow-lg hover:-translate-y-0.5">
            <span class="material-icons">celebration</span>
            Start Planning Now
          </a>
          <a routerLink="/contact"
             class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-dark/20 text-dark font-semibold text-lg hover:bg-dark/5 transition-all">
            <span class="material-icons">chat</span>
            Talk to an Expert
          </a>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly heroBgPattern = "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

  readonly services = signal<Service[]>([]);
  readonly packages = signal<Package[]>([]);
  readonly venues = signal<Venue[]>([]);
  readonly testimonials = signal<Testimonial[]>([]);
  readonly blogs = signal<BlogPost[]>([]);

  readonly servicesLoading = signal(true);
  readonly packagesLoading = signal(true);
  readonly venuesLoading = signal(true);
  readonly blogsLoading = signal(true);

  stats = [
    { value: '500+', label: 'Events Planned', icon: 'celebration' },
    { value: '200+', label: 'Happy Clients', icon: 'people' },
    { value: '100+', label: 'Expert Vendors', icon: 'store' },
    { value: '50+', label: 'Premium Venues', icon: 'location_city' },
  ];

  trustBadges = [
    { icon: 'verified', label: 'Verified Vendors' },
    { icon: 'security', label: 'Secure Payments' },
    { icon: 'support_agent', label: '24/7 Support' },
  ];

  ngOnInit(): void {
    this.api.get<Service[]>('services/featured').subscribe({
      next: (data) => { this.services.set(data); this.servicesLoading.set(false); },
      error: () => this.servicesLoading.set(false),
    });
    this.api.get<Package[]>('packages/featured').subscribe({
      next: (data) => { this.packages.set(data); this.packagesLoading.set(false); },
      error: () => this.packagesLoading.set(false),
    });
    this.api.get<Venue[]>('venues/featured').subscribe({
      next: (data) => { this.venues.set(data); this.venuesLoading.set(false); },
      error: () => this.venuesLoading.set(false),
    });
    this.api.get<Testimonial[]>('testimonials/featured').subscribe({
      next: (data) => this.testimonials.set(data),
    });
    this.api.getPaginated<BlogPost>('blog', { limit: 3 }).subscribe({
      next: (res) => { this.blogs.set(res.data); this.blogsLoading.set(false); },
      error: () => this.blogsLoading.set(false),
    });
  }
}
