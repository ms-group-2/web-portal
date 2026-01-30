import { Component, inject, signal } from '@angular/core';
import { FormArray, FormControl } from '@angular/forms';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { formInputErrors } from 'lib/constants/enums/form-input-errors.enum';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { AuthService } from 'lib/services/identity/auth.service';

@Component({
  standalone: true,
  selector: 'vipo-verify',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './verify.html',
})
export class Verify {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ERRORS: Record<string, string> = formInputErrors;

  isResending = signal(false);
  resentMessage = signal<string | null>(null);

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
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    const emailFromSignal = this.auth.pendingEmail();

    const email = emailFromQuery ?? emailFromSignal;

    if (!email) {
      this.router.navigateByUrl('/auth/register');
      return;
    }

    this.form.controls.email.setValue(email);
    this.auth.pendingEmail.set(email);
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

  getError(controlName: keyof typeof this.form.controls): string | null {
    const errors = this.form.controls[controlName].errors;
    if (!errors) return null;

    const key = Object.keys(errors)[0];
    return this.ERRORS[key] ?? null;
  }
  resend(): void {
    console.log('RESEND CLICKED');
  const email = this.form.controls.email.getRawValue();

  if (!email) return;

  this.isResending.set(true);
  this.resentMessage.set(null);

  this.auth.resendVerification(email).subscribe({
    next: (res) => {
      this.resentMessage.set('კოდი ხელახლა გაიგზავნა ელფოსტაზე');
      this.isResending.set(false);
    },
    error: () => {
      this.form.controls.code.setErrors({ serverDown: true });
      this.isResending.set(false);
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

    this.auth.verify({ email, code }).subscribe({
      next: (res) => {
        this.auth.setTokensFromResponse(res);
        this.auth.pendingEmail.set(null);

        this.router.navigateByUrl('/landing');
      },
      error: (err) => {
        if (err?.status === 0) {
          this.form.controls.code.setErrors({ serverDown: true });
        } else {
          this.form.controls.code.setErrors({ verificationFailed: true });
        }
      },
    });
  }
}
