import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Category } from 'src/app/pages/shop/shop.models';
import { CategoryMenu } from '../category-dialog/category-dialog';


@Injectable({ providedIn: 'root' })
export class CategoryTreeDialogService {
  private dialog = inject(MatDialog);

  open(): Observable<Category | null> {
    const dialogRef = this.dialog.open(CategoryMenu, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      panelClass: 'category-tree-dialog',
      hasBackdrop: true,
      disableClose: false,
    });

    return dialogRef.afterClosed();
  }
}
