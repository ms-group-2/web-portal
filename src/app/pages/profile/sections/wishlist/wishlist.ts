import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-wishlist',
  imports: [ RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './wishlist.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistComponent {}

