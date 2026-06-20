import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-white dark:bg-dark px-4">
      <div class="text-center">
        <h1 class="font-display text-9xl font-bold text-primary/10 select-none">404</h1>
        <div class="-mt-10">
          <span class="material-icons text-6xl text-primary/30 block mb-4">search_off</span>
          <h2 class="font-display text-3xl font-bold text-dark dark:text-white mb-3">Page Not Found</h2>
          <p class="text-gray-500 dark:text-white/50 text-lg mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a routerLink="/" class="btn-primary inline-flex items-center gap-2">
              <span class="material-icons">home</span> Back to Home
            </a>
            <a routerLink="/contact" class="btn-outline inline-flex items-center gap-2">
              <span class="material-icons">support_agent</span> Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
