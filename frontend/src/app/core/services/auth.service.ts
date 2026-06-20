import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap, map, finalize } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { User, AuthTokens } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface LoginDto { email: string; password: string; }
interface RegisterDto { firstName: string; lastName: string; email: string; phone?: string; password: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<User | null>(this.loadStoredUser());
  private readonly _isLoading = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly isAdmin = computed(() => ['SUPER_ADMIN', 'ADMIN'].includes(this._currentUser()?.role ?? ''));
  readonly isPlanner = computed(() => this._currentUser()?.role === 'EVENT_PLANNER');
  readonly isVendor = computed(() => this._currentUser()?.role === 'VENDOR');

  private get apiUrl() { return environment.apiUrl; }

  register(dto: RegisterDto): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/auth/register`, dto);
  }

  login(dto: LoginDto): Observable<User> {
    this._isLoading.set(true);
    return this.http.post<ApiResponse<AuthTokens>>(`${this.apiUrl}/auth/login`, dto).pipe(
      tap((res) => {
        this.storeTokens(res.data);
      }),
      switchMap(() => this.fetchCurrentUser()),
      finalize(() => this._isLoading.set(false)),
      catchError((err) => throwError(() => err)),
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }).subscribe();
    }
    this.clearSession();
    this.router.navigate(['/']);
  }

  loadCurrentUser(): void {
    const token = this.getAccessToken();
    if (!token) return;

    this.fetchCurrentUser().subscribe();
  }

  refreshTokens(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<ApiResponse<AuthTokens>>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap((res) => this.storeTokens(res.data)),
    ) as any;
  }

  verifyEmail(token: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/verify-email`, { token });
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  getAccessToken(): string | null {
    return localStorage.getItem('ph_access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('ph_refresh_token');
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('ph_access_token', tokens.accessToken);
    localStorage.setItem('ph_refresh_token', tokens.refreshToken);
  }

  private clearSession(): void {
    localStorage.removeItem('ph_access_token');
    localStorage.removeItem('ph_refresh_token');
    localStorage.removeItem('ph_user');
    this._currentUser.set(null);
  }

  private loadStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('ph_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  hasRole(...roles: string[]): boolean {
    const role = this._currentUser()?.role;
    return !!role && roles.includes(role);
  }

  dashboardUrlFor(user = this._currentUser()): string {
    return user && ['SUPER_ADMIN', 'ADMIN', 'EVENT_PLANNER'].includes(user.role) ? '/admin' : '/dashboard';
  }

  private fetchCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/me`).pipe(
      map((res) => res.data),
      tap((user) => {
        this._currentUser.set(user);
        localStorage.setItem('ph_user', JSON.stringify(user));
      }),
      catchError((err) => {
        this.clearSession();
        return throwError(() => err);
      }),
    );
  }
}
