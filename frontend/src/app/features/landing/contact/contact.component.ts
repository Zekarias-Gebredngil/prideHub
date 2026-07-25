import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="pt-32 pb-16" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <h1 class="font-display text-5xl font-bold text-white mb-4">Contact Us</h1>
        <p class="text-white/70 text-xl">We'd love to hear from you. Let's plan something amazing.</p>
      </div>
    </section>

    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">

          <!-- Form -->
          <div>
            <h2 class="font-display text-3xl font-bold text-dark mb-6">Send Us a Message</h2>

            @if (success()) {
              <div class="p-5 rounded-2xl bg-green-50 border border-green-200 text-center mb-6">
                <span class="material-icons text-3xl text-green-500 block mb-2">check_circle</span>
                <p class="font-semibold text-green-800">Message sent successfully!</p>
                <p class="text-sm text-green-700 mt-1">We'll get back to you within 24 hours.</p>
              </div>
            }
            @if (error()) {
              <div class="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
                {{ error() }}
              </div>
            }
            @if (!success()) {
              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" formControlName="name" placeholder="Your name"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm transition-colors">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" formControlName="phone" placeholder="+251..."
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm transition-colors">
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" formControlName="email" placeholder="you@example.com"
                         class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm transition-colors">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input type="text" formControlName="subject" placeholder="How can we help?"
                         class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm transition-colors">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea formControlName="message" rows="5" placeholder="Tell us about your event..."
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm transition-colors resize-none"></textarea>
                </div>
                <button type="submit" [disabled]="form.invalid || loading()"
                        class="w-full py-4 rounded-xl font-semibold text-white bg-primary hover:bg-primary-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  @if (loading()) {
                    <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  } @else {
                    <span class="material-icons">send</span>
                  }
                  {{ loading() ? 'Sending...' : 'Send Message' }}
                </button>
              </form>
            }
          </div>

          <!-- Info -->
          <div>
            <h2 class="font-display text-3xl font-bold text-dark mb-6">Get in Touch</h2>
            <div class="space-y-5">
              @for (info of contactInfo(); track info.label) {
                <div class="flex items-start gap-4 p-4 rounded-2xl bg-gray-50">
                  <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span class="material-icons text-primary">{{ info.icon }}</span>
                  </div>
                  <div>
                    <p class="font-semibold text-dark text-sm">{{ info.label }}</p>
                    <p class="text-gray-500 text-sm mt-0.5">{{ info.value }}</p>
                    @if (info.sub) { <p class="text-gray-400 text-xs">{{ info.sub }}</p> }
                  </div>
                </div>
              }
            </div>

            <div class="mt-8 p-5 rounded-2xl bg-gradient-to-br from-primary to-dark text-white">
              <h3 class="font-semibold text-lg mb-2">Need immediate help?</h3>
              <p class="text-white/70 text-sm mb-4">Our team is available 7 days a week for urgent event inquiries.</p>
              <a [href]="'tel:' + getPhoneNumber()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-dark font-semibold text-sm">
                <span class="material-icons text-sm">call</span> Call Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class ContactComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal('');

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(20)]],
  });
  contactInfo = signal([
    { icon: 'location_on', label: 'Office Address', key: 'site.address', value: 'Bole Road, Addis Ababa, Ethiopia', sub: 'Mon–Sat, 8am–6pm' },
    { icon: 'phone', label: 'Phone', key: 'site.phone', value: '+251 911 234 567', sub: 'Available 7 days a week' },
    { icon: 'email', label: 'Email', key: 'site.email', value: 'info@pridehub.com', sub: 'We reply within 24 hours' },
    { icon: 'language', label: 'Languages', key: 'site.languages', value: 'English, Amharic, Oromo', sub: undefined },
  ]);

  ngOnInit() {
    this.api.get<any[]>('settings/public').subscribe({
      next: (settings) => {
        const info = this.contactInfo();
        const updated = info.map(item => {
          const setting = settings.find(s => s.key === item.key);
          if (setting && setting.value) {
            return { ...item, value: setting.value as string };
          }
          return item;
        });
        
        // Check for custom office hours
        const officeHours = settings.find(s => s.key === 'contact.officeHours');
        if (officeHours) {
          updated[0].sub = officeHours.value as string;
        }
        
        this.contactInfo.set(updated);
      },
      error: () => {} // fallback to default
    });
  }
  getPhoneNumber(): string {
    const item = this.contactInfo().find(i => i.key === 'site.phone');
    return item ? item.value.replace(/\s+/g, '') : '+251911234567';
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.api.post('contact', this.form.value).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Message could not be sent. Please try again.');
      },
    });
  }
}
