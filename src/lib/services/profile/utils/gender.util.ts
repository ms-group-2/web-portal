export class GenderUtil {
  /** API → locale-independent form value (mat-select [value] must stay stable across languages). */
  static toFormValue(gender: boolean | null | undefined): 'male' | 'female' | '-' {
    if (gender === null || gender === undefined) {return '-';}
    return gender === true ? 'male' : 'female';
  }

  static toApiBoolean(formGender: string): boolean | null {
    if (!formGender || formGender === '-') {
      return null;
    }
    if (formGender === 'male' || formGender === 'კაცი' || formGender === 'Male') {
      return true;
    }
    if (formGender === 'female' || formGender === 'ქალი' || formGender === 'Female') {
      return false;
    }
    return null;
  }
}
