import { Component, OnInit, inject, signal } from '@angular/core';
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
import { edgeSpacesValidator, passwordStrengthValidator } from 'lib/validators/password-strength.validator';
import { strictEmailValidator } from 'lib/validators/strict-email.validator';
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
export class Register implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  

  ERRORS = formInputErrors;

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  serverDownError = signal(false);

  form = this.fb.group({
    email: this.fb.control('', {
      validators: [Validators.required, strictEmailValidator(), emptySpaceValidator()],
      updateOn: 'blur'
    }),
    firstName: this.fb.control('', [Validators.required, Validators.minLength(3), emptySpaceValidator(), ]),
    lastName: this.fb.control('', [Validators.required, Validators.minLength(3), emptySpaceValidator()]),
    password: this.fb.control('', [Validators.required, passwordStrengthValidator(), edgeSpacesValidator(), ]),
    confirmPassword: this.fb.control('', [Validators.required, mustMatchField('password')]),
  });

  ngOnInit(): void {
    const passwordControl = this.form.controls.password;
    const confirmControl = this.form.controls.confirmPassword;

    passwordControl.valueChanges.subscribe(() => {
      confirmControl.updateValueAndValidity();
    });

    const pending = this.auth.pendingRegistration();
    if (pending) {
      this.form.patchValue({
        email: pending.email,
        firstName: pending.firstName,
        lastName: pending.lastName,
        // password: pending.password,
        // confirmPassword: pending.password,
      });
    }
  }

  sanitizeTextInput(event: Event, controlName: 'firstName' | 'lastName'): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    const sanitized = input.value.replace(/[^a-zA-Zა-ჰ]/g, '');
    input.value = sanitized;
    this.form.controls[controlName].setValue(sanitized);
  }

  sanitizePasswordInput(event: Event, controlName: 'password' | 'confirmPassword'): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    const sanitized = input.value.replace(/[^A-Za-z0-9!@#$%^&*(),.?":{}|<>]/g, '');
    input.value = sanitized;
    this.form.controls[controlName].setValue(sanitized);
  }

  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getError(controlName: keyof typeof this.form.controls): string | null {
    const errors = this.form.controls[controlName].errors as Record<string, any> | null;
    if (!errors) return null;

    const key = Object.keys(errors)[0];

    if (key === 'passwordStrength') {
      const value = this.form.controls.password.value;
      return formatPasswordStrengthErrors(errors['passwordStrength'], value);
    }

    if (key === 'minlength') {
      const required = errors['minlength'].requiredLength;
      return this.ERRORS['minlength'].replace('{n}', String(required));
    }
    
    return this.ERRORS[key] ?? null;

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
    this.serverDownError.set(false);

    this.auth.register({ email, password, firstName, lastName }).subscribe({
      next: () => {
        this.auth.pendingRegistration.set({ email, firstName, lastName });
        this.auth.pendingEmail.set(email);
        this.router.navigate(['/auth/verify'], { queryParams: { email } });
      },
      error: (err) => {

        if (err.status === 0) {
          this.serverDownError.set(true);
          return;
        }

        if (err.status === 400) {
          this.form.controls.email.setErrors({ server: true });
          return;
        }

        this.serverDownError.set(true);
        console.error(err);
      }
    });
  }
}
