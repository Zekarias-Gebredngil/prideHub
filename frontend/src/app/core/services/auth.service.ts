import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap, map, finalize, of } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { User, AuthTokens, ActiveSession } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface LoginDto { email: string; password: string; }
interface RegisterDto { firstName: string; lastName: string; email: string; phone?: string; password: string; role?: string; }

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
  /** True for VENDOR role OR any user who has set up a vendor profile */
  readonly hasVendorAccess = computed(() => {
    const u = this._currentUser();
    return !!u && (u.role === 'VENDOR' || !!u.vendorProfile);
  });

  private get apiUrl() { return environment.apiUrl; }

  // ── Registration ───────────────────────────────────────────────────────────

  register(dto: RegisterDto): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/auth/register`, dto);
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  login(dto: LoginDto): Observable<User> {
    this._isLoading.set(true);
    return this.http.post<ApiResponse<AuthTokens>>(
      `${this.apiUrl}/auth/login`, dto,
      { withCredentials: true },   // receive HttpOnly refresh token cookie
    ).pipe(
      tap((res) => {
        // Only the access token is in the response body now
        if (res.data?.accessToken) {
          localStorage.setItem('ph_access_token', res.data.accessToken);
        }
      }),
      switchMap(() => this.fetchCurrentUser()),
      finalize(() => this._isLoading.set(false)),
      catchError((err) => throwError(() => err)),
    );
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  logout(): void {
    this.http.post(
      `${this.apiUrl}/auth/logout`, {},
      { withCredentials: true },
    ).subscribe();
    this.clearSession();
    this.router.navigate(['/']);
  }

  logoutAll(): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/auth/logout-all`, {},
      { withCredentials: true },
    ).pipe(
      tap(() => this.clearSession()),
    );
  }

  // ── Current User ───────────────────────────────────────────────────────────

  loadCurrentUser(): void {
    const token = this.getAccessToken();
    if (!token) return;
    this.fetchCurrentUser().subscribe();
  }

  // ── Token Refresh ──────────────────────────────────────────────────────────

  /**
   * Uses the HttpOnly cookie to get a new access token.
   * withCredentials: true ensures the cookie is sent automatically.
   */
  refreshTokens(): Observable<AuthTokens> {
    return this.http.post<ApiResponse<AuthTokens>>(
      `${this.apiUrl}/auth/refresh`, {},
      { withCredentials: true },
    ).pipe(
      map((res) => res.data),
      tap((tokens) => {
        if (tokens?.accessToken) {
          localStorage.setItem('ph_access_token', tokens.accessToken);
        }
      }),
    );
  }

  // ── Password ───────────────────────────────────────────────────────────────

  verifyEmail(token: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/verify-email`, { token });
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/auth/change-password`, { currentPassword, newPassword });
  }

  // ── Session Management ─────────────────────────────────────────────────────

  getSessions(): Observable<ActiveSession[]> {
    return this.http.get<ApiResponse<ActiveSession[]>>(`${this.apiUrl}/auth/sessions`).pipe(
      map((res) => res.data),
    );
  }

  revokeSession(sessionId: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/auth/sessions/${sessionId}`);
  }

  // ── 2FA ────────────────────────────────────────────────────────────────────

  enable2FA(): Observable<{ secret: string; qrCode: string }> {
    return this.http.post<ApiResponse<{ secret: string; qrCode: string }>>(
      `${this.apiUrl}/auth/2fa/enable`, {},
    ).pipe(map((res) => res.data));
  }

  verify2FA(token: string): Observable<{ verified: boolean }> {
    return this.http.post<ApiResponse<{ verified: boolean }>>(
      `${this.apiUrl}/auth/2fa/verify`, { token },
    ).pipe(map((res) => res.data));
  }

  disable2FA(token: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/2fa/disable`, { token });
  }

  // ── Phone OTP ──────────────────────────────────────────────────────────────

  sendPhoneOtp(phone: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/send-phone-otp`, { phone });
  }

  verifyPhoneOtp(phone: string, code: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/verify-phone-otp`, { phone, code });
  }

  // ── Tokens & Storage ───────────────────────────────────────────────────────

  getAccessToken(): string | null {
    return localStorage.getItem('ph_access_token');
  }

  /** @deprecated Refresh token is now in HttpOnly cookie — not accessible from JS */
  getRefreshToken(): string | null { return null; }

  private clearSession(): void {
    localStorage.removeItem('ph_access_token');
    localStorage.removeItem('ph_user');
    this._currentUser.set(null);
  }

  private loadStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('ph_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  hasRole(...roles: string[]): boolean {
    const role = this._currentUser()?.role;
    return !!role && roles.includes(role);
  }

  dashboardUrlFor(user = this._currentUser()): string {
    switch (user?.role) {
      case 'VENDOR':       return '/vendor-dashboard';
      case 'EVENT_PLANNER': return '/planner-dashboard';
      case 'SUPER_ADMIN':
      case 'ADMIN':        return '/admin';
      default:             return '/dashboard';
    }
  }

  private fetchCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/me`).pipe(
      map((res) => res.data),
      tap((user) => {
        this._currentUser.set(user);
        localStorage.setItem('ph_user', JSON.stringify(user));
      }),
      switchMap((user) => {
        // If the DB says this user is a VENDOR but the current JWT still carries
        // an older role (e.g. CLIENT from before the vendor profile was created),
        // silently refresh the token so subsequent API calls pass role guards.
        const jwtRole = this.getRoleFromCurrentJwt();
        if (user.role === 'VENDOR' && jwtRole !== 'VENDOR') {
          return this.refreshTokens().pipe(
            map(() => user),
            catchError(() => of(user)), // best-effort; don't break the login flow
          );
        }
        return of(user);
      }),
      catchError((err) => {
        this.clearSession();
        return throwError(() => err);
      }),
    );
  }

  /** Decode the role claim from the current access token without verifying the signature. */
  private getRoleFromCurrentJwt(): string | null {
    try {
      const token = this.getAccessToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.role ?? null;
    } catch {
      return null;
    }
  }
}
