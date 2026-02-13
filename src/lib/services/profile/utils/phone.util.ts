export class PhoneUtil {
  static sanitize(value: string): string {
    if (!value) return '';
    return value.replace(/[^\d+]/g, '');
  }

  static normalizeForApi(input: string): string {
    if (!input) return '';

    const cleaned = this.sanitize(input);

    if (cleaned.startsWith('+')) return cleaned;

    if (/^5\d{8}$/.test(cleaned)) {
      return `+995${cleaned}`;
    }

    if (/^\d{9}$/.test(cleaned)) {
      return `+995${cleaned}`;
    }

    return cleaned;
  }

  static formatForInput(value: string | null | undefined): string {
    if (!value) return '+995';

    const cleaned = this.sanitize(value.replace(/^tel:/i, ''));

    if (!cleaned) return '+995';

    if (cleaned.startsWith('+')) return cleaned;

    return cleaned ? `+995${cleaned}` : '+995';
  }

  static isValidInput(value: string): boolean {
    return /^[+\d]*$/.test(value);
  }
}
