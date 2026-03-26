import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function phoneNationalValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();

    if (!value) {
      return null;
    }

    // Georgian national phone numbers are 9 digits after +995 and cannot start with 0.
    return /^[2-9]\d{8}$/.test(value) ? null : { invalidPhone: true };
  };
}
