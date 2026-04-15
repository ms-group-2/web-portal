import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';

@Component({
  selector: 'app-promo-banners',
  imports: [TranslatePipe, ScrollAnimateDirective],
  templateUrl: './promo-banners.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoBannersComponent {}
