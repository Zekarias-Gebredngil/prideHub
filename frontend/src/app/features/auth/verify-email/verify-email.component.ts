import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="text-center">
      @if (loading()) {
        <span class="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin block mx-auto mb-4"></span>
        <p class="text-gray-600 dark:text-white/60">Verifying your email...</p>
      } @else if (success()) {
        <span class="material-icons text-6xl text-green-500 block mb-4">verified</span>
        <h2 class="font-display text-2xl font-bold text-dark dark:text-white mb-2">Email Verified!</h2>
        <p class="text-gray-500 mb-6">Your account is now active. You can sign in.</p>
        <a routerLink="/auth/login" class="btn-primary inline-flex items-center gap-2">
          Sign In Now <span class="material-icons">login</span>
        </a>
      } @else {
        <span class="material-icons text-6xl text-red-400 block mb-4">error</span>
        <h2 class="font-display text-2xl font-bold text-dark dark:text-white mb-2">Verification Failed</h2>
        <p class="text-gray-500 mb-6">{{ error() }}</p>
        <a routerLink="/auth/login" class="text-primary font-semibold hover:underline">Back to Sign In</a>
      }
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly success = signal(false);
  readonly error = signal('');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!token) { this.loading.set(false); this.error.set('No verification token found.'); return; }

    this.auth.verifyEmail(token).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Invalid or expired token'); },
    });
  }
}
