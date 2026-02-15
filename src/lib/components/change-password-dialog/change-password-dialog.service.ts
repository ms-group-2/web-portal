import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ChangePasswordDialogComponent, ChangePasswordDialogData, ChangePasswordResult } from './change-password-dialog';

@Injectable({
  providedIn: 'root',
})
export class ChangePasswordDialogService {
  private dialog = inject(MatDialog);

  open(data?: ChangePasswordDialogData): Observable<ChangePasswordResult | null> {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      data,
      panelClass: 'change-password-dialog',
      hasBackdrop: true,
      disableClose: false,
    });

    return dialogRef.afterClosed();
  }
}
