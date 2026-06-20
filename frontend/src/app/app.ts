import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    this.translate.addLangs(['en', 'am']);
    this.translate.setDefaultLang('en');

    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('ph_lang') || 'en';
      this.translate.use(savedLang);

      // Restore dark mode
      if (localStorage.getItem('ph_theme') === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && this.authService.getAccessToken()) {
      this.authService.loadCurrentUser();
    }
  }
}
