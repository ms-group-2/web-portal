import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-verification-dialog',
  imports: [
    CommonModule,
    // ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    // MatInputModule,
    // MatFormFieldModule,
    TranslatePipe,
  ],
  templateUrl: './verification-dialog.html',
  styleUrl: './verification-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationDialogComponent {
  private dialogRef = inject(MatDialogRef<VerificationDialogComponent>);
  // private fb = inject(NonNullableFormBuilder);

  isSubmitting = signal(false);

  // form = this.fb.group({
  //   firstName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
  //   lastName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
  //   idNumber: this.fb.control('', [Validators.required, Validators.minLength(9), Validators.maxLength(11)]),
  // });

  close(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.dialogRef.close({ confirmed: true });
  }

  // submit(): void {
  //   if (this.form.invalid) {
  //     this.form.markAllAsTouched();
  //     return;
  //   }
  //
  //   this.isSubmitting.set(true);
  //
  //   //mocking API call with timeout
  //   setTimeout(() => {
  //     this.isSubmitting.set(false);
  //     this.dialogRef.close(this.form.value);
  //   }, 1500);
  // }
}
