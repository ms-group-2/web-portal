import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'src/lib/services/shop/shop.service';
import { ShopSearchService } from 'src/lib/services/shop/shop-search.service';
import { BottomSheet } from 'lib/components/bottom-sheet/bottom-sheet';
import { MobileFilterBar } from 'lib/components/mobile-filter-bar/mobile-filter-bar';
import { SortBottomSheet } from 'lib/components/sort-bottom-sheet/sort-bottom-sheet';
import { SortOptionsList } from 'lib/components/sort-options-list/sort-options-list';
import { PriceRangeFilter } from 'lib/components/price-range-filter/price-range-filter';

@Component({
  selector: 'app-product-filters',
  imports: [MatIcon, TranslatePipe, BottomSheet, MobileFilterBar, SortBottomSheet, SortOptionsList, PriceRangeFilter],
  templateUrl: './product-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFiltersComponent {
  readonly shopService = inject(ShopService);
  private searchService = inject(ShopSearchService);

  selectedCategoryId = this.shopService.selectedCategoryId;
  categories = this.shopService.mainCategories;

  sortBy = this.shopService.shopSortBy;
  minPrice = this.shopService.shopMinPrice;
  maxPrice = this.shopService.shopMaxPrice;
  maxPriceLimit = this.shopService.dynamicMaxPrice;

  /** Empty string when no user filter (max at ceiling) → input shows placeholder instead. */
  displayMaxPrice = computed(() => {
    const m = this.maxPrice();
    return m >= this.maxPriceLimit() ? '' : m;
  });

  totalItems = this.searchService.searchResultsCount;

  showMobileFilters = signal(false);
  showMobileSorting = signal(false);

  sortOptions = [
    { value: 'price_asc', label: 'shop.filters.sort.priceLow' },
    { value: 'price_desc', label: 'shop.filters.sort.priceHigh' },
    { value: 'popular', label: 'shop.filters.sort.default' },
  ];

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.sortBy() && this.sortBy() !== 'popular') count++;
    if (this.minPrice() > 0 || this.maxPrice() < this.maxPriceLimit()) count++;
    return count;
  });

  setSortBy(value: string) {
    this.shopService.shopSortBy.set(value);
  }

  /** Min 0, max = highest price in current results (`dynamicMaxPrice`), or default until data loads. */
  resetPriceFilters(): void {
    this.shopService.shopMinPrice.set(0);
    const cap = this.shopService.dynamicMaxPrice();
    this.shopService.shopMaxPrice.set(cap > 0 ? cap : 10000);
  }

  onMinPriceChange(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    this.shopService.shopMinPrice.set(this.parseMinPrice(raw));
  }

  onMaxPriceChange(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    this.shopService.shopMaxPrice.set(this.parseMaxPrice(raw));
  }

  private parseMinPrice(raw: string): number {
    const limit = this.shopService.dynamicMaxPrice();
    const trimmed = raw.trim();
    if (trimmed === '') return 0;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, limit);
  }

  private parseMaxPrice(raw: string): number {
    const limit = this.shopService.dynamicMaxPrice();
    const trimmed = raw.trim();
    if (trimmed === '') return limit;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n <= 0) return limit;
    return n;
  }
}
