import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';

export interface ServiceModel {
  id: string;
  name: string;
  categoryId: string;
  category?: { id: string; name: string };
  price: number;
  priceUnit?: string;
  shortDesc?: string;
  description?: string;
  coverImage?: string;
  isActive: boolean;
  isFeatured: boolean;
  metadata?: {
    whatMakesUsSpecial?: string;
    highlights?: string[];
    inclusions?: string[];
  };
}

@Component({
  selector: 'app-vendor-services',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploaderComponent],
  template: `
    <div class="space-y-6 p-4 sm:p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Services & Offerings</h1>
          <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Post your event services, set pricing, and showcase what makes your offerings special</p>
        </div>
        <button (click)="openCreateModal()"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-900 shadow-md transition-all">
          <span class="material-icons text-base">add_circle</span>
          Post New Service
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span class="material-icons text-2xl">room_service</span>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase font-semibold">Total Services</p>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ services().length }}</p>
          </div>
        </div>
        <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
            <span class="material-icons text-2xl">check_circle</span>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase font-semibold">Active Offerings</p>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ activeCount() }}</p>
          </div>
        </div>
        <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <span class="material-icons text-2xl">auto_awesome</span>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase font-semibold">Special Highlights</p>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ totalHighlightsCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Services Grid -->
      @if (loading()) {
        <div class="py-16 text-center text-gray-400">
          <span class="w-9 h-9 border-4 border-primary/30 border-t-primary rounded-full animate-spin inline-block mb-3"></span>
          <p>Loading your services...</p>
        </div>
      } @else if (services().length === 0) {
        <div class="bg-white dark:bg-white/5 rounded-2xl p-12 text-center border border-dashed border-gray-200 dark:border-white/10 max-w-lg mx-auto">
          <span class="material-icons text-5xl text-gray-300 dark:text-white/20 block mb-3">storefront</span>
          <h3 class="font-display font-bold text-lg text-dark dark:text-white mb-1">No services posted yet</h3>
          <p class="text-sm text-gray-500 dark:text-white/50 mb-6">Create your first service offering and highlight what makes your work special to attract clients.</p>
          <button (click)="openCreateModal()" class="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900">
            Post First Service
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (s of services(); track s.id) {
            <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <!-- Cover Image -->
                <div class="h-44 bg-gray-100 dark:bg-white/5 relative overflow-hidden">
                  @if (s.coverImage) {
                    <img [src]="s.coverImage" [alt]="s.name" class="w-full h-full object-cover">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 text-primary/40">
                      <span class="material-icons text-5xl">room_service</span>
                    </div>
                  }
                  <div class="absolute top-3 right-3 flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm"
                          [class]="s.isActive ? 'bg-green-500 text-white' : 'bg-gray-700 text-white'">
                      {{ s.isActive ? 'Active' : 'Draft' }}
                    </span>
                  </div>
                  @if (s.category?.name) {
                    <div class="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-dark/70 backdrop-blur-md text-white text-xs font-medium">
                      {{ s.category?.name }}
                    </div>
                  }
                </div>

                <!-- Body -->
                <div class="p-5 space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="font-bold text-dark dark:text-white text-lg leading-tight">{{ s.name }}</h3>
                  </div>

                  <div class="flex items-baseline gap-1 text-primary dark:text-secondary font-display font-bold text-xl">
                    <span>{{ s.price | number:'1.0-0' }}</span>
                    <span class="text-xs font-normal text-gray-500 dark:text-white/50">ETB {{ s.priceUnit ? '/ ' + s.priceUnit : '' }}</span>
                  </div>

                  @if (s.shortDesc) {
                    <p class="text-xs text-gray-500 dark:text-white/60 font-medium italic">{{ s.shortDesc }}</p>
                  }

                  <p class="text-xs text-gray-600 dark:text-white/70 line-clamp-2 leading-relaxed">
                    {{ s.description || 'No detailed description provided.' }}
                  </p>

                  <!-- What Makes Us Special Highlights -->
                  @if (s.metadata?.whatMakesUsSpecial || (s.metadata?.highlights?.length ?? 0) > 0) {
                    <div class="pt-2 border-t border-gray-100 dark:border-white/10 space-y-2">
                      <p class="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <span class="material-icons text-xs">auto_awesome</span> What Makes This Special
                      </p>
                      @if (s.metadata?.whatMakesUsSpecial) {
                        <p class="text-xs text-gray-700 dark:text-white/80 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-700/30">
                          "{{ s.metadata?.whatMakesUsSpecial }}"
                        </p>
                      }
                      @if (s.metadata?.highlights?.length) {
                        <div class="flex flex-wrap gap-1.5">
                          @for (h of s.metadata?.highlights; track h) {
                            <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary font-medium">
                              <span class="material-icons text-[10px]">check</span> {{ h }}
                            </span>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Footer Actions -->
              <div class="px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                <button (click)="toggleActive(s)" class="text-xs text-gray-500 dark:text-white/60 hover:text-primary flex items-center gap-1 font-medium">
                  <span class="material-icons text-sm">{{ s.isActive ? 'visibility_off' : 'visibility' }}</span>
                  {{ s.isActive ? 'Set to Draft' : 'Activate' }}
                </button>
                <div class="flex items-center gap-2">
                  <button (click)="openEditModal(s)" class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/80">
                    <span class="material-icons text-base">edit</span>
                  </button>
                  <button (click)="deleteService(s.id)" class="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                    <span class="material-icons text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create / Edit Modal Form -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-white dark:bg-dark rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4 shrink-0">
              <div>
                <h2 class="font-display font-bold text-xl text-dark dark:text-white">
                  {{ isEditing() ? 'Edit Service Offering' : 'Post New Service Offering' }}
                </h2>
                <p class="text-xs text-gray-400 mt-0.5">Fill out your service details and what makes your offering unique</p>
              </div>
              <button (click)="closeModal()" class="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400">
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Form Fields -->
            <div class="flex-1 overflow-y-auto space-y-4 pr-1">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Service Title *</span>
                  <input [(ngModel)]="form.name" type="text" placeholder="e.g. Premium Photography & Videography"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>

                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Service Category *</span>
                  <select [(ngModel)]="form.categoryId"
                          class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                    <option value="" disabled selected>Select Category</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </label>

                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Base Price (ETB) *</span>
                  <input [(ngModel)]="form.price" type="number" min="0" placeholder="15000"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>

                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Pricing Unit</span>
                  <input [(ngModel)]="form.priceUnit" type="text" placeholder="e.g. per event, per hour, per guest"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>

                <div class="md:col-span-2">
                  <app-image-uploader [(imageUrl)]="form.coverImage" label="Service Cover Image" hint="Upload service banner photo (PNG, JPG, WebP)" />
                </div>

                <label class="space-y-1 md:col-span-2">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Catchy Tagline / Pitch</span>
                  <input [(ngModel)]="form.shortDesc" type="text" placeholder="e.g. Award-winning wedding cinematography with 4K drone footage"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>

                <label class="space-y-1 md:col-span-2">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Full Description</span>
                  <textarea [(ngModel)]="form.description" rows="3" placeholder="Describe your service process, package options, and delivery timeline..."
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary resize-none"></textarea>
                </label>
              </div>

              <!-- WHAT MAKES THIS SPECIAL SECTION -->
              <div class="pt-4 border-t border-gray-100 dark:border-white/10 space-y-4">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-amber-500">auto_awesome</span>
                  <div>
                    <h3 class="font-semibold text-sm text-dark dark:text-white">What Makes Your Service Special?</h3>
                    <p class="text-xs text-gray-400">Tell clients what sets your service apart from competitors</p>
                  </div>
                </div>

                <label class="block space-y-1">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70">Unique Pitch / Special Feature Statement</span>
                  <textarea [(ngModel)]="form.whatMakesUsSpecial" rows="2"
                            placeholder="e.g. We provide backup equipment on-site, a dedicated event manager, and guaranteed 48-hour photo preview delivery!"
                            class="w-full px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/10 text-sm text-dark dark:text-white focus:outline-none focus:border-amber-500 resize-none"></textarea>
                </label>

                <div class="space-y-2">
                  <span class="text-xs font-medium text-gray-600 dark:text-white/70 block">Key Highlight Tags / Features Included</span>
                  <div class="flex gap-2">
                    <input [(ngModel)]="newHighlightTag" (keyup.enter)="addHighlightTag()" type="text"
                           placeholder="e.g. Free Consultation, Backup Generator, Custom Menu"
                           class="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                    <button (click)="addHighlightTag()" type="button" class="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold">
                      Add Highlight
                    </button>
                  </div>

                  <!-- Quick Popular Suggestions -->
                  <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    <span class="text-[11px] text-gray-400 mr-1">Quick add:</span>
                    @for (preset of quickPresets; track preset) {
                      <button type="button" (click)="addPresetHighlight(preset)"
                              class="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/80 hover:bg-primary/20 hover:text-primary transition-colors">
                        + {{ preset }}
                      </button>
                    }
                  </div>

                  <!-- Current Tags -->
                  @if (form.highlights.length) {
                    <div class="flex flex-wrap gap-2 pt-2">
                      @for (tag of form.highlights; track tag; let idx = $index) {
                        <span class="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary font-medium">
                          {{ tag }}
                          <button (click)="removeHighlightTag(idx)" type="button" class="hover:text-red-500">
                            <span class="material-icons text-xs">close</span>
                          </button>
                        </span>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/10 shrink-0">
              <button (click)="closeModal()" class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-white/70">Cancel</button>
              <button (click)="saveService()" [disabled]="saving() || !form.name.trim() || !form.categoryId"
                      class="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 disabled:opacity-50 transition-colors">
                {{ saving() ? 'Saving...' : 'Save Service' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class VendorServicesComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly services = signal<ServiceModel[]>([]);
  readonly categories = signal<any[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showModal = signal(false);
  readonly isEditing = signal(false);

  newHighlightTag = '';

  quickPresets = [
    'Free Consultation',
    'Premium Equipment Included',
    'On-Site Coordinator',
    'Customizable Package',
    '24/7 Backup Power',
    'Eco-Friendly Setup',
    'Setup & Cleanup Included',
  ];

  form = {
    id: '',
    name: '',
    categoryId: '',
    price: 0,
    priceUnit: 'per event',
    shortDesc: '',
    description: '',
    coverImage: '',
    whatMakesUsSpecial: '',
    highlights: [] as string[],
  };

  ngOnInit() {
    this.loadCategories();
    this.loadServices();
  }

  loadCategories() {
    this.api.get<any>('services/categories').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : res.data || [];
        this.categories.set(list);
      },
    });
  }

  loadServices() {
    this.loading.set(true);
    this.api.get<any>('services/mine').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : res.data || [];
        this.services.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  activeCount(): number {
    return this.services().filter((s) => s.isActive).length;
  }

  totalHighlightsCount(): number {
    return this.services().reduce((sum, s) => sum + (s.metadata?.highlights?.length || 0), 0);
  }

  openCreateModal() {
    this.form = {
      id: '',
      name: '',
      categoryId: this.categories()[0]?.id || '',
      price: 5000,
      priceUnit: 'per event',
      shortDesc: '',
      description: '',
      coverImage: '',
      whatMakesUsSpecial: '',
      highlights: [],
    };
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  openEditModal(s: ServiceModel) {
    this.form = {
      id: s.id,
      name: s.name,
      categoryId: s.categoryId,
      price: s.price,
      priceUnit: s.priceUnit || 'per event',
      shortDesc: s.shortDesc || '',
      description: s.description || '',
      coverImage: s.coverImage || '',
      whatMakesUsSpecial: s.metadata?.whatMakesUsSpecial || '',
      highlights: s.metadata?.highlights ? [...s.metadata.highlights] : [],
    };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  addHighlightTag() {
    const val = this.newHighlightTag.trim();
    if (val && !this.form.highlights.includes(val)) {
      this.form.highlights.push(val);
      this.newHighlightTag = '';
    }
  }

  addPresetHighlight(preset: string) {
    if (!this.form.highlights.includes(preset)) {
      this.form.highlights.push(preset);
    }
  }

  removeHighlightTag(idx: number) {
    this.form.highlights.splice(idx, 1);
  }

  saveService() {
    if (!this.form.name.trim() || !this.form.categoryId) return;
    this.saving.set(true);

    const payload: any = {
      name: this.form.name.trim(),
      categoryId: this.form.categoryId,
      price: Number(this.form.price),
      priceUnit: this.form.priceUnit,
      shortDesc: this.form.shortDesc || undefined,
      description: this.form.description || undefined,
      coverImage: this.form.coverImage || undefined,
      metadata: {
        whatMakesUsSpecial: this.form.whatMakesUsSpecial || '',
        highlights: this.form.highlights || [],
      },
    };

    if (this.isEditing()) {
      this.api.patch(`services/${this.form.id}`, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadServices();
        },
        error: (err) => {
          this.saving.set(false);
          alert('Could not update service: ' + (err.error?.message || err.message));
        },
      });
    } else {
      this.api.post('services', payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadServices();
        },
        error: (err) => {
          this.saving.set(false);
          alert('Could not create service: ' + (err.error?.message || err.message));
        },
      });
    }
  }

  toggleActive(s: ServiceModel) {
    this.api.patch(`services/${s.id}`, { isActive: !s.isActive }).subscribe({
      next: () => this.loadServices(),
      error: (err) => alert('Could not update status: ' + (err.error?.message || err.message)),
    });
  }

  deleteService(id: string) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    this.api.delete(`services/${id}`).subscribe({
      next: () => this.loadServices(),
      error: (err) => alert('Could not delete service: ' + (err.error?.message || err.message)),
    });
  }
}
