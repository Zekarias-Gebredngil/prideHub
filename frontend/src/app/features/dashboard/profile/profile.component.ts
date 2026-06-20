import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

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

        <!-- Edit Form -->
        <div class="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
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
      </div>
    </div>
  `,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly saved = signal(false);

  form = this.fb.group({
    firstName: [this.auth.currentUser()?.firstName || '', Validators.required],
    lastName:  [this.auth.currentUser()?.lastName || '', Validators.required],
    email:     [this.auth.currentUser()?.email || '', [Validators.required, Validators.email]],
    phone:     [this.auth.currentUser()?.phone || ''],
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.patch('users/me', this.form.value).subscribe({
      next: () => { this.saving.set(false); this.saved.set(true); this.auth.loadCurrentUser(); setTimeout(() => this.saved.set(false), 3000); },
      error: () => this.saving.set(false),
    });
  }
}
