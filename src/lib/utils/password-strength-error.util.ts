import { formInputErrors } from '../constants/enums/form-input-errors.enum';
import { PasswordStrengthErrors } from '../validators/password-strength.validator';

export function formatPasswordStrengthErrors(
  passwordErrors: PasswordStrengthErrors
): string | null {
  const errorMessages: string[] = [];

  if (passwordErrors.edgeSpaces) {
    errorMessages.push(formInputErrors['edgeSpaces']);
  }

  if (passwordErrors.minLength) {
    errorMessages.push(formInputErrors['passwordStrengthMinLength']);
  }
  if (passwordErrors.uppercase) {
    errorMessages.push(formInputErrors['passwordStrengthUppercase']);
  }
  if (passwordErrors.lowercase) {
    errorMessages.push(formInputErrors['passwordStrengthLowercase']);
  }
  if (passwordErrors.specialChar) {
    errorMessages.push(formInputErrors['passwordStrengthSpecialChar']);
  }

  return errorMessages.length > 0 ? errorMessages.join(' ') : null;
}

