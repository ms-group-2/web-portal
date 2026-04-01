import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VendorService } from 'lib/services/vendor/vendor.service';

/**
 * Runs after sync validators pass. Call the API on blur (use updateOn: 'blur' on the control).
 */
export function businessRegistryAsyncValidator(vendorService: VendorService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const raw = (control.value ?? '').toString().trim();
    if (!raw || raw.length < 9) {
      return of(null);
    }
    if (!/^\d+$/.test(raw)) {
      return of(null);
    }

    return vendorService.verifyIdentificationNumber(raw).pipe(
      map(() => null),
      catchError((err: HttpErrorResponse) => {
        const code = err.error?.error_code;
        if (code === 'INVALID_ID_NUMBER') {
          return of({ invalidBusinessRegistryId: true });
        }
        return of({ businessRegistryVerificationFailed: true });
      })
    );
  };
}
