import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-promo-banners',
  imports: [ TranslatePipe],
  templateUrl: './promo-banners.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoBannersComponent {}
