import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  signal,
  computed,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import {
  BookingProviderApiService,
  BookingCatalogApiService,
  ProviderProfileResponse,
  CategoryResponse,
} from 'lib/services/booking';
import { BookingListing } from '../../booking.models';
import { BookingListingCard } from '../booking-listing-card/booking-listing-card';
import { BOOKING_LISTINGS } from '../../booking.mock-data';

@Component({
  selector: 'app-booking-listings-grid',
  imports: [TranslatePipe, BookingListingCard, ScrollAnimateDirective],
  templateUrl: './booking-listings-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingListingsGrid implements OnInit {
  private providerApi = inject(BookingProviderApiService);
  private catalogApi = inject(BookingCatalogApiService);
  private destroyRef = inject(DestroyRef);

  selectedCategory = input<string>('booking.categories.all');

  private providers = signal<BookingListing[]>([]);
  private categories = signal<CategoryResponse[]>([]);
  isLoading = signal(true);
  favorites = signal<Set<string>>(new Set());

  filteredListings = computed(() => {
    const all = this.providers();
    const category = this.selectedCategory();
    if (category === 'booking.categories.all') return all;
    return all.filter(l => l.category === category);
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProviders();
  }

  isFavorite(id: string): boolean {
    return this.favorites().has(id);
  }

  toggleFavorite(id: string): void {
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

  private loadCategories(): void {
    this.catalogApi
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cats => this.categories.set(cats));
  }

  private loadProviders(): void {
    this.providerApi
      .getProviders(0, 50)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (providersList) => {
          if (providersList.length > 0) {
            this.providers.set(this.mapProvidersToListings(providersList));
          } else {
            this.providers.set(BOOKING_LISTINGS);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.providers.set(BOOKING_LISTINGS);
          this.isLoading.set(false);
        },
      });
  }

  private mapProvidersToListings(providersList: ProviderProfileResponse[]): BookingListing[] {
    return providersList
      .filter(p => p.activity_status === 'ACTIVE')
      .map(provider => {
        const category = this.categories().find(c => c.id === provider.category_id);
        const categoryKey = this.mapCategoryToKey(category?.name);

        return {
          id: provider.id,
          title: provider.name,
          images: provider.photo_url ? [provider.photo_url] : ['assets/images/placeholder-business.jpg'],
          category: categoryKey,
          rating: 0,
          reviewCount: 0,
          location: '',
          price: 0,
          priceUnit: 'per session',
          host: provider.name,
          verified: true,
          instantBook: provider.call_type !== 'OUTCALL',
        };
      });
  }

  private mapCategoryToKey(categoryName?: string): string {
    if (!categoryName) return 'booking.categories.all';
    const lower = categoryName.toLowerCase();
    if (lower.includes('restaurant') || lower.includes('რესტორან')) return 'booking.categories.restaurants';
    if (lower.includes('hotel') || lower.includes('სასტუმრო')) return 'booking.categories.hotels';
    if (lower.includes('gaming') || lower.includes('გეიმინგ')) return 'booking.categories.gaming';
    if (lower.includes('cafe') || lower.includes('კაფე')) return 'booking.categories.cafes';
    if (lower.includes('gym') || lower.includes('fitness') || lower.includes('სპორტ')) return 'booking.categories.gyms';
    if (lower.includes('beauty') || lower.includes('spa') || lower.includes('სილამაზე')) return 'booking.categories.beauty';
    return 'booking.categories.all';
  }
}
