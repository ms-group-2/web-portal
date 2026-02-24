import { Component, inject, signal, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { passwordStrengthValidator, edgeSpacesValidator } from 'lib/validators/password-strength.validator';
import { mustMatchField } from 'lib/validators/must-match-validator';
import { mustNotMatchField } from 'lib/validators/must-not-match-validator';
import { sanitizePasswordInput } from 'lib/utils/input-sanitizers.util';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';

export interface ChangePasswordDialogData {
}

export interface ChangePasswordResult {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-change-password-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './change-password-dialog.html',
  styleUrl: './change-password-dialog.scss',
})
export class ChangePasswordDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  data = inject<ChangePasswordDialogData>(MAT_DIALOG_DATA, { optional: true });
  private fb = inject(NonNullableFormBuilder);
  private translation = inject(TranslationService);

  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  form = this.fb.group({
    currentPassword: this.fb.control('', [Validators.required, Validators.maxLength(128)]),
    newPassword: this.fb.control('', [Validators.required, Validators.maxLength(128), passwordStrengthValidator(), edgeSpacesValidator(), mustNotMatchField('currentPassword')]),
    confirmPassword: this.fb.control('', [Validators.required, Validators.maxLength(128), mustMatchField('newPassword')]),
  });

  ngOnInit(): void {
    this.translation.loadModule('profile').subscribe();

    const currentPasswordControl = this.form.controls.currentPassword;
    const newPasswordControl = this.form.controls.newPassword;
    const confirmControl = this.form.controls.confirmPassword;

    currentPasswordControl.valueChanges.subscribe(() => {
      newPasswordControl.updateValueAndValidity();
    });

    newPasswordControl.valueChanges.subscribe(() => {
      confirmControl.updateValueAndValidity();
    });
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.set(!this.showCurrentPassword());
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword.set(!this.showNewPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  onPasswordInput(event: Event, controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): void {
    sanitizePasswordInput(event, this.form.controls[controlName]);
  }

  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  getError(controlName: keyof typeof this.form.controls): string | null {
    const errors = this.form.controls[controlName].errors as Record<string, any> | null;
    if (!errors) return null;

    const key = Object.keys(errors)[0];

    if (key === 'passwordStrength') {
      const strengthErrors = errors['passwordStrength'];
      const errorKeys = Object.keys(strengthErrors);
      if (errorKeys.length > 0) {
        return this.translation.translate(`validation.passwordStrength${errorKeys[0].charAt(0).toUpperCase() + errorKeys[0].slice(1)}`);
      }
      return null;
    }

    if (key === 'minlength') {
      const required = errors['minlength'].requiredLength;
      return this.translation.translate('validation.minlength').replace('{n}', String(required));
    }

    if (key === 'maxlength') {
      const required = errors['maxlength'].requiredLength;
      return this.translation.translate('validation.maxlength').replace('{n}', String(required));
    }

    return this.translation.translate(`validation.${key}`);
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const result: ChangePasswordResult = {
      currentPassword: this.form.controls.currentPassword.value,
      newPassword: this.form.controls.newPassword.value,
      confirmPassword: this.form.controls.confirmPassword.value,
    };

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
