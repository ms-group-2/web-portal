import { Component, OnDestroy, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { formInputErrors } from 'lib/constants/enums/form-input-errors.enum';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { mustMatchField } from 'lib/validators/must-match-validator';
import { passwordStrengthValidator, edgeSpacesValidator } from 'lib/validators/password-strength.validator';
import { formatPasswordStrengthErrors } from 'lib/utils/password-strength-error.util';
import { sanitizePasswordInput } from 'lib/utils/input-sanitizers.util';
import { AuthService } from 'lib/services/identity/auth.service';

@Component({
  selector: 'vipo-reset-password',
  imports: [
    NgClass,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './reset-password.html',
})
export class ResetPassword implements OnDestroy {
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
  resendCountdown = signal<number>(0);
  private countdownInterval: any = null;

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
    codeDigits: this.fb.array<FormControl<string>>(
      Array.from({ length: 4 }, () =>
        this.fb.control('', [Validators.required])
      )
    ),
    new_password: this.fb.control('', [
      Validators.required,
      Validators.maxLength(128),
      passwordStrengthValidator(),
      edgeSpacesValidator(),
    ]),
    confirm_password: this.fb.control('', [
      Validators.required,
      mustMatchField('new_password'),
    ]),
  });

  get codeArray(): FormControl<string>[] {
    return (this.form.get('codeDigits') as FormArray<FormControl<string>>).controls;
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    const value = input.value.replace(/\D/g, '').slice(0, 1);
    input.value = value;
    this.codeArray[index].setValue(value);

    if (value && index < this.codeArray.length - 1) {
      (input.nextElementSibling as HTMLInputElement | null)?.focus();
    }
    if (!value && index > 0) {
      (input.previousElementSibling as HTMLInputElement | null)?.focus();
    }

    const joined = this.codeArray.map(c => c.value).join('');
    this.form.controls.code.setValue(joined);
  }

  onPasswordInput(event: Event, controlName: 'new_password' | 'confirm_password'): void {
    sanitizePasswordInput(event, this.form.controls[controlName]);
  }

  ngOnInit(): void {
    const emailFromSignal = this.auth.pendingPasswordReset();

    if (!emailFromSignal) {
      this.router.navigateByUrl('/auth/forgot-password');
      return;
    }

    const resetToken = this.route.snapshot.queryParamMap.get('reset_token');
    this.form.controls.email.setValue(emailFromSignal);

    if (resetToken) {
      this.resetToken.set(resetToken);
    }

    const newPasswordControl = this.form.controls.new_password;
    const confirmPasswordControl = this.form.controls.confirm_password;

    newPasswordControl.valueChanges.subscribe(() => {
      confirmPasswordControl.updateValueAndValidity();
    });

    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.resendCountdown.set(120);

    this.countdownInterval = setInterval(() => {
      const current = this.resendCountdown();
      if (current > 0) {
        this.resendCountdown.set(current - 1);
      } else {
        this.clearCountdown();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  get formattedCountdown(): string {
    const seconds = this.resendCountdown();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  get canResend(): boolean {
    return this.resendCountdown() === 0 && !this.isLoading();
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

    if (key === 'minlength') {
      const required = errors['minlength'].requiredLength;
      return this.ERRORS['minlength'].replace('{n}', String(required));
    }

    if (key === 'maxlength') {
      const required = errors['maxlength'].requiredLength;
      return this.ERRORS['maxlength'].replace('{n}', String(required));
    }

    return this.ERRORS[key] ?? null;
  }

  resend(): void {
    const email = this.form.controls.email.getRawValue();
    const resetToken = this.resetToken();
    if (!email || !this.canResend) return;

    this.isLoading.set(true);
    this.infoMessage.set(null);
    this.serverDownError.set(false);
    this.form.controls.code.setErrors(null);

    this.auth.resendPasswordResetCode(email, resetToken || undefined).subscribe({
      next: (res) => {
        console.log('Resend response:', res);
        this.isLoading.set(false);
        this.infoMessage.set('კოდი ხელახლა გაიგზავნა ელფოსტაზე');
        this.startCountdown();

        const newResetToken = (res as any).reset_token;
        if (newResetToken) {
          console.log('New reset_token received:', newResetToken);
          this.resetToken.set(newResetToken);
        } else {
          console.warn('No reset_token in resend response');
        }
      },
      error: (err) => {
        console.log('Resend error:', err);
        this.isLoading.set(false);

        if (err?.status === 429) {
          this.form.controls.code.setErrors({ rateLimitExceeded: true });
          this.form.controls.code.markAsTouched();
        } else {
          this.serverDownError.set(true);
        }
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

    this.isLoading.set(true);
    this.infoMessage.set(null);
    this.serverDownError.set(false);

    this.auth.validateResetCode({ email, code, reset_token: resetToken || '' }).subscribe({
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
        } else if (err?.status === 410) {
          this.form.controls.code.setErrors({ codeExpired: true });
          this.form.controls.code.markAsTouched();
        } else if (err?.status === 401) {
          this.form.controls.code.setErrors({ incorrectCode: true });
          this.form.controls.code.markAsTouched();
        } else {
          this.form.controls.code.setErrors({ verificationFailed: true });
          this.form.controls.code.markAsTouched();
        }
      },
    });
  }

  submitNewPassword(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.controls.email.getRawValue();
    const new_password = this.form.controls.new_password.getRawValue();
    const token = this.passwordChangeToken();

    if (!email || !new_password || !token) {
      this.form.markAllAsTouched();
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
        this.auth.pendingPasswordReset.set(null);
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