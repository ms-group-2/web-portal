import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { mustMatchField } from 'lib/validators/must-match-validator';
import { edgeSpacesValidator, passwordStrengthValidator } from 'lib/validators/password-strength.validator';
import { strictEmailValidator } from 'lib/validators/strict-email.validator';
import { sanitizeTextInput, sanitizePasswordInput } from 'lib/utils/input-sanitizers.util';
import { AuthService } from 'lib/services/identity/auth.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';

@Component({
  selector: 'vipo-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './register.html',
})
export class Register implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  serverDownError = signal(false);

  form = this.fb.group({
    email: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(255), strictEmailValidator(), emptySpaceValidator()],
      updateOn: 'blur'
    }),
    firstName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(60), emptySpaceValidator()]),
    lastName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(60), emptySpaceValidator()]),
    password: this.fb.control('', [Validators.required, Validators.maxLength(128), passwordStrengthValidator(), edgeSpacesValidator()]),
    confirmPassword: this.fb.control('', [Validators.required, mustMatchField('password')]),
  });

  ngOnInit(): void {
    this.translation.loadModule('auth')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.translation.loadModule('validation')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    const passwordControl = this.form.controls.password;
    const confirmControl = this.form.controls.confirmPassword;

    passwordControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        confirmControl.updateValueAndValidity();
      });

    const pending = this.auth.pendingRegistration();
    if (pending) {
      this.form.patchValue({
        email: pending.email,
        firstName: pending.firstName,
        lastName: pending.lastName,
      });
    }
  }

  onTextInput(event: Event, controlName: 'firstName' | 'lastName'): void {
    sanitizeTextInput(event, this.form.controls[controlName]);
  }

  onPasswordInput(event: Event, controlName: 'password' | 'confirmPassword'): void {
    sanitizePasswordInput(event, this.form.controls[controlName]);
  }

  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getError(controlName: keyof typeof this.form.controls): string {
    const errors = this.form.controls[controlName].errors as Record<string, any> | null;
    if (!errors) return '';

    const key = Object.keys(errors)[0];

    if (key === 'passwordStrength') {
      const strengthErrors = errors['passwordStrength'];
      const errorKeys = Object.keys(strengthErrors);
      if (errorKeys.length === 0) return '';

      const firstError = errorKeys[0];
      const pascalCase = firstError.charAt(0).toUpperCase() + firstError.slice(1);
      return this.translation.translate(`validation.passwordStrength${pascalCase}`);
    }

    if (key === 'minlength' && errors['minlength']?.requiredLength) {
      return this.translation.translate('validation.minlength', { n: errors['minlength'].requiredLength });
    }

    if (key === 'maxlength' && errors['maxlength']?.requiredLength) {
      return this.translation.translate('validation.maxlength', { n: errors['maxlength'].requiredLength });
    }

    return this.translation.translate(`validation.${key}`);
  }

  isGeorgian(): boolean {
    return this.translation.isGeorgian();
  }

  toggleLanguage(): void {
    this.translation.toggleLanguage();
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

        if (err.status === 409) {
          this.form.controls.email.setErrors({ alreadyRegistered: true });
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
