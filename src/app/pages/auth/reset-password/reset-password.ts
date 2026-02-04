import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { formInputErrors } from 'lib/constants/enums/form-input-errors.enum';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { passwordStrengthValidator, edgeSpacesValidator } from 'lib/validators/password-strength.validator';
import { formatPasswordStrengthErrors } from 'lib/utils/password-strength-error.util';
import { AuthService } from 'lib/services/identity/auth.service';

@Component({
  selector: 'vipo-reset-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);


  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  ERRORS = formInputErrors;

  step = signal<'code' | 'newPassword'>('code');
  isLoading = signal(false);
  infoMessage = signal<string | null>(null);
  serverDownError = signal(false);

  private passwordChangeToken = signal<string | null>(null);
  private resetToken = signal<string | null>(null);

  form = this.fb.group({
    email: this.fb.control({ value: '', disabled: true }, [
      Validators.required,
      Validators.email,
    ]),
    code: this.fb.control('', [
      Validators.required,
      Validators.minLength(4),
      emptySpaceValidator(),
    ]),
    new_password: this.fb.control('', [
      Validators.required,
      passwordStrengthValidator(),
    ]),
    confirm_password: this.fb.control('', [
      Validators.required,
      edgeSpacesValidator(),
    ]),
  });

  sanitizePasswordInput(event: Event, controlName: 'new_password' | 'confirm_password'): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    const sanitized = input.value.replace(/[^A-Za-z0-9!@#$%^&*(),.?":{}|<>]/g, '');
    input.value = sanitized;
    this.form.controls[controlName].setValue(sanitized);
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const resetToken = this.route.snapshot.queryParamMap.get('reset_token');

    if (!email) {
      this.router.navigateByUrl('/auth/forgot-password');
      return;
    }

    this.form.controls.email.setValue(email);
    if (resetToken) {
      this.resetToken.set(resetToken);
    }
  }

  showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  getError(name: keyof typeof this.form.controls): string | null {
    const errors = this.form.controls[name].errors;
    if (!errors) return null;
    const key = Object.keys(errors)[0];

    if (key === 'passwordStrength') {
      const value = this.form.controls.new_password.value;
      return formatPasswordStrengthErrors(errors['passwordStrength'], value);
    }

    return this.ERRORS[key] ?? null;
  }

  resend(): void {
    const email = this.form.controls.email.getRawValue();
    if (!email) return;

    this.isLoading.set(true);
    this.infoMessage.set(null);
    this.serverDownError.set(false);

    this.auth.resendPasswordResetCode(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.infoMessage.set('კოდი ხელახლა გაიგზავნა ელფოსტაზე');
      },
      error: (err) => {
        console.log('Resend error:', err);
        this.isLoading.set(false);
        this.serverDownError.set(true);
      },
    });
  }

  submitCode(): void {
    const email = this.form.controls.email.getRawValue();
    const code = this.form.controls.code.getRawValue();
    const resetToken = this.resetToken();

    if (!email || !code) {
      this.form.markAllAsTouched();
      return;
    }

    if (!resetToken) {
      this.serverDownError.set(false);
      this.form.controls.code.setErrors({ verificationFailed: true });
      this.form.controls.code.markAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.infoMessage.set(null);
    this.serverDownError.set(false);

    this.auth.validateResetCode({ email, code, reset_token: resetToken }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.serverDownError.set(false);
        this.passwordChangeToken.set(res.password_change_token);
        this.step.set('newPassword');
      },
      error: (err) => {
        this.isLoading.set(false);

        if (err?.status === 0 || err?.status === 500) {
          this.serverDownError.set(true);
        } else {
          this.form.controls.code.setErrors({ verificationFailed: true });
        }
      },
    });
  }

  submitNewPassword(): void {
    const email = this.form.controls.email.getRawValue();
    const new_password = this.form.controls.new_password.getRawValue();
    const confirm_password = this.form.controls.confirm_password.getRawValue();
    const token = this.passwordChangeToken();

    if (!email || !new_password || !confirm_password || !token) {
      this.form.markAllAsTouched();
      return;
    }

    if (new_password !== confirm_password) {
      this.form.controls.confirm_password.setErrors({ mustMatchField: true });
      return;
    }

    this.isLoading.set(true);
    this.infoMessage.set(null);
    this.serverDownError.set(false);

    this.auth.setNewPassword({
      email,
      new_password,
      password_change_token: token,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl('/auth/sign-in');
      },
      error: (err) => {
        console.log('Set new password error:', err);
        this.isLoading.set(false);
        this.serverDownError.set(true);
      },
    });
  }
}