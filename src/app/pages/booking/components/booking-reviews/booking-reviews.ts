import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { TiltDirective } from 'lib/directives/tilt.directive';
import { GUEST_REVIEWS } from '../../booking.mock-data';

@Component({
  selector: 'app-booking-reviews',
  imports: [MatIconModule, TranslatePipe, ScrollAnimateDirective, TiltDirective],
  templateUrl: './booking-reviews.html',
  styleUrl: './booking-reviews.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingReviews {
  reviews = GUEST_REVIEWS;
}
