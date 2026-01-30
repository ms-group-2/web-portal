import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { formInputErrors } from 'lib/constants/enums/form-input-errors.enum';
import { AuthService } from 'lib/services/identity/auth.service';

@Component({
  standalone: true,
  selector: 'vipo-forgot-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  ERRORS = formInputErrors;

  isSending = signal(false);
  sentMessage = signal<string | null>(null);

  form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email, emptySpaceValidator()]),
  });

  showError(): boolean {
    const c = this.form.controls.email;
    return c.invalid && (c.touched || c.dirty);
  }

  getError(): string | null {
    const errors = this.form.controls.email.errors;
    if (!errors) return null;
    const key = Object.keys(errors)[0];
    return this.ERRORS[key] ?? null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;``
    }

    const { email } = this.form.getRawValue();
    this.isSending.set(true);
    this.sentMessage.set(null);

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.isSending.set(false);
        this.sentMessage.set('თუ ეს იმეილი არსებობს, reset ლინკი გაიგზავნა');
      },
      error: () => {
        this.isSending.set(false);
        this.form.controls.email.setErrors({ serverDown: true });
      },
    });
  }

  back(): void {
    this.router.navigateByUrl('/auth/sign-in');
  }
}