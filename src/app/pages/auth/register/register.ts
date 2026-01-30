import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { formInputErrors } from 'lib/constants/enums/form-input-errors.enum';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { mustMatchField } from 'lib/validators/must-match-validator';
import { passwordStrengthValidator } from 'lib/validators/password-strength.validator';
import { formatPasswordStrengthErrors } from 'lib/utils/password-strength-error.util';
import { AuthService } from 'lib/services/identity/auth.service';

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
  private auth = inject(AuthService);
  private router = inject(Router);

  

  ERRORS = formInputErrors;

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email, emptySpaceValidator()]),
    firstName: this.fb.control('', [Validators.required, Validators.minLength(3), emptySpaceValidator()]),
    lastName: this.fb.control('', [Validators.required, Validators.minLength(3), emptySpaceValidator()]),
    password: this.fb.control('', [Validators.required, passwordStrengthValidator()]),
    confirmPassword: this.fb.control('', [Validators.required, mustMatchField('password')]),
  });

  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getError(controlName: keyof typeof this.form.controls): string | null {
    const errors = this.form.controls[controlName].errors as Record<string, any> | null;
    if (!errors) return null;

    const key = Object.keys(errors)[0];

    if (key === 'passwordStrength') {
      return formatPasswordStrengthErrors(errors['passwordStrength']);
    }

    if (key === 'minlength') {
      const required = errors['minlength'].requiredLength;
      return this.ERRORS['minlength'].replace('{n}', String(required));
    }
    
    return this.ERRORS[key] ?? null;

    // if (key === 'minlength') {
    //   const required = errors['minlength']?.requiredLength;
    //   if (typeof required === 'number') {
    //     return `მინიმუმ ${required} სიმბოლო`;
    //   }
    //   return this.ERRORS['minlength'] ?? null;
    // }
  }
  onGoogle(): void {
      this.auth.googleLoginRedirect();
    }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, firstName, lastName } = this.form.getRawValue();

    this.auth.register({ email, password, firstName, lastName }).subscribe({
      next: () => {
        this.auth.pendingEmail.set(email);
        this.router.navigate(['/auth/verify'], { queryParams: { email } });
      },
      error: (err) => {

        if (err.status === 0) {
          this.form.controls.email.setErrors({ serverDown: true });
          return;
        }

        if (err.status === 400) {
          this.form.controls.email.setErrors({ server: true });
          return;
        }

        this.form.controls.email.setErrors({ serverDown: true });
        console.error(err);
      }
    });
  }
}
