import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { formInputErrors } from 'lib/constants/enums/form-input-errors.enum';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { edgeSpacesValidator } from 'lib/validators/password-strength.validator';
import { AuthService } from 'lib/services/identity/auth.service';

@Component({
  standalone: true,
  selector: 'vipo-sign-in',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './sign-in.html',
})
export class SignIn {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  ERRORS = formInputErrors;

  showPassword = signal(false);

  form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email, emptySpaceValidator()]),
    password: this.fb.control('', [Validators.required, edgeSpacesValidator()]),
  });

  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getError(controlName: keyof typeof this.form.controls): string | null {
    const errors = this.form.controls[controlName].errors;
    if (!errors) return null;

    const key = Object.keys(errors)[0];
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

  const { email, password } = this.form.getRawValue();

  this.auth.login(email, password).subscribe({
    next: (res) => {
      this.auth.setTokensFromResponse(res);
      this.router.navigateByUrl('/landing');
    },
    error: (err) => {

      if (err?.status === 0 || err?.status === 404) {
        this.form.controls.email.setErrors({ serverDown: true });
        return;
      }

      if (err?.status === 401) {
        const message = err?.error?.detail?.toLowerCase() ?? '';

        if (message.includes('not verified')) {
          this.form.controls.email.setErrors({ notVerified: true });
        } else {
          this.form.controls.email.setErrors({ invalidCredentials: true });
        }
        return;
      }

      this.form.controls.email.setErrors({ invalidCredentials: true });
    },
  });
  
  }
}
