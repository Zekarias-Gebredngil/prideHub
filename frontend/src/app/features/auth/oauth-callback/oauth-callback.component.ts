import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center gap-3 p-8 min-h-screen">
      @if (error()) {
        <div class="text-center space-y-4">
          <span class="material-icons text-4xl text-red-500">error_outline</span>
          <p class="text-gray-600 dark:text-white/60">{{ error() }}</p>
          <a href="/auth/login" class="text-primary underline text-sm">Back to login</a>
        </div>
      } @else {
        <span class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
        <span class="text-gray-600 dark:text-white/60">Completing sign in...</span>
      }
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly error = (() => {
    let _error = '';
    return () => _error;
  })();

  private _error = '';

  ngOnInit(): void {
    // New OAuth flow: backend redirects to /auth/oauth-success?accessToken=...
    // The refresh token is already set as an HttpOnly cookie by the backend redirect
    const accessToken = this.route.snapshot.queryParamMap.get('accessToken');
    const failed = this.route.snapshot.queryParamMap.get('error');

    if (failed) {
      this._error = 'OAuth sign in failed. Please try again.';
      setTimeout(() => this.router.navigate(['/auth/login']), 2500);
      return;
    }

    if (accessToken) {
      localStorage.setItem('ph_access_token', accessToken);
      // Fetch the user profile then navigate to their dashboard
      this.authService.loadCurrentUser();
      // Give loadCurrentUser a moment then navigate
      setTimeout(() => {
        const user = this.authService.currentUser();
        this.router.navigate([this.authService.dashboardUrlFor(user ?? undefined)]);
      }, 800);
    } else {
      // Legacy fallback: try to refresh using the cookie that was just set
      this.authService.refreshTokens().subscribe({
        next: () => {
          this.authService.loadCurrentUser();
          setTimeout(() => {
            const user = this.authService.currentUser();
            this.router.navigate([this.authService.dashboardUrlFor(user ?? undefined)]);
          }, 500);
        },
        error: () => this.router.navigate(['/auth/login']),
      });
    }
  }
}
