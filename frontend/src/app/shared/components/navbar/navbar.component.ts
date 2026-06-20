import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, tap, catchError, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

interface NavLink { label: string; path: string; children?: NavLink[]; }
interface SearchResult {
  type: 'service' | 'package' | 'venue' | 'vendor' | 'blog';
  id?: string;
  name?: string;
  title?: string;
  slug: string;
  city?: string;
  tier?: string;
}
interface SearchResponse { results: SearchResult[]; counts?: Record<string, number>; }

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
    <nav [class]="navClass()" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 md:h-20">

          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span class="text-secondary font-display font-bold text-lg">P</span>
            </div>
            <div class="hidden sm:block">
              <span class="font-display font-bold text-xl" [class]="logoTextClass()">PrideHub</span>
              <p class="text-xs opacity-60 leading-none" [class]="logoTaglineClass()">Where Every Celebration Comes to Life</p>
            </div>
          </a>

          <!-- Desktop Nav -->
          <div class="hidden lg:flex items-center gap-1">
            @for (link of navLinks; track link.label) {
              <a [routerLink]="link.path" routerLinkActive="text-secondary"
                 class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:text-secondary hover:bg-white/10"
                 [class]="navLinkClass()">
                {{ link.label }}
              </a>
            }
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <!-- Search -->
            <button (click)="toggleSearch()" class="p-2 rounded-lg hover:bg-white/10 transition-colors" [class]="iconClass()">
              <span class="material-icons text-xl">search</span>
            </button>

          <button (click)="toggleTheme()" class="p-2 rounded-lg hover:bg-white/10 transition-colors" [class]="iconClass()">
            <span class="material-icons text-xl">{{ isDark() ? 'light_mode' : 'dark_mode' }}</span>
          </button>

            @if (auth.isAuthenticated()) {
              @if (auth.isAdmin() || auth.isPlanner()) {
                <a routerLink="/admin"
                   class="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-dark text-sm font-semibold hover:bg-secondary/90 transition-colors">
                  <span class="material-icons text-base">admin_panel_settings</span>
                  Admin Panel
                </a>
              }
              <!-- Notifications -->
              <button routerLink="/dashboard/notifications" class="relative p-2 rounded-lg hover:bg-white/10 transition-colors" [class]="iconClass()">
                <span class="material-icons text-xl">notifications</span>
                <span class="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
              </button>
              <!-- Avatar -->
              <a [routerLink]="auth.dashboardUrlFor()" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                  {{ userInitial() }}
                </div>
                <span class="hidden md:block text-sm font-medium" [class]="navLinkClass()">{{ auth.currentUser()?.firstName }}</span>
              </a>
            } @else {
              <a routerLink="/auth/login"
                 class="hidden md:inline-flex px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                 [class]="loginBtnClass()">
                Sign In
              </a>
              <a routerLink="/auth/register"
                 class="inline-flex px-4 py-2 text-sm font-semibold rounded-xl bg-secondary text-dark hover:bg-secondary/90 transition-all shadow-sm">
                Get Started
              </a>
            }

            <!-- Mobile menu -->
            <button (click)="toggleMobile()" class="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors" [class]="iconClass()">
              <span class="material-icons">{{ mobileOpen() ? 'close' : 'menu' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      @if (mobileOpen()) {
        <div class="lg:hidden border-t border-white/10" [class]="mobileBgClass()">
          <div class="container mx-auto px-4 py-4 flex flex-col gap-1">
            @for (link of navLinks; track link.label) {
              <a [routerLink]="link.path" routerLinkActive="text-secondary bg-primary/5"
                 (click)="mobileOpen.set(false)"
                 class="px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
                 [class]="navLinkClass()">
                {{ link.label }}
              </a>
            }
            @if (!auth.isAuthenticated()) {
              <div class="flex gap-3 pt-2 border-t border-white/10 mt-2">
                <a routerLink="/auth/login" (click)="mobileOpen.set(false)"
                   class="flex-1 text-center py-2.5 rounded-xl border border-current text-sm font-medium"
                   [class]="navLinkClass()">Sign In</a>
                <a routerLink="/auth/register" (click)="mobileOpen.set(false)"
                   class="flex-1 text-center py-2.5 rounded-xl bg-secondary text-dark text-sm font-semibold">Get Started</a>
              </div>
            }
            @if (auth.isAuthenticated()) {
              <div class="flex gap-3 pt-2 border-t border-white/10 mt-2">
                <a [routerLink]="auth.dashboardUrlFor()" (click)="mobileOpen.set(false)"
                   class="flex-1 text-center py-2.5 rounded-xl bg-secondary text-dark text-sm font-semibold">
                  {{ auth.isAdmin() || auth.isPlanner() ? 'Admin Panel' : 'Dashboard' }}
                </a>
              </div>
            }
          </div>
        </div>
      }

      <!-- Search Bar -->
      @if (searchOpen()) {
        <div class="border-t border-white/10 py-3 px-4" [class]="mobileBgClass()">
          <div class="container mx-auto relative">
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="onSearchChange($event)"
                   placeholder="Search services, venues, packages..."
                   class="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm focus:outline-none focus:border-secondary"
                   [class]="navLinkClass()" autofocus>
            <div class="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-white shadow-luxury border border-gray-100 overflow-hidden z-50">
              @if (searchLoading()) {
                <div class="px-4 py-4 text-sm text-gray-500 flex items-center gap-2">
                  <span class="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></span>
                  Searching...
                </div>
              } @else if (searchQuery().trim().length >= 2 && searchResults().length === 0) {
                <div class="px-4 py-4 text-sm text-gray-500">No results found.</div>
              } @else if (searchResults().length > 0) {
                <div class="max-h-96 overflow-y-auto py-2">
                  @for (result of searchResults(); track result.type + result.slug) {
                    <a [routerLink]="resultPath(result)" (click)="closeSearch()"
                       class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <span class="material-icons text-primary text-lg">{{ resultIcon(result.type) }}</span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-semibold text-dark truncate">{{ result.title || result.name }}</span>
                        <span class="block text-xs text-gray-400 capitalize">{{ result.type }}{{ result.city ? ' • ' + result.city : '' }}{{ result.tier ? ' • ' + result.tier : '' }}</span>
                      </span>
                    </a>
                  }
                </div>
              } @else {
                <div class="px-4 py-4 text-sm text-gray-500">Type at least 2 characters to search PrideHub.</div>
              }
            </div>
          </div>
        </div>
      }
    </nav>
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();

  readonly scrolled = signal(false);
  readonly mobileOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly isDark = signal(document.documentElement.classList.contains('dark'));
  readonly searchQuery = signal('');
  readonly searchResults = signal<SearchResult[]>([]);
  readonly searchLoading = signal(false);

  readonly navLinks: NavLink[] = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Packages', path: '/packages' },
    { label: 'Venues', path: '/venues' },
    { label: 'Vendors', path: '/vendors' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Blog', path: '/blog' },
    { label: 'Contact', path: '/contact' },
  ];

  constructor() {
    const sub = this.searchTerms.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap((query) => {
        this.searchLoading.set(query.trim().length >= 2);
        if (query.trim().length < 2) this.searchResults.set([]);
      }),
      switchMap((query) => query.trim().length < 2
        ? of({ results: [] } as SearchResponse)
        : this.api.get<SearchResponse>('search', { q: query.trim(), limit: 5 }).pipe(
            catchError(() => of({ results: [] } as SearchResponse)),
          )),
    ).subscribe((response) => {
      this.searchResults.set(response.results ?? []);
      this.searchLoading.set(false);
    });

    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 40); }

  navClass() {
    const base = 'transition-all duration-300';
    if (this.scrolled() || this.mobileOpen()) {
      return `${base} bg-dark/95 backdrop-blur-xl shadow-luxury`;
    }
    return `${base} bg-transparent`;
  }

  navLinkClass() { return this.scrolled() || this.mobileOpen() ? 'text-white' : 'text-white'; }
  iconClass() { return 'text-white'; }
  logoTextClass() { return 'text-white'; }
  logoTaglineClass() { return 'text-white/60'; }
  loginBtnClass() { return 'text-white border border-white/30 hover:bg-white/10'; }
  mobileBgClass() { return 'bg-dark/95 backdrop-blur-xl'; }

  userInitial() {
    const u = this.auth.currentUser();
    return u ? u.firstName[0].toUpperCase() : 'U';
  }

  toggleMobile() { this.mobileOpen.set(!this.mobileOpen()); }
  toggleSearch() { this.searchOpen.set(!this.searchOpen()); }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.searchTerms.next(query);
  }

  closeSearch() {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  resultPath(result: SearchResult): string {
    const paths: Record<SearchResult['type'], string> = {
      service: '/services',
      package: '/packages',
      venue: '/venues',
      vendor: '/vendors',
      blog: '/blog',
    };
    return `${paths[result.type]}/${result.slug}`;
  }

  resultIcon(type: SearchResult['type']): string {
    return {
      service: 'celebration',
      package: 'inventory_2',
      venue: 'location_on',
      vendor: 'storefront',
      blog: 'article',
    }[type];
  }

  toggleTheme() {
    const html = document.documentElement;
    const dark = html.classList.toggle('dark');
    this.isDark.set(dark);
    localStorage.setItem('ph_theme', dark ? 'dark' : 'light');
  }
}
