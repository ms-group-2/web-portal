export class PhoneUtil {
  static readonly GE_DIAL_CODE = '+995';

  private static sanitize(value: string): string {
    if (!value) return '';
    return value.replace(/[^\d+]/g, '');
  }

  static extractGeNational(value: string | null | undefined): string {
    if (!value) return '';

    const cleaned = this.sanitize(value.replace(/^tel:/i, ''));
    if (!cleaned) return '';

    return cleaned
      .replace(/^\+995/, '')
      .replace(/^995/, '')
      .replace(/\D/g, '');
  }

  static toGeE164(national: string | null | undefined): string {
    if (!national) return '';

    const digits = national.replace(/\D/g, '');
    if (!digits) return '';

    return `${this.GE_DIAL_CODE}${digits}`;
  }

  static splitGePhone(fullNumber: string | null | undefined): { code: string; number: string } {
    return {
      code: this.GE_DIAL_CODE,
      number: this.extractGeNational(fullNumber),
    };
  }
}
