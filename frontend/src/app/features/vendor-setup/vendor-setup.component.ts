import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ImageUploaderComponent } from '../../shared/components/image-uploader/image-uploader.component';

interface Category {
  id: string;
  name: string;
}

@Component({
  selector: 'app-vendor-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-dark py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="bg-white dark:bg-white/5 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden">
          
          <!-- Header -->
          <div class="px-8 py-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
            <h2 class="font-display text-2xl font-bold text-dark dark:text-white">Become a Vendor</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-white/60">
              Join PrideHub and start managing your event services, bookings, and clients all in one place.
            </p>
          </div>

          <!-- Error Alert -->
          @if (error()) {
            <div class="mx-8 mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <span class="material-icons text-red-500">error_outline</span>
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-8 space-y-8">
            
            <!-- Section 1: Basic Info -->
            <div class="space-y-6">
              <h3 class="text-lg font-semibold text-dark dark:text-white pb-2 border-b border-gray-100 dark:border-white/10">Basic Information</h3>
              
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- Business Name -->
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Business Name *</label>
                  <input type="text" formControlName="businessName" placeholder="e.g. Dream Events Co."
                         class="w-full px-4 py-3 rounded-xl border transition-colors text-sm
                                border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                                focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10"
                         [class.border-red-300]="form.get('businessName')?.invalid && form.get('businessName')?.touched">
                  @if (form.get('businessName')?.invalid && form.get('businessName')?.touched) {
                    <p class="text-red-500 text-xs mt-1">Business name is required</p>
                  }
                </div>

                <!-- Category -->
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Category *</label>
                  <select formControlName="categoryId"
                          class="w-full px-4 py-3 rounded-xl border transition-colors text-sm
                                 border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                                 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10"
                          [class.border-red-300]="form.get('categoryId')?.invalid && form.get('categoryId')?.touched">
                    <option value="" disabled selected>Select a category</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                  @if (form.get('categoryId')?.invalid && form.get('categoryId')?.touched) {
                    <p class="text-red-500 text-xs mt-1">Category is required</p>
                  }
                </div>

                <!-- Base Price -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Starting Price</label>
                  <input type="number" formControlName="basePrice" placeholder="0.00" min="0"
                         class="w-full px-4 py-3 rounded-xl border transition-colors text-sm
                                border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                                focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10">
                </div>

                <!-- Price Unit -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Price Unit</label>
                  <input type="text" formControlName="priceUnit" placeholder="e.g. per event, per hour"
                         class="w-full px-4 py-3 rounded-xl border transition-colors text-sm
                                border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                                focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10">
                </div>
              </div>
            </div>

            <!-- Section 2: Contact Details -->
            <div class="space-y-6">
              <h3 class="text-lg font-semibold text-dark dark:text-white pb-2 border-b border-gray-100 dark:border-white/10">Location & Contact</h3>
              
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Address</label>
                  <input type="text" formControlName="address" placeholder="123 Event Street"
                         class="w-full px-4 py-3 rounded-xl border transition-colors text-sm
                                border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                                focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">City</label>
                  <input type="text" formControlName="city" placeholder="Addis Ababa"
                         class="w-full px-4 py-3 rounded-xl border transition-colors text-sm
                                border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                                focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Website</label>
                  <input type="url" formControlName="website" placeholder="https://..."
                         class="w-full px-4 py-3 rounded-xl border transition-colors text-sm
                                border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                                focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10">
                </div>
              </div>
            </div>

            <!-- Section 3: Description -->
            <div class="space-y-6">
              <h3 class="text-lg font-semibold text-dark dark:text-white pb-2 border-b border-gray-100 dark:border-white/10">About Your Business</h3>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Short Bio</label>
                <textarea formControlName="bio" rows="2" placeholder="A quick summary of what you do..."
                          class="w-full px-4 py-3 rounded-xl border transition-colors text-sm resize-none
                                 border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                                 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10"></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Full Description</label>
                <textarea formControlName="description" rows="4" placeholder="Tell clients why they should choose you..."
                          class="w-full px-4 py-3 rounded-xl border transition-colors text-sm resize-none
                                 border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                                 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10"></textarea>
              </div>
            </div>

            <!-- Section 4: Media & Branding -->
            <div class="space-y-6">
              <h3 class="text-lg font-semibold text-dark dark:text-white pb-2 border-b border-gray-100 dark:border-white/10">Branding & Media</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <app-image-uploader [imageUrl]="form.get('logo')?.value || ''"
                                     (imageUrlChange)="form.get('logo')?.setValue($event)"
                                     label="Business Logo"
                                     hint="Upload brand logo file" />
                </div>
                <div>
                  <app-image-uploader [imageUrl]="form.get('coverImage')?.value || ''"
                                     (imageUrlChange)="form.get('coverImage')?.setValue($event)"
                                     label="Cover Image Banner"
                                     hint="Upload store banner photo" />
                </div>
              </div>
            </div>

            <!-- Submit Buttons -->
            <div class="pt-4 flex items-center justify-end gap-4 border-t border-gray-100 dark:border-white/10">
              <button type="button" (click)="cancel()"
                      class="px-6 py-3 rounded-xl font-medium text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button type="submit" [disabled]="form.invalid || loading()"
                      class="px-8 py-3 rounded-xl font-semibold text-white transition-all text-sm
                             bg-primary hover:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center gap-2 shadow-sm hover:-translate-y-0.5">
                @if (loading()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving...
                } @else {
                  <span class="material-icons text-[18px]">check_circle</span>
                  Create Profile
                }
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  `
})
export class VendorSetupComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  form = this.fb.group({
    businessName: ['', Validators.required],
    categoryId: ['', Validators.required],
    description: [''],
    bio: [''],
    address: [''],
    city: [''],
    website: [''],
    basePrice: [null],
    priceUnit: [''],
    logo: [''],
    coverImage: [''],
  });

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories() {
    this.apiService.get<Category[]>('vendors/categories').subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const payload = this.form.value;
    
    this.apiService.post('vendors/profile', payload).subscribe({
      next: () => {
        this.loading.set(false);
        // The vendor profile creation promotes the user to VENDOR role in the DB,
        // but the current JWT still carries role=CLIENT. We must refresh the token
        // so the new JWT includes role=VENDOR, then reload the user profile.
        this.auth.refreshTokens().subscribe({
          next: () => this.auth.loadCurrentUser(),
          error: () => {},  // if refresh fails we still navigate; guards will re-check
        });
        this.router.navigate(['/vendor-dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to create vendor profile. Please try again.');
      }
    });
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }
}
