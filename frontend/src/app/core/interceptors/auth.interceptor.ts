import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, catchError, switchMap, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

// Single shared refresh state to prevent multiple simultaneous refresh calls
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Attach access token from localStorage to every request
  const token = authService.getAccessToken();
  const isAuthEndpoint = req.url.includes('/auth/');

  // Always send credentials (cookies) so the HttpOnly refresh token cookie is included
  const reqWithCreds = req.clone({ withCredentials: true });

  const authReq = token && !isAuthEndpoint
    ? reqWithCreds.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : reqWithCreds;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only attempt refresh on 401 from non-auth endpoints
      if (error.status === 401 && !isAuthEndpoint) {
        if (isRefreshing) {
          // Wait for the ongoing refresh to complete, then retry
          return refreshDone$.pipe(
            filter((done) => done),
            take(1),
            switchMap(() => {
              const newToken = authService.getAccessToken();
              const retried = req.clone({
                withCredentials: true,
                setHeaders: newToken ? { Authorization: `Bearer ${newToken}` } : {},
              });
              return next(retried);
            }),
          );
        }

        isRefreshing = true;
        refreshDone$.next(false);

        return authService.refreshTokens().pipe(
          switchMap((tokens) => {
            isRefreshing = false;
            refreshDone$.next(true);
            const retried = req.clone({
              withCredentials: true,
              setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
            });
            return next(retried);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            refreshDone$.next(false);
            authService.logout();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
