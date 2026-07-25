import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface SystemSettingItem {
  key: string;
  value: unknown;
  group?: string;
  description?: string;
  isPublic?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SystemSettingsService {
  private readonly api = inject(ApiService);

  readonly logo = signal<string>('assets/images/prideHub logo.png');
  readonly siteName = signal<string>('PrideHub');
  readonly tagline = signal<string>('Where Every Celebration Comes to Life');
  readonly contactEmail = signal<string>('info@pridehub.com');
  readonly contactPhone = signal<string>('+251 911 234 567');
  readonly contactAddress = signal<string>('Bole Road, Addis Ababa, Ethiopia');
  readonly officeHours = signal<string>('Mon–Sat, 8am–6pm');
  readonly loaded = signal<boolean>(false);

  constructor() {
    this.loadPublicSettings();
  }

  loadPublicSettings(): void {
    this.api.get<SystemSettingItem[]>('settings/public').subscribe({
      next: (settings) => {
        if (Array.isArray(settings)) {
          settings.forEach((s) => {
            const val = typeof s.value === 'string' ? s.value : String(s.value ?? '');
            if (s.key === 'system.logo' && val) this.logo.set(val);
            if (s.key === 'system.name' && val) this.siteName.set(val);
            if (s.key === 'system.tagline' && val) this.tagline.set(val);
            if (s.key === 'contact.email' && val) this.contactEmail.set(val);
            if (s.key === 'contact.phone' && val) this.contactPhone.set(val);
            if (s.key === 'contact.address' && val) this.contactAddress.set(val);
            if (s.key === 'contact.officeHours' && val) this.officeHours.set(val);
          });
        }
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }
}
