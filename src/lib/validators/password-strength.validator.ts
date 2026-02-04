import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface PasswordStrengthErrors {
  minLength?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
  specialChar?: boolean;
  digit?: boolean;
  edgeSpaces?: boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control || typeof control.value !== 'string') {
      return null;
    }

    const value = control.value;
    const errors: PasswordStrengthErrors = {};

    if (value.startsWith(' ') || value.endsWith(' ')) {
      errors.edgeSpaces = true;
    }

    if (value.length < PASSWORD_MIN_LENGTH) {
      errors.minLength = true;
    }

    if (!/[A-Z]/.test(value)) {
      errors.uppercase = true;
    }

    if (!/[a-z]/.test(value)) {
      errors.lowercase = true;
    }

    if (!/\d/.test(value)) {
      errors.digit = true;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.specialChar = true;
    }

    return Object.keys(errors).length
      ? { passwordStrength: errors }
      : null;
  };
}

export function edgeSpacesValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value !== 'string') {
      return null;
    }

    return value.startsWith(' ') || value.endsWith(' ') ? { edgeSpaces: true } : null;
  };
}
