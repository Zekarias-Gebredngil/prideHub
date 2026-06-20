import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div>
      <h2 class="font-display text-3xl font-bold text-dark dark:text-white mb-2">Reset Password</h2>
      <p class="text-gray-500 dark:text-white/60 mb-8">Enter your email and we'll send a reset link</p>

      @if (sent()) {
        <div class="text-center p-6 rounded-2xl bg-green-50 border border-green-200">
          <span class="material-icons text-4xl text-green-500 block mb-3">mark_email_read</span>
          <p class="font-semibold text-green-800 mb-1">Reset link sent!</p>
          <p class="text-sm text-green-700">Check your email inbox for the password reset link.</p>
          <a routerLink="/auth/login" class="inline-block mt-4 text-primary text-sm font-semibold hover:underline">
            Back to Sign In
          </a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Email Address</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">email</span>
              <input type="email" formControlName="email" placeholder="you@example.com"
                     class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm dark:text-white focus:outline-none focus:border-primary transition-colors">
            </div>
          </div>
          <button type="submit" [disabled]="form.invalid || loading()"
                  class="w-full py-3.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            @if (loading()) {
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            } @else {
              <span class="material-icons">send</span>
            }
            {{ loading() ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>
        <p class="text-center text-sm text-gray-500 mt-6">
          <a routerLink="/auth/login" class="text-primary font-semibold hover:underline">← Back to Sign In</a>
        </p>
      }
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly sent = signal(false);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.forgotPassword(this.form.value.email!).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => { this.loading.set(false); this.sent.set(true); }, // Always show success for security
    });
  }
}
