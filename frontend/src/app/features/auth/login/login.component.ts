import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div>
      <h2 class="font-display text-3xl font-bold text-dark dark:text-white mb-2">Welcome Back</h2>
      <p class="text-gray-500 dark:text-white/60 mb-8">Sign in to your PrideHub account</p>

      <!-- Error Alert -->
      @if (error()) {
        <div class="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-6 text-sm">
          <span class="material-icons text-red-500">error_outline</span>
          {{ error() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Email Address</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">email</span>
            <input type="email" formControlName="email" placeholder="you@example.com"
                   class="w-full pl-11 pr-4 py-3 rounded-xl border transition-colors text-sm
                          border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                          focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10
                          placeholder:text-gray-400"
                   [class.border-red-300]="form.get('email')?.invalid && form.get('email')?.touched">
          </div>
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <p class="text-red-500 text-xs mt-1">Please enter a valid email</p>
          }
        </div>

        <!-- Password -->
        <div>
          <div class="flex justify-between mb-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-white/70">Password</label>
            <a routerLink="/auth/forgot-password" class="text-xs text-primary hover:underline">Forgot password?</a>
          </div>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">lock</span>
            <input [type]="showPass() ? 'text' : 'password'" formControlName="password" placeholder="••••••••"
                   class="w-full pl-11 pr-11 py-3 rounded-xl border transition-colors text-sm
                          border-gray-200 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white
                          focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-white/10">
            <button type="button" (click)="togglePass()"
                    class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <span class="material-icons text-lg">{{ showPass() ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button type="submit" [disabled]="form.invalid || loading()"
                class="w-full py-3.5 rounded-xl font-semibold text-white transition-all text-sm
                       bg-primary hover:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5">
          @if (loading()) {
            <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Signing in...
          } @else {
            <span class="material-icons text-lg">login</span>
            Sign In
          }
        </button>
      </form>

      <!-- Divider -->
      <div class="flex items-center gap-3 my-6">
        <div class="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
        <span class="text-xs text-gray-400">or continue with</span>
        <div class="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
      </div>

      <!-- OAuth -->
      <div class="grid grid-cols-2 gap-3">
        <a href="/api/v1/auth/google"
           class="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </a>
        <a href="/api/v1/auth/facebook"
           class="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </a>
      </div>

      <!-- Register link -->
      <p class="text-center text-sm text-gray-500 dark:text-white/50 mt-6">
        Don't have an account?
        <a routerLink="/auth/register" class="text-primary font-semibold hover:underline ml-1">Sign up free</a>
      </p>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly error = signal('');
  readonly loading = signal(false);
  readonly showPass = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  togglePass() { this.showPass.set(!this.showPass()); }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: (user) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || this.auth.dashboardUrlFor(user);
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Invalid email or password');
      },
    });
  }
}
