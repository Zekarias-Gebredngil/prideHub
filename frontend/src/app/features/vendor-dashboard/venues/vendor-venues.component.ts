import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { Venue } from '../../../core/models/content.model';

@Component({
  selector: 'app-vendor-venues',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploaderComponent],
  template: `
    <div class="space-y-6 p-4 sm:p-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-bold text-dark dark:text-white">My Venue Properties</h1>
          <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Post, manage, and monitor rental earnings for your event venue spaces</p>
        </div>
        <button (click)="openCreateModal()"
                class="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-900 shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto">
          <span class="material-icons text-lg">add_location_alt</span> Post New Venue
        </button>
      </div>

      <!-- Stats Strip -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span class="material-icons text-2xl">location_city</span>
          </div>
          <div>
            <p class="text-xs text-gray-400 font-medium">Total Venues</p>
            <p class="text-2xl font-bold text-dark dark:text-white">{{ venues().length }}</p>
          </div>
        </div>

        <div class="p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
            <span class="material-icons text-2xl">event_available</span>
          </div>
          <div>
            <p class="text-xs text-gray-400 font-medium">Active Listings</p>
            <p class="text-2xl font-bold text-dark dark:text-white">{{ activeCount() }}</p>
          </div>
        </div>

        <div class="p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <span class="material-icons text-2xl">payments</span>
          </div>
          <div>
            <p class="text-xs text-gray-400 font-medium">Rental Settlements</p>
            <p class="text-2xl font-bold text-dark dark:text-white">{{ totalRentalEst() | number }} ETB</p>
          </div>
        </div>
      </div>

      <!-- Venues Grid -->
      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1,2,3]; track i) {
            <div class="h-64 rounded-2xl bg-gray-200 dark:bg-white/5 animate-pulse"></div>
          }
        </div>
      } @else if (venues().length === 0) {
        <div class="text-center py-16 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
          <span class="material-icons text-5xl text-gray-300 dark:text-white/20 block mb-3">location_off</span>
          <p class="text-gray-500 dark:text-white/60 font-medium">No venue properties listed yet</p>
          <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">Post your first venue space to start receiving rental requests and earning revenue.</p>
          <button (click)="openCreateModal()" class="mt-4 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">
            Post Venue Space
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (v of venues(); track v.id) {
            <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              
              <!-- Image Banner -->
              <div class="relative h-44 bg-gray-100 dark:bg-white/5">
                @if (v.coverImage) {
                  <img [src]="resolvedUrl(v.coverImage)" [alt]="v.name" class="w-full h-full object-cover">
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-gray-400">
                    <span class="material-icons text-5xl">location_city</span>
                  </div>
                }
                <div class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-dark/90 backdrop-blur-xs text-xs font-semibold text-dark dark:text-white">
                  {{ v.city || 'Ethiopia' }}
                </div>
              </div>

              <!-- Content -->
              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 class="font-bold text-dark dark:text-white text-lg">{{ v.name }}</h3>
                  <p class="text-xs text-gray-500 dark:text-white/60 line-clamp-2 mt-1">{{ v.description || v.shortDesc || 'Premier event space' }}</p>
                  
                  <div class="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-white/60">
                    @if (v.capacity) {
                      <span class="flex items-center gap-1">
                        <span class="material-icons text-sm text-primary">people</span> {{ v.capacity }} guests
                      </span>
                    }
                    @if (v.pricePerDay) {
                      <span class="flex items-center gap-1 font-semibold text-primary">
                        <span class="material-icons text-sm">payments</span> {{ v.pricePerDay | number }} ETB / day
                      </span>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <button (click)="openEditModal(v)" class="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                    Edit Venue
                  </button>
                  <a [href]="'/venues/' + (v.slug || v.id)" target="_blank" class="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    View Public <span class="material-icons text-xs">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 bg-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white dark:bg-dark rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-white/10">
            
            <div class="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <div>
                <h2 class="font-bold text-dark dark:text-white text-lg">{{ editingId() ? 'Edit Venue Property' : 'Post New Venue Property' }}</h2>
                <p class="text-xs text-gray-400">Fill in details for your venue space</p>
              </div>
              <button (click)="closeModal()" class="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400">
                <span class="material-icons">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-5 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="space-y-1 md:col-span-2">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Venue Name *</span>
                  <input [(ngModel)]="form.name" type="text" placeholder="e.g. Skylight Grand Ballroom"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>

                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">City *</span>
                  <input [(ngModel)]="form.city" type="text" placeholder="e.g. Addis Ababa"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>

                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Price Per Day (ETB) *</span>
                  <input [(ngModel)]="form.pricePerDay" type="number" min="0" placeholder="45000"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>

                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Capacity (Max Guests)</span>
                  <input [(ngModel)]="form.capacity" type="number" min="0" placeholder="500"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>

                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Address / Location</span>
                  <input [(ngModel)]="form.address" type="text" placeholder="e.g. Bole Medhanialem, Street 45"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>

                <div class="md:col-span-2">
                  <app-image-uploader [(imageUrl)]="form.coverImage" label="Venue Cover Photo" hint="Upload primary venue photo (PNG, JPG, WebP)" />
                </div>

                <label class="space-y-1 md:col-span-2">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Full Description</span>
                  <textarea [(ngModel)]="form.description" rows="3" placeholder="Describe the layout, lighting, stage options, and catering facilities..."
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary resize-none"></textarea>
                </label>
              </div>
            </div>

            <div class="p-5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
              <button (click)="closeModal()" class="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm">Cancel</button>
              <button (click)="saveVenue()" [disabled]="saving() || !form.name || !form.pricePerDay"
                      class="px-6 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 disabled:opacity-50">
                {{ saving() ? 'Saving...' : 'Save Venue' }}
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export class VendorVenuesComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly venues = signal<Venue[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showModal = signal(false);
  readonly editingId = signal('');

  form = {
    name: '',
    city: '',
    address: '',
    capacity: null as number | null,
    pricePerDay: null as number | null,
    description: '',
    coverImage: '',
  };

  ngOnInit() {
    this.loadVenues();
  }

  loadVenues() {
    this.loading.set(true);
    this.api.get<any>('venues', { limit: 50 }).subscribe({
      next: (res) => {
        this.venues.set(res?.data || res || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  activeCount(): number {
    return this.venues().filter(v => v.isActive !== false).length;
  }

  totalRentalEst(): number {
    return this.venues().reduce((acc, v) => acc + (v.pricePerDay || 0), 0);
  }

  resolvedUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.api.baseUrl.replace('/api/v1', '')}${url}`;
  }

  openCreateModal() {
    this.editingId.set('');
    this.form = { name: '', city: '', address: '', capacity: null, pricePerDay: null, description: '', coverImage: '' };
    this.showModal.set(true);
  }

  openEditModal(v: Venue) {
    this.editingId.set(v.id);
    this.form = {
      name: v.name,
      city: v.city || '',
      address: v.address || '',
      capacity: v.capacity || null,
      pricePerDay: v.pricePerDay || null,
      description: v.description || '',
      coverImage: v.coverImage || '',
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveVenue() {
    if (!this.form.name || !this.form.pricePerDay) return;
    this.saving.set(true);

    const payload = {
      name: this.form.name,
      city: this.form.city,
      address: this.form.address,
      capacity: this.form.capacity ? Number(this.form.capacity) : undefined,
      pricePerDay: Number(this.form.pricePerDay),
      description: this.form.description,
      coverImage: this.form.coverImage,
    };

    const req = this.editingId()
      ? this.api.patch(`venues/${this.editingId()}`, payload)
      : this.api.post('venues', payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadVenues();
      },
      error: () => this.saving.set(false),
    });
  }
}
