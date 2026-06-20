import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="bg-dark text-white pt-16 pb-8">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Top Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          <!-- Brand -->
          <div class="lg:col-span-1">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
                <span class="text-secondary font-display font-bold text-xl">P</span>
              </div>
              <div>
                <h3 class="font-display font-bold text-xl text-white">PrideHub</h3>
                <p class="text-xs text-white/50">Where Every Celebration Comes to Life</p>
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
            <div class="flex gap-2">
              <input type="email" placeholder="Your email"
                     class="flex-1 px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:border-secondary">
              <button class="px-4 py-2.5 rounded-xl bg-secondary text-dark font-semibold text-sm hover:bg-secondary/90 transition-colors">
                <span class="material-icons text-sm">send</span>
              </button>
            </div>

            <!-- Contact -->
            <div class="mt-6 space-y-2">
              @for (contact of contacts; track contact.value) {
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
            &copy; {{ currentYear }} PrideHub. All rights reserved. Built with ❤️ in Ethiopia.
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
export class FooterComponent {
  currentYear = new Date().getFullYear();

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

  contacts = [
    { icon: 'location_on', value: 'Bole Road, Addis Ababa, Ethiopia' },
    { icon: 'phone', value: '+251 911 234 567' },
    { icon: 'email', value: 'info@pridehub.com' },
  ];
}
