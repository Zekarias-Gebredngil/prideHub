import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <footer class="bg-dark text-white pt-16 pb-8">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Top Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          <!-- Brand -->
          <div class="lg:col-span-1">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                <img [src]="systemSettings.logo()" [alt]="systemSettings.siteName()" class="w-10 h-10 object-contain">
              </div>
              <div>
                <span class="font-display font-bold text-xl block leading-tight text-white">{{ systemSettings.siteName() }}</span>
                <p class="text-xs text-white/50">{{ systemSettings.tagline() }}</p>
              </div>
            </div>
            <p class="text-white/60 text-sm leading-relaxed mb-5">
              Ethiopia's premier event management platform, connecting clients with top vendors and venues for unforgettable celebrations.
            </p>
            <div class="flex gap-3">
              @for (social of socials; track social.name) {
                <a [href]="social.url" target="_blank" rel="noopener"
                   class="w-9 h-9 rounded-xl bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                  <span class="material-icons text-sm">{{ social.icon }}</span>
                </a>
              }
            </div>
          </div>

          <!-- Services -->
          <div>
            <h4 class="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Services</h4>
            <ul class="space-y-2.5">
              @for (link of serviceLinks; track link.label) {
                <li>
                  <a [routerLink]="link.path" class="text-white/60 hover:text-secondary text-sm transition-colors">
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h4 class="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul class="space-y-2.5">
              @for (link of companyLinks; track link.label) {
                <li>
                  <a [routerLink]="link.path" class="text-white/60 hover:text-secondary text-sm transition-colors">
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Newsletter -->
          <div>
            <h4 class="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Stay Updated</h4>
            <p class="text-white/60 text-sm mb-4">Subscribe for event tips, trends, and exclusive offers.</p>
            <form [formGroup]="newsletterForm" (ngSubmit)="subscribe()" class="flex gap-2">
              <input type="email" formControlName="email" placeholder="Your email"
                     class="flex-1 px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:border-secondary">
              <button type="submit" [disabled]="newsletterForm.invalid || newsletterLoading()"
                      class="px-4 py-2.5 rounded-xl bg-secondary text-dark font-semibold text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50">
                @if (newsletterLoading()) {
                  <span class="w-4 h-4 border-2 border-dark/20 border-t-dark rounded-full animate-spin block"></span>
                } @else {
                  <span class="material-icons text-sm">send</span>
                }
              </button>
            </form>
            @if (newsletterMessage()) {
              <p class="text-xs mt-2" [class]="newsletterSuccess() ? 'text-green-300' : 'text-red-300'">
                {{ newsletterMessage() }}
              </p>
            }

            <!-- Contact -->
            <div class="mt-6 space-y-2">
              @for (contact of contacts(); track contact.value) {
                <div class="flex items-center gap-2 text-white/60 text-sm">
                  <span class="material-icons text-secondary text-base">{{ contact.icon }}</span>
                  <span>{{ contact.value }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-white/40 text-sm text-center md:text-left">
            &copy; {{ currentYear }} PrideHub. All rights reserved. Powered by Nadi Tech PLC.
          </p>
          <div class="flex items-center gap-4">
            @for (link of legalLinks; track link.label) {
              <a [routerLink]="link.path" class="text-white/40 hover:text-secondary text-xs transition-colors">
                {{ link.label }}
              </a>
            }
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly systemSettings = inject(SystemSettingsService);

  currentYear = new Date().getFullYear();
  readonly newsletterLoading = signal(false);
  readonly newsletterSuccess = signal(false);
  readonly newsletterMessage = signal('');

  readonly newsletterForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  socials = [
    { name: 'Facebook', icon: 'facebook', url: '#' },
    { name: 'Instagram', icon: 'photo_camera', url: '#' },
    { name: 'Twitter', icon: 'alternate_email', url: '#' },
    { name: 'YouTube', icon: 'play_circle', url: '#' },
  ];

  serviceLinks = [
    { label: 'Wedding Planning', path: '/services' },
    { label: 'Corporate Events', path: '/services' },
    { label: 'Birthday Parties', path: '/services' },
    { label: 'Venue Booking', path: '/venues' },
    { label: 'Vendor Hire', path: '/vendors' },
    { label: 'Packages', path: '/packages' },
  ];

  companyLinks = [
    { label: 'About Us', path: '/about' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'Blog', path: '/blog' },
    { label: 'Testimonials', path: '/testimonials' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact', path: '/contact' },
  ];

  legalLinks = [
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Cookie Policy', path: '/privacy-policy' },
  ];

  contacts = signal([
    { id: 'address', icon: 'location_on', value: 'Bole Road, Addis Ababa, Ethiopia' },
    { id: 'phone', icon: 'phone', value: '+251 911 234 567' },
    { id: 'email', icon: 'email', value: 'info@pridehub.com' },
  ]);

  ngOnInit() {
    this.api.get<{ key: string, value: any }[]>('settings/public').subscribe({
      next: (settings) => {
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, any>);
        this.contacts.update(curr => curr.map(c => {
          if (c.id === 'address' && settingsMap['site.address']) return { ...c, value: settingsMap['site.address'] };
          if (c.id === 'phone' && settingsMap['site.phone']) return { ...c, value: settingsMap['site.phone'] };
          if (c.id === 'email' && settingsMap['site.email']) return { ...c, value: settingsMap['site.email'] };
          return c;
        }));
      }
    });
  }

  subscribe(): void {
    if (this.newsletterForm.invalid) return;
    this.newsletterLoading.set(true);
    this.newsletterMessage.set('');

    this.api.post('newsletter/subscribe', this.newsletterForm.getRawValue()).subscribe({
      next: () => {
        this.newsletterLoading.set(false);
        this.newsletterSuccess.set(true);
        this.newsletterMessage.set('Subscribed. We will send you event tips and offers.');
        this.newsletterForm.reset();
      },
      error: (err) => {
        this.newsletterLoading.set(false);
        this.newsletterSuccess.set(false);
        this.newsletterMessage.set(err?.error?.message || 'Subscription failed. Please try again.');
      },
    });
  }
}
