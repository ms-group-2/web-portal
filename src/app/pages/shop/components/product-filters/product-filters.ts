import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-filters',
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './product-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFiltersComponent {
  verifiedOnly = signal(false);
  selectedCategory = signal('all');
  selectedPriceRange = signal('all');
  selectedRating = signal('all');
  sortBy = signal('recommended');

  toggleVerified() {
    this.verifiedOnly.update(value => !value);
  }
}
