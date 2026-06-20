import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen flex">
      <!-- Left — Branding -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden"
           style="background: linear-gradient(135deg, #8B1538 0%, #2B2B2B 100%);">
        <!-- Decorative circles -->
        <div class="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-secondary/10"></div>
        <div class="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5"></div>

        <div class="relative z-10 flex flex-col justify-center px-16">
          <a routerLink="/" class="flex items-center gap-3 mb-12">
            <div class="w-14 h-14 rounded-2xl bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              <span class="text-secondary font-display font-bold text-3xl">P</span>
            </div>
            <div>
              <h1 class="text-white font-display font-bold text-3xl">PrideHub</h1>
              <p class="text-white/60 text-sm">Event Management Platform</p>
            </div>
          </a>

          <h2 class="text-white font-display text-4xl font-bold leading-tight mb-6">
            Where Every<br>
            <span class="text-secondary">Celebration</span><br>
            Comes to Life
          </h2>
          <p class="text-white/70 text-lg leading-relaxed mb-10">
            Plan weddings, corporate events, birthdays and more with Ethiopia's most trusted event management platform.
          </p>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4">
            @for (stat of stats; track stat.label) {
              <div class="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
                <p class="text-secondary font-bold text-2xl">{{ stat.value }}</p>
                <p class="text-white/70 text-xs mt-1">{{ stat.label }}</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Right — Form -->
      <div class="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-dark">
        <div class="w-full max-w-md">
          <!-- Mobile logo -->
          <a routerLink="/" class="flex items-center gap-2 mb-8 lg:hidden">
            <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span class="text-secondary font-bold text-lg">P</span>
            </div>
            <span class="font-display font-bold text-xl text-primary">PrideHub</span>
          </a>

          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {
  stats = [
    { value: '500+', label: 'Events Planned' },
    { value: '200+', label: 'Happy Clients' },
    { value: '100+', label: 'Expert Vendors' },
  ];
}
