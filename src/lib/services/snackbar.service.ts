import { Injectable, inject, Component, Inject } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA,
} from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarType } from '../constants/enums/snackbar-messages.enum';

@Component({
  selector: 'app-custom-snackbar',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <span class="example-pizza-party" matSnackBarLabel>
      {{ data.text }}
    </span>
    <span matSnackBarActions>
      <button mat-button matSnackBarAction (click)="snackBarRef.dismissWithAction()">
        <mat-icon class="text-white ">
          {{ data.closeIcon }}
        </mat-icon>
      </button>
    </span>
  `,
})
export class CustomSnackbarComponent {
  snackBarRef = inject(MatSnackBarRef);

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: { text: string; closeIcon: string }) {}
}

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private _snackBar = inject(MatSnackBar);

  show(
    text: string,
    type: SnackbarType = SnackbarType.INFO,
    closeIcon: string = 'close',
    horizontalPosition: MatSnackBarHorizontalPosition = 'center',
    verticalPosition: MatSnackBarVerticalPosition = 'bottom'
  ) {
    this._snackBar.openFromComponent(CustomSnackbarComponent, {
      horizontalPosition,
      verticalPosition,
      duration: 3000,
      panelClass: [`${type}-snackbar`, 'custom-snackbar'],
      data: { text, closeIcon },
    });
  }

  success(text: string, closeIcon: string = 'close') {
    this.show(text, SnackbarType.SUCCESS, closeIcon);
  }

  error(text: string, closeIcon: string = 'close') {
    this.show(text, SnackbarType.ERROR, closeIcon);
  }

  info(text: string, closeIcon: string = 'close') {
    this.show(text, SnackbarType.INFO, closeIcon);
  }
}
