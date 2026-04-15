import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TiltDirective } from 'lib/directives/tilt.directive';
import { BookingListing } from '../../booking.models';

@Component({
  selector: 'app-booking-listing-card',
  imports: [MatIconModule, TiltDirective],
  templateUrl: './booking-listing-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingListingCard {
  listing = input.required<BookingListing>();
  isFavorite = input(false);

  favoriteToggle = output<string>();

  onFavoriteClick(event: Event) {
    event.stopPropagation();
    this.favoriteToggle.emit(this.listing().id);
  }
}
