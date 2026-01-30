import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface PasswordStrengthErrors {
  minLength?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
  specialChar?: boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control || !control.value) {
      return null;
    }

    const value: string = control.value;
    const errors: PasswordStrengthErrors = {};

    if (value.length < PASSWORD_MIN_LENGTH) {
      errors.minLength = true;
    }

    if (!/[A-Z]/.test(value)) {
      errors.uppercase = true;
    }

    if (!/[a-z]/.test(value)) {
      errors.lowercase = true;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.specialChar = true;
    }

    return Object.keys(errors).length > 0 ? { passwordStrength: errors } : null;
  };
}

