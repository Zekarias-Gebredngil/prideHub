import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <h1 class="font-display text-2xl font-bold text-dark dark:text-white mb-6">Settings</h1>

      <div class="space-y-5">

        <!-- Appearance -->
        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
          <h2 class="font-semibold text-dark dark:text-white mb-4">Appearance</h2>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-dark dark:text-white">Dark Mode</p>
              <p class="text-xs text-gray-400">Switch between light and dark theme</p>
            </div>
            <button (click)="toggleDark()"
                    class="relative w-12 h-6 rounded-full transition-colors duration-300"
                    [class]="isDark() ? 'bg-primary' : 'bg-gray-200'">
              <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300"
                    [class.translate-x-6]="isDark()"></span>
            </button>
          </div>
        </div>

        <!-- Language -->
        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
          <h2 class="font-semibold text-dark dark:text-white mb-4">Language</h2>
          <div class="flex gap-3">
            @for (lang of languages; track lang.code) {
              <button (click)="setLang(lang.code)"
                      class="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all"
                      [class]="currentLang() === lang.code
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-gray-300'">
                <span>{{ lang.flag }}</span> {{ lang.name }}
              </button>
            }
          </div>
        </div>

        <!-- Notifications -->
        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
          <h2 class="font-semibold text-dark dark:text-white mb-4">Notification Preferences</h2>
          <div class="space-y-4">
            @for (pref of notifPrefs; track pref.label) {
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-dark dark:text-white">{{ pref.label }}</p>
                  <p class="text-xs text-gray-400">{{ pref.desc }}</p>
                </div>
                <button (click)="pref.enabled = !pref.enabled"
                        class="relative w-10 h-5 rounded-full transition-colors duration-200"
                        [class]="pref.enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-white/20'">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                        [class.translate-x-5]="pref.enabled"></span>
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Account Actions -->
        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
          <h2 class="font-semibold text-dark dark:text-white mb-4">Account</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
              <div>
                <p class="text-sm font-medium text-red-700 dark:text-red-400">Sign Out</p>
                <p class="text-xs text-red-500">Sign out of your PrideHub account</p>
              </div>
              <button (click)="auth.logout()"
                      class="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly isDark = signal(document.documentElement.classList.contains('dark'));
  readonly currentLang = signal(localStorage.getItem('ph_lang') || 'en');

  languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  ];

  notifPrefs = [
    { label: 'Email Notifications', desc: 'Receive booking updates via email', enabled: true },
    { label: 'SMS Notifications', desc: 'Receive SMS alerts for important updates', enabled: false },
    { label: 'In-App Notifications', desc: 'Show notifications inside the app', enabled: true },
    { label: 'Marketing Emails', desc: 'Receive news and promotions from PrideHub', enabled: false },
  ];

  toggleDark(): void {
    const html = document.documentElement;
    const dark = html.classList.toggle('dark');
    this.isDark.set(dark);
    localStorage.setItem('ph_theme', dark ? 'dark' : 'light');
  }

  setLang(code: string): void {
    this.currentLang.set(code);
    localStorage.setItem('ph_lang', code);
  }
}
