import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormArray, FormControl } from '@angular/forms';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { AuthService } from 'lib/services/identity/auth.service';
import { SnackbarService } from 'lib/services/snackbar.service';
import { SNACKBAR_MESSAGES } from 'lib/constants';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';

@Component({
  selector: 'vipo-verify',
  imports: [
    NgClass,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './verify.html',
})
export class Verify implements OnInit, OnDestroy {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(SnackbarService);
  translation = inject(TranslationService);

  isResending = signal(false);
  resentMessage = signal<string | null>(null);
  serverDownError = signal(false);
  resendCountdown = signal<number>(0);
  private countdownInterval: any = null;

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
  });

  ngOnInit(): void {
    this.translation.loadModule('auth').subscribe();
    this.translation.loadModule('validation').subscribe();

    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    const emailFromSignal = this.auth.pendingEmail();
    const shouldResend = this.route.snapshot.queryParamMap.get('resend') === 'true';

    const email = emailFromQuery ?? emailFromSignal;

    if (!email) {
      this.router.navigateByUrl('/auth/register');
      return;
    }

    this.form.controls.email.setValue(email);
    this.auth.pendingEmail.set(email);

    if (shouldResend) {
      this.resend();
    } else {
      this.startCountdown();
    }
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
        const errors = this.form.controls.code.errors;
        if (errors && errors['rateLimitExceeded']) {
          this.form.controls.code.setErrors(null);
        }
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
    return this.resendCountdown() === 0 && !this.isResending();
  }

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
  
  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getError(controlName: keyof typeof this.form.controls): string {
    const errors = this.form.controls[controlName].errors;
    if (!errors) return '';

    const key = Object.keys(errors)[0];
    const translationKey = `validation.${key}`;

    // Handle minlength and maxlength interpolation
    if (key === 'minlength' && errors[key]?.requiredLength) {
      return this.translation.translate(translationKey, { n: errors[key].requiredLength });
    }
    if (key === 'maxlength' && errors[key]?.requiredLength) {
      return this.translation.translate(translationKey, { n: errors[key].requiredLength });
    }

    return this.translation.translate(translationKey);
  }

  isGeorgian(): boolean {
    return this.translation.isGeorgian();
  }

  toggleLanguage(): void {
    this.translation.toggleLanguage();
  }

  resend(): void {
    const email = this.form.controls.email.getRawValue();

    if (!email || !this.canResend) return;

    this.isResending.set(true);
    this.resentMessage.set(null);
    this.serverDownError.set(false);
    this.form.controls.code.setErrors(null);

    this.auth.resendVerification(email).subscribe({
      next: (res) => {
        this.resentMessage.set(this.translation.translate('auth.verify.codeResentToEmail'));
        this.isResending.set(false);
        this.startCountdown();

        setTimeout(() => {
          this.resentMessage.set(null);
        }, 3000);
      },
      error: (err) => {
        this.isResending.set(false);

        if (err?.status === 429) {
          this.form.controls.code.setErrors({ rateLimitExceeded: true });
          this.form.controls.code.markAsTouched();
          this.startCountdown();
        } else {
          this.serverDownError.set(true);
        }
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.controls.email.getRawValue();
    const code = this.form.controls.code.getRawValue();

    this.serverDownError.set(false);

    this.auth.verify({ email, code }).subscribe({
      next: (res) => {
        this.auth.setTokensFromResponse(res);
        
        const pendingReg = this.auth.pendingRegistration();
        if (pendingReg) {
          if (pendingReg.firstName) localStorage.setItem('vipo_user_firstName', pendingReg.firstName);
          if (pendingReg.lastName) localStorage.setItem('vipo_user_lastName', pendingReg.lastName);
          if (pendingReg.email) localStorage.setItem('vipo_user_email', pendingReg.email);
        }
        
        this.auth.pendingEmail.set(null);
        this.auth.pendingRegistration.set(null);

        this.auth.loadMe().subscribe({
          next: () => {
            this.snackbar.success(SNACKBAR_MESSAGES.REGISTER_SUCCESS);
            this.router.navigateByUrl('/landing');
          },
          error: () => {
            this.snackbar.success(SNACKBAR_MESSAGES.REGISTER_SUCCESS);
            this.router.navigateByUrl('/landing');
          },
        });
      },
      error: (err) => {
        if (err?.status === 0 || err?.status === 500) {
          this.serverDownError.set(true);
        } else if (err?.status === 410) {
          this.form.controls.code.setErrors({ codeExpired: true });
          this.form.controls.code.markAsTouched();
        } else if (err?.status === 401) {
          this.form.controls.code.setErrors({ incorrectCode: true });
          this.form.controls.code.markAsTouched();
        } else if (err?.status === 429) {
          this.form.controls.code.setErrors({ rateLimitExceeded: true });
          this.form.controls.code.markAsTouched();
          this.startCountdown();
        } else {
          this.form.controls.code.setErrors({ verificationFailed: true });
          this.form.controls.code.markAsTouched();
        }
      },
    });

    
  }
}
