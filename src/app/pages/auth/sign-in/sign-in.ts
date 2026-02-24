import { Component, OnInit, inject, signal} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { edgeSpacesValidator } from 'lib/validators/password-strength.validator';
import { AuthService } from 'lib/services/identity/auth.service';
import { SNACKBAR_MESSAGES } from 'lib/constants/enums/snackbar-messages.enum';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';

@Component({
  selector: 'vipo-sign-in',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './sign-in.html',
})
export class SignIn implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  translation = inject(TranslationService);

  showPassword = signal(false);
  serverDownError = signal(false);
  invalidCredentialsError = signal(false);
  userNotFoundError = signal(false);

  errorSignals = [
    { signal: this.serverDownError, translationKey: 'validation.serverDown' },
    { signal: this.invalidCredentialsError, translationKey: 'validation.invalidCredentials' },
    { signal: this.userNotFoundError, translationKey: 'validation.userNotFound' },
  ];

  form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email, emptySpaceValidator()]),
    password: this.fb.control('', [Validators.required, edgeSpacesValidator()]),
  });

  ngOnInit(): void {
    this.translation.loadModule('auth').subscribe();
    this.translation.loadModule('validation').subscribe();
  }

  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getError(controlName: keyof typeof this.form.controls): string {
    const errors = this.form.controls[controlName].errors;
    if (!errors) return '';

    const key = Object.keys(errors)[0];
    return `validation.${key}`;
  }


  onGoogle(): void {
      this.auth.googleLoginRedirect();
    }

  submit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const { email, password } = this.form.getRawValue();
  this.serverDownError.set(false);
  this.invalidCredentialsError.set(false);
  this.userNotFoundError.set(false);

  this.auth.login(email, password).subscribe({
    next: (res) => {
      this.auth.setTokensFromResponse(res);
      this.auth.loadMe().subscribe({
        next: () => {
          this.router.navigateByUrl('/landing');
          this.snackbar.success(SNACKBAR_MESSAGES.LOGIN_SUCCESS);
        },
        error: () => {
          this.router.navigateByUrl('/landing');
          this.snackbar.success(SNACKBAR_MESSAGES.LOGIN_SUCCESS);
        },
      });
    },
    error: (err) => {

      if (err?.status === 404) {
        this.userNotFoundError.set(true);
        return;
      }

      if (err?.status === 401) {
        const message = err?.error?.detail?.toLowerCase() ?? '';

        if (message.includes('not verified')) {
          this.form.controls.email.setErrors({ notVerified: true });
        } else {
          this.invalidCredentialsError.set(true);
        }
        return;
      }

      this.invalidCredentialsError.set(true);
    },
  });

  }
}
