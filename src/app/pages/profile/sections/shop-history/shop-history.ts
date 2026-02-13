import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-shop-history',
  imports: [ RouterModule, MatIconModule],
  templateUrl: './shop-history.html',
  styleUrl: './shop-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopHistoryComponent {}

