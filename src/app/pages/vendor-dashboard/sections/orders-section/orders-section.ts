import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-orders-section',
  imports: [TranslatePipe],
  templateUrl: './orders-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersSection {}
