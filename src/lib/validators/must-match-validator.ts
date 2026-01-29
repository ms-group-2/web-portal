import { ValidatorFn, AbstractControl } from '@angular/forms';

export function mustMatchField(fieldToMatch: string): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control || !control.parent) {
      return null;
    }

    return control.parent.get(fieldToMatch)?.value === control.value
      ? null
      : { mustMatchField: true };
  };
}



// import { AbstractControl, ValidatorFn } from '@angular/forms';

// export function mustMatchField(fieldToMatch: string): ValidatorFn {
//   return (control: AbstractControl) => {
//     if (!control?.parent) return null;
//     const a = control.parent.get(fieldToMatch)?.value;
//     const b = control.value;
//     return a === b ? null : { mustMatchField: true };
//   };
// }