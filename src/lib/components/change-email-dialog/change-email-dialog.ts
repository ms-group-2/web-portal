import { Component, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { AuthService } from 'lib/services/identity/auth.service';
import { ChangeEmailDialogData } from './models/change-email-dialog.model';

@Component({
  selector: 'app-change-email-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    NgClass,
    TranslatePipe,
  ],
  templateUrl: './change-email-dialog.html',
  styleUrl: './change-email-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeEmailDialogComponent implements OnDestroy {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private translation = inject(TranslationService);
  private dialogRef = inject(MatDialogRef<ChangeEmailDialogComponent>);
  data = inject<ChangeEmailDialogData>(MAT_DIALOG_DATA);

  isSubmitting = signal(false);
  isResending = signal(false);
  serverDownError = signal(false);
  resentMessage = signal<string | null>(null);
  resendCountdown = signal<number>(0);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  form = this.fb.group({
    email: this.fb.control({ value: this.data.newEmail, disabled: true }, [
      Validators.required,
      Validators.email,
    ]),
    code: this.fb.control('', [
      Validators.required,
      Validators.minLength(4),
      emptySpaceValidator(),
    ]),
    codeDigits: this.fb.array<FormControl<string>>(
      Array.from({ length: 4 }, () => this.fb.control('', [Validators.required]))
    ),
  });

  constructor() {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  get codeArray(): FormControl<string>[] {
    return (this.form.get('codeDigits') as FormArray<FormControl<string>>).controls;
  }

  get canResend(): boolean {
    return this.resendCountdown() === 0 && !this.isResending();
  }

  get formattedCountdown(): string {
    const seconds = this.resendCountdown();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  showError(): boolean {
    const control = this.form.controls.code;
    return control.invalid && (control.touched || control.dirty);
  }

  getError(): string {
    const errors = this.form.controls.code.errors;
    if (!errors) return '';

    const key = Object.keys(errors)[0];
    const translationKey = `validation.${key}`;
    if (key === 'minlength' && errors[key]?.requiredLength) {
      return this.translation.translate(translationKey, { n: errors[key].requiredLength });
    }
    return this.translation.translate(translationKey);
  }

  resend(): void {
    if (!this.canResend) return;

    const email = this.data.newEmail;
    this.isResending.set(true);
    this.serverDownError.set(false);
    this.resentMessage.set(null);
    this.form.controls.code.setErrors(null);

    this.auth.requestChangeEmail(email).subscribe({
      next: () => {
        this.isResending.set(false);
        this.resentMessage.set(this.translation.translate('profile.emailChange.codeResent'));
        this.startCountdown();
        setTimeout(() => this.resentMessage.set(null), 3000);
      },
      error: (err) => {
        this.isResending.set(false);
        if (err?.status === 429) {
          this.form.controls.code.setErrors({ rateLimitExceeded: true });
          this.form.controls.code.markAsTouched();
          this.startCountdown();
          return;
        }
        this.serverDownError.set(true);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverDownError.set(false);
    const email = this.data.newEmail;
    const code = this.form.controls.code.getRawValue();

    this.auth.verifyChangeEmail({ new_email: email, code }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.dialogRef.close({ email });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err?.status === 400) {
          this.form.controls.code.setErrors({ incorrectCode: true });
        } else if (err?.status === 410) {
          this.form.controls.code.setErrors({ codeExpired: true });
        } else if (err?.status === 409) {
          this.form.controls.code.setErrors({ alreadyRegistered: true });
        } else if (err?.status === 429) {
          this.form.controls.code.setErrors({ rateLimitExceeded: true });
          this.startCountdown();
        } else if (err?.status === 0 || err?.status >= 500) {
          this.serverDownError.set(true);
        } else {
          this.form.controls.code.setErrors({ verificationFailed: true });
        }
        this.form.controls.code.markAsTouched();
      },
    });
  }

  close(): void {
    this.dialogRef.close(null);
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
}
