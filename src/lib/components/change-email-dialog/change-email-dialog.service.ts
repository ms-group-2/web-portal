import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ChangeEmailDialogComponent } from './change-email-dialog';
import { ChangeEmailDialogData, ChangeEmailDialogResult } from './models/change-email-dialog.model';

@Injectable({
  providedIn: 'root',
})
export class ChangeEmailDialogService {
  private dialog = inject(MatDialog);

  open(data: ChangeEmailDialogData): Observable<ChangeEmailDialogResult | null> {
    const dialogRef = this.dialog.open(ChangeEmailDialogComponent, {
      width: '520px',
      data,
      panelClass: 'change-email-dialog',
      hasBackdrop: true,
      disableClose: false,
    });

    return dialogRef.afterClosed();
  }
}
