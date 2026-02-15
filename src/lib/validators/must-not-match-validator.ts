import { ValidatorFn, AbstractControl } from '@angular/forms';

export function mustNotMatchField(fieldToCompare: string): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control || !control.parent) {
      return null;
    }

    const compareValue = control.parent.get(fieldToCompare)?.value;

    if (!compareValue || !control.value) {
      return null;
    }

    return control.value === compareValue
      ? { passwordsSame: true }
      : null;
  };
}
