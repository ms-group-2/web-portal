import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-promo-banners',
  imports: [CommonModule],
  templateUrl: './promo-banners.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoBannersComponent {}
