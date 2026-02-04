import { formInputErrors } from '../constants/enums/form-input-errors.enum';
import { PasswordStrengthErrors } from '../validators/password-strength.validator';

export function formatPasswordStrengthErrors(
  passwordErrors: PasswordStrengthErrors,
  value?: string | null
): string | null {
  const lengthForUi = typeof value === 'string' ? value.length : 0;

  const getMessageForKey = (key: keyof PasswordStrengthErrors): string | null => {
    switch (key) {
      case 'edgeSpaces':
        return formInputErrors['edgeSpaces'];
      case 'minLength':
        return formInputErrors['passwordStrengthMinLength'];
      case 'uppercase':
        return formInputErrors['passwordStrengthUppercase'];
      case 'lowercase':
        return formInputErrors['passwordStrengthLowercase'];
      case 'digit':
        return formInputErrors['passwordStrengthDigit'];
      case 'specialChar':
        return formInputErrors['passwordStrengthSpecialChar'];
      default:
        return null;
    }
  };

  if (passwordErrors.edgeSpaces) {
    return getMessageForKey('edgeSpaces');
  }

 
  if (passwordErrors.minLength) {
    const minMsg = getMessageForKey('minLength')!;

    if (lengthForUi < 6) {
      return minMsg;
    }

    const secondaryOrder: (keyof PasswordStrengthErrors)[] = [
      'uppercase',
      'lowercase',
      'digit',
      'specialChar',
    ];

    for (const key of secondaryOrder) {
      if (!passwordErrors[key]) continue;
      const extra = getMessageForKey(key);
      if (extra) {
        return `${minMsg} ${extra}`;
      }
    }

    return minMsg;
  }

  const priorityOrder: (keyof PasswordStrengthErrors)[] = [
    'uppercase',
    'lowercase',
    'digit',
    'specialChar',
  ];

  for (const key of priorityOrder) {
    if (!passwordErrors[key]) continue;
    const msg = getMessageForKey(key);
    if (msg) return msg;
  }

  return null;
}

