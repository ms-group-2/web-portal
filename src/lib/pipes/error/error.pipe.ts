import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { IError } from './error.model';

@Pipe({
  name: 'error',
  standalone: true,
})
export class ErrorPipe implements PipeTransform {
  constructor() {}

  transform(
    formErrors: ValidationErrors | null | undefined,
    inputErrors: IError
  ): string | null {
    if (!formErrors || !inputErrors) {
      return null;
    } else {
      const key = Object.keys(formErrors)[0];
      return inputErrors[key];
    }
  }
}
