import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/identity/auth.service';
import { TokenManagementService } from '../services/identity/token-management.service';

let isRefreshing = false;

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const tokens = inject(TokenManagementService);
  const auth = inject(AuthService);

  const isAuthEndpoint =
    req.url.includes('/auth/token') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/verify') ||
    req.url.includes('/auth/login/google') ||
    req.url.includes('/auth/callback/google') ||
    req.url.includes('/auth/resend-verification-code');

  if (isAuthEndpoint) {
    return next(req);
  }

  const access = tokens.accessToken();

  const authReq = access
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${access}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err?.status !== 401) {
        return throwError(() => err);
      }

      if (req.url.includes('/auth/refresh')) {
        auth.logout();
        return throwError(() => err);
      }

      if (!tokens.refreshToken()) {
        auth.logout();
        return throwError(() => err);
      }

      if (isRefreshing) {
        return throwError(() => err);
      }

      isRefreshing = true;

      return auth.refresh().pipe(
        switchMap(res => {
          isRefreshing = false;

          auth.setTokensFromResponse(res);

          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${res.access_token}`,
            },
          });

          return next(retryReq);
        }),
        catchError(refreshErr => {
          isRefreshing = false;
          auth.logout();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};