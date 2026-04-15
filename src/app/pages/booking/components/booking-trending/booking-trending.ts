import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { TiltDirective } from 'lib/directives/tilt.directive';
import { TRENDING_DESTINATIONS } from '../../booking.mock-data';

@Component({
  selector: 'app-booking-trending',
  imports: [MatIconModule, TranslatePipe, ScrollAnimateDirective, TiltDirective],
  templateUrl: './booking-trending.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingTrending {
  destinations = TRENDING_DESTINATIONS;
}
