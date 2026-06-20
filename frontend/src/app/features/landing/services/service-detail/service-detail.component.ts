import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { Service } from '../../../../core/models/content.model';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="min-h-screen flex items-center justify-center">
        <span class="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      </div>
    } @else if (service()) {
      <section class="pt-28 pb-16" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
        <div class="container mx-auto px-4">
          <nav class="text-white/60 text-sm mb-4 flex items-center gap-2">
            <a routerLink="/services" class="hover:text-white">Services</a>
            <span>›</span> <span class="text-white">{{ service()!.name }}</span>
          </nav>
          <div class="flex items-start gap-6">
            <div class="flex-1">
              @if (service()!.category) {
                <span class="inline-block px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-semibold mb-3">
                  {{ service()!.category!.name }}
                </span>
              }
              <h1 class="font-display text-4xl md:text-5xl font-bold text-white mb-4">{{ service()!.name }}</h1>
              <p class="text-white/70 text-lg max-w-2xl">{{ service()!.shortDesc }}</p>
              @if (service()!.price) {
                <p class="text-secondary font-bold text-2xl mt-4">From {{ service()!.price | number }} ETB</p>
              }
            </div>
          </div>
        </div>
      </section>

      <section class="section bg-white">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 class="font-display text-2xl font-bold text-dark mb-4">About This Service</h2>
                <p class="text-gray-600 leading-relaxed">{{ service()!.description }}</p>
                @if (service()!.duration) {
                  <div class="flex items-center gap-2 mt-4 text-sm text-gray-500">
                    <span class="material-icons text-primary text-base">schedule</span>
                    Duration: {{ service()!.duration }}
                  </div>
                }
              </div>

              @if ((service()!.media?.length ?? 0) > 0) {
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
                  <h2 class="font-semibold text-dark text-lg mb-4">Gallery</h2>
                  <div class="grid grid-cols-3 gap-3">
                    @for (m of service()!.media!; track m.id) {
                      <div class="aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img [src]="m.url" [alt]="m.title || service()!.name" class="w-full h-full object-cover">
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div>
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                @if (service()!.price) {
                  <p class="text-gray-400 text-sm mb-1">Starting price</p>
                  <p class="font-display font-bold text-3xl text-primary mb-4">
                    {{ service()!.price | number }} <span class="text-base font-normal text-gray-400">ETB</span>
                  </p>
                }
                <a routerLink="/book" [queryParams]="{ serviceId: service()!.id }"
                   class="block w-full text-center py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-900 transition-colors mb-3">
                  Book This Service
                </a>
                <a routerLink="/contact"
                   class="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:border-primary hover:text-primary transition-colors">
                  Ask a Question
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    }
  `,
})
export class ServiceDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly service = signal<Service | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.get<Service>(`services/${slug}`).subscribe({
      next: (s) => { this.service.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
