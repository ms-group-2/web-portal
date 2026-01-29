import { AbstractControl, ValidatorFn } from '@angular/forms';

export function emptySpaceValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control) {
      return null;
    }

    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return typeof value === 'string' && value.trim() === '' ? { emptySpace: true } : null;
  };
}
