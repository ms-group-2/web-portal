import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { mustMatchField } from 'lib/validators/must-match-validator';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { formInputErrors } from 'lib/constants/enums/form-input-errors.enum';
import { AuthService } from 'lib/services/identity/auth.service';

@Component({
  standalone: true,
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

  ERRORS = formInputErrors;

  showPassword = signal(false);
  showConfirm = signal(false);

  token = signal<string | null>(null);

  form = this.fb.group({
    password: this.fb.control('', [Validators.required, Validators.minLength(6), emptySpaceValidator()]),
    confirmPassword: this.fb.control('', [Validators.required, mustMatchField('password')]),
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigateByUrl('/auth/sign-in');
      return;
    }
    this.token.set(token);
  }

  showError(controlName: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[controlName];
    return c.invalid && (c.touched || c.dirty);
  }

  getError(controlName: keyof typeof this.form.controls): string | null {
    const errors = this.form.controls[controlName].errors;
    if (!errors) return null;
    const key = Object.keys(errors)[0];
    return this.ERRORS[key] ?? null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.token();
    if (!token) return;

    const { password } = this.form.getRawValue();

    this.auth.resetPassword(token, password).subscribe({
      next: () => {
        this.router.navigateByUrl('/auth/sign-in');
      },
      error: () => {
        this.form.controls.password.setErrors({ serverDown: true });
      },
    });
  }
}