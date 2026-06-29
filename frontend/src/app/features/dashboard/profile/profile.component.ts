import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <h1 class="font-display text-2xl font-bold text-dark dark:text-white mb-6">My Profile</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Avatar + Info Card -->
        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm text-center">
          <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span class="font-display font-bold text-3xl text-primary">
              {{ auth.currentUser()?.firstName?.[0] }}{{ auth.currentUser()?.lastName?.[0] }}
            </span>
          </div>
          <h2 class="font-semibold text-dark dark:text-white text-lg">{{ auth.currentUser()?.fullName }}</h2>
          <p class="text-gray-400 text-sm">{{ auth.currentUser()?.email }}</p>
          <span class="inline-block mt-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-semibold">
            {{ auth.currentUser()?.role }}
          </span>
          <div class="mt-4 pt-4 border-t border-gray-50 dark:border-white/10 text-sm space-y-2">
            <div class="flex items-center justify-between text-gray-500 dark:text-white/50">
              <span>Email verified</span>
              <span class="material-icons text-base" [class]="auth.currentUser()?.isEmailVerified ? 'text-green-500' : 'text-red-400'">
                {{ auth.currentUser()?.isEmailVerified ? 'check_circle' : 'cancel' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-gray-500 dark:text-white/50">
              <span>Member since</span>
              <span class="text-dark dark:text-white font-medium">{{ auth.currentUser()?.createdAt | date:'MMM y' }}</span>
            </div>
          </div>
        </div>

        <!-- Edit Forms -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Basic Profile Form -->
          <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
            <h2 class="font-semibold text-dark dark:text-white mb-5">Edit Profile</h2>

            @if (saved()) {
              <div class="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm mb-5">
                <span class="material-icons text-green-500">check_circle</span>
                Profile updated successfully!
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">First Name</label>
                  <input type="text" formControlName="firstName"
                         class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Last Name</label>
                  <input type="text" formControlName="lastName"
                         class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Email</label>
                <input type="email" formControlName="email"
                       class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Phone</label>
                <input type="tel" formControlName="phone"
                       class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
              </div>
              <button type="submit" [disabled]="form.invalid || saving()"
                      class="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-900 disabled:opacity-50 flex items-center gap-2 transition-colors">
                @if (saving()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                } @else {
                  <span class="material-icons text-base">save</span>
                }
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </form>
          </div>

          <!-- Vendor Business Profile Form (Only for Vendors) -->
          @if (auth.currentUser()?.role === 'VENDOR') {
            <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
              <h2 class="font-semibold text-dark dark:text-white mb-5">Vendor Business Profile</h2>

              @if (vendorSaved()) {
                <div class="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm mb-5">
                  <span class="material-icons text-green-500">check_circle</span>
                  Business profile updated successfully!
                </div>
              }

              <form *ngIf="vendorForm" [formGroup]="vendorForm" (ngSubmit)="saveVendorProfile()" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Business Name</label>
                    <input type="text" formControlName="businessName"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Category</label>
                    <select formControlName="categoryId"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                      <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
                    </select>
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Short Bio</label>
                    <textarea formControlName="bio" rows="2"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors"></textarea>
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Full Description</label>
                    <textarea formControlName="description" rows="4"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors"></textarea>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Address</label>
                    <input type="text" formControlName="address"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">City</label>
                    <input type="text" formControlName="city"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Website</label>
                    <input type="url" formControlName="website" placeholder="https://"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Instagram Handle</label>
                    <input type="text" formControlName="instagram"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Facebook</label>
                    <input type="text" formControlName="facebook"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">TikTok</label>
                    <input type="text" formControlName="tiktok"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Base Price</label>
                    <input type="number" formControlName="basePrice"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Price Unit</label>
                    <input type="text" formControlName="priceUnit" placeholder="e.g. per day, per event"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>
                  
                  <!-- File Uploads -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Business Logo</label>
                    <input type="file" accept="image/*" (change)="uploadFile($event, 'logo')"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                    <img *ngIf="vendorForm.get('logo')?.value" [src]="vendorForm.get('logo')?.value" class="mt-2 w-16 h-16 object-cover rounded-lg border">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Cover Image</label>
                    <input type="file" accept="image/*" (change)="uploadFile($event, 'coverImage')"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                    <img *ngIf="vendorForm.get('coverImage')?.value" [src]="vendorForm.get('coverImage')?.value" class="mt-2 w-full h-24 object-cover rounded-lg border">
                  </div>

                </div>
                
                <button type="submit" [disabled]="vendorForm.invalid || vendorSaving() || uploading()"
                        class="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-900 disabled:opacity-50 flex items-center gap-2 transition-colors">
                  @if (vendorSaving() || uploading()) {
                    <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  } @else {
                    <span class="material-icons text-base">storefront</span>
                  }
                  {{ vendorSaving() ? 'Saving Profile...' : uploading() ? 'Uploading...' : 'Save Business Profile' }}
                </button>
              </form>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly saving = signal(false);
  readonly saved = signal(false);
  
  readonly vendorSaving = signal(false);
  readonly vendorSaved = signal(false);
  readonly uploading = signal(false);
  readonly categories = signal<any[]>([]);
  hasVendorProfile = true;

  form = this.fb.group({
    firstName: [this.auth.currentUser()?.firstName || '', Validators.required],
    lastName:  [this.auth.currentUser()?.lastName || '', Validators.required],
    email:     [this.auth.currentUser()?.email || '', [Validators.required, Validators.email]],
    phone:     [this.auth.currentUser()?.phone || ''],
  });

  vendorForm?: FormGroup;

  ngOnInit() {
    if (this.auth.currentUser()?.role === 'VENDOR') {
      this.loadVendorData();
    }
  }

  loadVendorData() {
    this.api.get<any>('vendors/categories').subscribe({
      next: (res) => this.categories.set(res.data)
    });

    this.api.get<any>('vendors/me').subscribe({
      next: (res) => {
        this.hasVendorProfile = true;
        const p = res.data;
        this.vendorForm = this.fb.group({
          businessName: [p.businessName || '', Validators.required],
          categoryId: [p.categoryId || '', Validators.required],
          description: [p.description || ''],
          bio: [p.bio || ''],
          address: [p.address || ''],
          city: [p.city || ''],
          website: [p.website || ''],
          instagram: [p.instagram || ''],
          facebook: [p.facebook || ''],
          tiktok: [p.tiktok || ''],
          basePrice: [p.basePrice || null],
          priceUnit: [p.priceUnit || ''],
          logo: [p.logo || ''],
          coverImage: [p.coverImage || '']
        });
      },
      error: (err) => {
        console.error('Error fetching vendor profile', err);
        // If 404, it means the vendor profile doesn't exist yet
        this.hasVendorProfile = false;
        this.vendorForm = this.fb.group({
          businessName: ['', Validators.required],
          categoryId: ['', Validators.required],
          description: [''],
          bio: [''],
          address: [''],
          city: [''],
          website: [''],
          instagram: [''],
          facebook: [''],
          tiktok: [''],
          basePrice: [null],
          priceUnit: [''],
          logo: [''],
          coverImage: ['']
        });
      }
    });
  }

  uploadFile(event: any, field: string) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploading.set(true);
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    
    // We use raw HttpClient here to avoid api service interceptors changing the Content-Type
    // which breaks FormData boundaries, though our ApiService might be fine.
    this.http.post<any>(`${environment.apiUrl}/upload/single`, formData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: (res) => {
        // Assume response is { success: true, data: { url: '...' } }
        const url = res.data?.url || res.data || res.url;
        this.vendorForm?.patchValue({ [field]: url });
        this.uploading.set(false);
      },
      error: (err) => {
        console.error('Upload failed', err);
        alert('Upload failed. Please try again.');
        this.uploading.set(false);
      }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.patch('users/me', this.form.value).subscribe({
      next: () => { this.saving.set(false); this.saved.set(true); this.auth.loadCurrentUser(); setTimeout(() => this.saved.set(false), 3000); },
      error: () => this.saving.set(false),
    });
  }

  saveVendorProfile(): void {
    if (!this.vendorForm || this.vendorForm.invalid) return;
    this.vendorSaving.set(true);
    
    const val = this.vendorForm.value;
    if (val.basePrice) val.basePrice = Number(val.basePrice);
    
    const request$ = this.hasVendorProfile 
      ? this.api.patch('vendors/me', val)
      : this.api.post('vendors/profile', val);

    request$.subscribe({
      next: () => { 
        this.hasVendorProfile = true;
        this.vendorSaving.set(false); 
        this.vendorSaved.set(true); 
        setTimeout(() => this.vendorSaved.set(false), 3000); 
      },
      error: () => this.vendorSaving.set(false)
    });
  }
}
