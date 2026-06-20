import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div>
      <h2 class="font-display text-3xl font-bold text-dark dark:text-white mb-2">New Password</h2>
      <p class="text-gray-500 dark:text-white/60 mb-8">Enter your new password below</p>

      @if (success()) {
        <div class="text-center p-6 rounded-2xl bg-green-50 border border-green-200">
          <span class="material-icons text-4xl text-green-500 block mb-2">check_circle</span>
          <p class="font-semibold text-green-800 mb-3">Password reset successfully!</p>
          <a routerLink="/auth/login" class="btn-primary inline-flex items-center gap-2 text-sm">
            Sign In Now
          </a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">New Password</label>
            <input type="password" formControlName="newPassword" placeholder="Min. 8 characters"
                   class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm dark:text-white focus:outline-none focus:border-primary transition-colors">
            @if (form.get('newPassword')?.invalid && form.get('newPassword')?.touched) {
              <p class="text-xs text-red-500 mt-1">Min 8 chars with uppercase, number & special character</p>
            }
          </div>
          @if (error()) {
            <p class="text-sm text-red-500">{{ error() }}</p>
          }
          <button type="submit" [disabled]="form.invalid || loading()"
                  class="w-full py-3.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary-900 disabled:opacity-50 flex items-center justify-center gap-2">
            @if (loading()) {
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            }
            {{ loading() ? 'Saving...' : 'Reset Password' }}
          </button>
        </form>
      }
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  private token = '';
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal('');

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8),
                       Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)]],
  });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit() {
    if (this.form.invalid || !this.token) return;
    this.loading.set(true);
    this.auth.resetPassword(this.token, this.form.value.newPassword!).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Failed to reset password'); },
    });
  }
}
