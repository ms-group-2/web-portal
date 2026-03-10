import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { AuthService } from 'lib/services/identity/auth.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';

@Component({
  selector: 'vipo-forgot-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  translation = inject(TranslationService);

  isSending = signal(false);
  sentMessage = signal<string | null>(null);
  serverDownError = signal(false);

  form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email, emptySpaceValidator()]),
  });

  ngOnInit(): void {
    this.translation.loadModule('auth').subscribe();
    this.translation.loadModule('validation').subscribe();
  }

  showError(): boolean {
    const c = this.form.controls.email;
    return c.invalid && (c.touched || c.dirty);
  }

  getError(): string {
    const errors = this.form.controls.email.errors;
    if (!errors) return '';
    const key = Object.keys(errors)[0];
    return `validation.${key}`;
  }

  isGeorgian(): boolean {
    return this.translation.isGeorgian();
  }

  toggleLanguage(): void {
    this.translation.toggleLanguage();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email } = this.form.getRawValue();
    this.isSending.set(true);
    this.sentMessage.set(null);
    this.serverDownError.set(false);

    this.auth.forgotPassword(email).subscribe({
      next: (res) => {
        this.isSending.set(false);
        this.sentMessage.set(this.translation.translate('auth.forgotPassword.resetSentMessage'));

        this.auth.pendingPasswordReset.set(email);

        const resetToken = (res as any).reset_token;
        if (resetToken) {
          this.router.navigate(['/auth/reset-password'], {
            queryParams: { email, reset_token: resetToken },
          });
        } else {
          this.router.navigate(['/auth/reset-password'], { queryParams: { email } });
        }
      },
      error: (err) => {
        this.isSending.set(false);

        if (err?.status === 404) {
          this.form.controls.email.setErrors({ userNotFound: true });
          this.form.controls.email.markAsTouched();
        } else if (err?.status === 429) {
          this.form.controls.email.setErrors({ rateLimitExceeded: true });
          this.form.controls.email.markAsTouched();
        } else {
          this.serverDownError.set(true);
        }
      },
    });
  }

  back(): void {
    this.router.navigateByUrl('/auth/sign-in');
  }
}