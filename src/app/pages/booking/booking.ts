import { Component, ChangeDetectionStrategy, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { TranslationService } from 'lib/services/translation.service';
import { BookingHero } from './components/booking-hero/booking-hero';
import { BookingTrending } from './components/booking-trending/booking-trending';
import { BookingCategoryBar } from './components/booking-category-bar/booking-category-bar';
import { BookingListingsGrid } from './components/booking-listings-grid/booking-listings-grid';
import { BookingFeaturedHosts } from './components/booking-featured-hosts/booking-featured-hosts';
import { BookingReviews } from './components/booking-reviews/booking-reviews';
import { BookingFeatures } from './components/booking-features/booking-features';
import { BookingHostCta } from './components/booking-host-cta/booking-host-cta';

@Component({
  selector: 'app-booking',
  imports: [
    Header,
    Footer,
    BookingHero,
    BookingTrending,
    BookingCategoryBar,
    BookingListingsGrid,
    BookingFeaturedHosts,
    BookingReviews,
    BookingFeatures,
    BookingHostCta,
  ],
  templateUrl: './booking.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Booking implements OnInit {
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  selectedCategory = signal('booking.categories.all');

  ngOnInit() {
    this.translation.loadModule('booking')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onSearch(event: { query: string; location: string }) {
    console.log('Search:', event);
  }

}
