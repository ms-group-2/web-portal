import { AbstractControl, ValidatorFn } from '@angular/forms';

export function strictEmailValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) {
      return null;
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(control.value)) {
      return { email: true };
    }

    return null;
  };
}
