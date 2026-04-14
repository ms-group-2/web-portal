import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { FilterBrand } from 'src/app/pages/shop/shop.models';

@Component({
  selector: 'app-brand-filter-list',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (brands().length > 0) {
      <div class="text-sm font-black text-gray-900 uppercase tracking-wide mb-3">Brands</div>
      <div class="space-y-1 max-h-48 overflow-y-auto">
        @for (brand of brands(); track brand.brand_id) {
          <label
            class="flex items-center gap-2 px-1 py-1.5 rounded text-xs"
            [ngClass]="brand.product_count > 0 ? 'cursor-pointer hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'">
            <input
              type="checkbox"
              [disabled]="brand.product_count === 0"
              [checked]="isSelected(brand.brand_id)"
              (change)="brandToggled.emit(brand.brand_id)"
              class="w-3.5 h-3.5 text-market bg-gray-100 border-gray-300 rounded focus:ring-market flex-shrink-0"
            />
            <span class="text-gray-700 leading-tight">
              {{ brand.brand_name }} ({{ brand.product_count }})
            </span>
          </label>
        }
      </div>
    }
  `,
})
export class BrandFilterList {
  readonly brands = input.required<FilterBrand[]>();
  readonly selectedIds = input<number[]>([]);

  readonly brandToggled = output<number>();

  isSelected(brandId: number): boolean {
    return this.selectedIds().includes(brandId);
  }
}
