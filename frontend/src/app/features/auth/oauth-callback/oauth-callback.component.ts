import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center gap-3 p-8">
      <span class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      <span class="text-gray-600 dark:text-white/60">Completing sign in...</span>
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const accessToken = this.route.snapshot.queryParamMap.get('accessToken');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('ph_access_token', accessToken);
      localStorage.setItem('ph_refresh_token', refreshToken);
      this.authService.loadCurrentUser();
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
