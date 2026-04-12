import { HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction, pipe, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SnackbarService } from 'lib/services/snackbar.service';

export interface NotificationOptions {
  successMessage?: string;
  errorMessage?: string;
  errorMap?: Record<number, string>;
}

export function withNotification<T>(
  snackbar: SnackbarService,
  options?: NotificationOptions
): MonoTypeOperatorFunction<T> {
  if (!options) return pipe();

  return pipe(
    tap(() => {
      if (options.successMessage) {
        snackbar.success(options.successMessage);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const mapped = options.errorMap?.[error.status];
      if (mapped) {
        snackbar.error(mapped);
      } else if (options.errorMessage && error.status > 0 && error.status < 500) {
        snackbar.error(options.errorMessage);
      }
      return throwError(() => error);
    })
  );
}
