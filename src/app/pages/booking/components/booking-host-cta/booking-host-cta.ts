import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';

@Component({
  selector: 'app-booking-host-cta',
  imports: [TranslatePipe, ScrollAnimateDirective],
  templateUrl: './booking-host-cta.html',
  styleUrl: './booking-host-cta.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingHostCta {}
