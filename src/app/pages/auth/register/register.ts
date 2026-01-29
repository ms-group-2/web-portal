import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { formInputErrors } from '../../../../lib/constants/enums/form-input-errors.enum';
import { emptySpaceValidator } from '../../../../lib/validators/empty-space.validator';
import { mustMatchField } from '../../../../lib/validators/must-match-validator';

@Component({
  standalone: true,
  selector: 'vipo-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './register.html',
})
export class Register {
  private fb = inject(NonNullableFormBuilder);

  ERRORS = formInputErrors;

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email, emptySpaceValidator()]),
    firstName: this.fb.control('', [Validators.required, Validators.minLength(2), emptySpaceValidator()]),
    lastName: this.fb.control('', [Validators.required, Validators.minLength(2), emptySpaceValidator()]),
    password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: this.fb.control('', [Validators.required, mustMatchField('password')]),
  });

  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getError(controlName: keyof typeof this.form.controls): string | null {
    const errors = this.form.controls[controlName].errors;
    if (!errors) {
      return null;
    }

    const key = Object.keys(errors)[0];
    return this.ERRORS[key] ?? null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // demo payload
    const payload = this.form.getRawValue();
    console.log('REGISTER payload:', payload);

    // later: call AuthService.register(payload)
  }
}
