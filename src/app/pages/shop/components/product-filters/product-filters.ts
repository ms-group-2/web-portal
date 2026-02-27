import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'src/lib/services/shop/shop.service';

@Component({
  selector: 'app-product-filters',
  imports: [CommonModule, MatIconModule, FormsModule, TranslatePipe],
  templateUrl: './product-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFiltersComponent {
  private shopService = inject(ShopService);

  verifiedOnly = signal(false);
  selectedPriceRange = signal('all');
  selectedRating = signal('all');
  sortBy = signal('recommended');

  // Sync with ShopService category selection
  selectedCategoryId = this.shopService.selectedCategoryId;

  // Get main categories for the dropdown
  categories = this.shopService.mainCategories;

  toggleVerified() {
    this.verifiedOnly.update(value => !value);
  }

  onCategoryChange(value: number | null) {
    this.shopService.selectCategory(value);
  }
}
