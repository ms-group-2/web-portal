import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

export interface DeleteConfirmationDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  imports: [MatDialogModule, TranslatePipe],
  templateUrl: './delete-confirmation-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmationDialog {
  dialogRef = inject(MatDialogRef<DeleteConfirmationDialog>);
  data = inject<DeleteConfirmationDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  onConfirm() {
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
