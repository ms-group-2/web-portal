import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from 'lib/services/snackbar.service';
import { SNACKBAR_MESSAGES } from 'lib/constants/enums/snackbar-messages.enum';

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

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return throwError(() => error);
      }

      if (error.status === 0) {
        snackbar.error('ინტერნეტთან კავშირი ვერ მოხერხდა');
      } else if (error.status >= 500) {
        snackbar.error(SNACKBAR_MESSAGES.ERROR_GENERIC);
      }

      return throwError(() => error);
    })
  );
};
