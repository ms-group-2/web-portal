import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslationService } from 'lib/services/translation.service';

/**
 * Centralised HTTP error interceptor.
 *
 * Shows a user-facing snackbar for server errors (5xx) and network failures.
 * Always re-throws so downstream catchError blocks can still do cleanup.
 *
 * 401 is handled by jwtInterceptor — skipped here.
 * 4xx client errors are intentionally NOT shown here because they are
 * expected responses that components/services handle specifically.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(SnackbarService);
  const translate = inject(TranslationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return throwError(() => error);
      }

      if (error.status === 0) {
        snackbar.error(translate.translate('errors.networkError'));
      } else if (error.status >= 500) {
        snackbar.error(translate.translate('errors.generic'));
      }

      return throwError(() => error);
    })
  );
};
