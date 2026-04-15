import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { BookingListing } from '../../booking.models';
import { BookingListingCard } from '../booking-listing-card/booking-listing-card';
import { BOOKING_LISTINGS } from '../../booking.mock-data';

@Component({
  selector: 'app-booking-listings-grid',
  imports: [TranslatePipe, BookingListingCard, ScrollAnimateDirective],
  templateUrl: './booking-listings-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingListingsGrid {
  selectedCategory = input<string>('booking.categories.all');

  private allListings = BOOKING_LISTINGS;
  favorites = signal<Set<string>>(new Set());

  filteredListings = computed(() => {
    const category = this.selectedCategory();
    if (category === 'booking.categories.all') {
      return this.allListings;
    }
    return this.allListings.filter(l => l.category === category);
  });

  isFavorite(id: string): boolean {
    return this.favorites().has(id);
  }

  toggleFavorite(id: string) {
    this.favorites.update(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }
}
