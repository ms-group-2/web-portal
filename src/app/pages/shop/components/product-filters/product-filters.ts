import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'src/lib/services/shop/shop.service';

@Component({
  selector: 'app-product-filters',
  imports: [MatIconModule, FormsModule, TranslatePipe],
  templateUrl: './product-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFiltersComponent {
  shopService = inject(ShopService);

  selectedCategoryId = this.shopService.selectedCategoryId;
  categories = this.shopService.mainCategories;

  sortBy = this.shopService.shopSortBy;
  minPrice = this.shopService.shopMinPrice;
  maxPrice = this.shopService.shopMaxPrice;
  maxPriceLimit = signal(10000);

  sortOptions = [
    { value: 'price_asc', label: 'shop.filters.sort.priceLow' },
    { value: 'price_desc', label: 'shop.filters.sort.priceHigh' },
    { value: 'popular', label: 'shop.filters.sort.default' },
  ];

  onCategoryChange(value: number | null) {
    this.shopService.selectCategory(value);
  }

  setSortBy(value: string) {
    this.shopService.shopSortBy.set(value);
  }

  onMinPriceChange(event: Event) {
    this.shopService.shopMinPrice.set(+(event.target as HTMLInputElement).value || 0);
  }

  onMaxPriceChange(event: Event) {
    this.shopService.shopMaxPrice.set(+(event.target as HTMLInputElement).value || 10000);
  }

  getPriceStep(): number {
  const max = this.maxPriceLimit();

  if (max <= 100) return 5;
  if (max <= 500) return 10;
  if (max <= 1000) return 25;
  if (max <= 5000) return 50;
  return 100;
}
}
