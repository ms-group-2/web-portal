import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { BOOKING_FEATURES } from '../../booking.mock-data';

@Component({
  selector: 'app-booking-features',
  imports: [MatIconModule, TranslatePipe, ScrollAnimateDirective],
  templateUrl: './booking-features.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingFeatures {
  features = BOOKING_FEATURES;
}
