import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { VerificationDialogComponent } from './verification-dialog';

@Injectable({
  providedIn: 'root'
})
export class VerificationDialogService {
  private dialog = inject(MatDialog);

  open(): Observable<string | undefined> {
    const dialogRef = this.dialog.open(VerificationDialogComponent, {
      width: '480px',
      maxWidth: '90vw',
      panelClass: 'modern-dialog',
      disableClose: false,
      autoFocus: true,
    });

    return dialogRef.afterClosed();
  }
}
