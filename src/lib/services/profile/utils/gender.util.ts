export class GenderUtil {

  static toBoolean(genderString: string): boolean | null {
    if (genderString === '-') return null;
    return genderString === 'კაცი';
  }


  static toString(genderBoolean: boolean | null | undefined): string {
    if (genderBoolean === null || genderBoolean === undefined) return '-';
    return genderBoolean === true ? 'კაცი' : 'ქალი';
  }
}
