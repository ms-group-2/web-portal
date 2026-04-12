import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal, computed, OnInit, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MatSlider, MatSliderRangeThumb } from '@angular/material/slider';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'lib/services/shop/shop.service';
import { ShopSearchService } from 'lib/services/shop/shop-search.service';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-search-filters-sidebar',
  imports: [FormsModule, NgClass, MatSlider, MatSliderRangeThumb, TranslatePipe, RouterLink],
  templateUrl: './search-filters-sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFiltersSidebarComponent implements OnInit {
  private shopService = inject(ShopService);
  private searchService = inject(ShopSearchService);
  private destroyRef = inject(DestroyRef);

  filtersLoading = signal(true);

  filterGroups = computed(() => this.searchService.searchFilterGroups());
  brands = computed(() => this.searchService.searchBrands());
  selectedSearchFilters = computed(() => this.searchService.selectedSearchFilters());
  selectedBrandIds = computed(() => this.searchService.selectedBrandIds());

  sortBy = this.shopService.shopSortBy;
  minPrice = this.shopService.shopMinPrice;
  maxPrice = this.shopService.shopMaxPrice;
  dynamicMaxPrice = this.shopService.dynamicMaxPrice;

  // Accordion state (fields).
  expandedFields = signal<Set<number>>(new Set());

  sortOptions = [
    { value: 'price_asc', label: 'shop.filters.sort.priceLow' },
    { value: 'price_desc', label: 'shop.filters.sort.priceHigh' },
    { value: 'popular', label: 'shop.filters.sort.default' },
  ];

  categoryName = computed(() => this.shopService.selectedCategory()?.name || '');

  private loadedFor: number | null = null;

  constructor() {
    // Update max price when dynamic max changes
    effect(() => {
      const newMax = this.dynamicMaxPrice();
      if (this.maxPrice() > newMax) {
        this.maxPrice.set(newMax);
      }
    });

    // Search page: derive a category_id from the first visible search product.
    // This avoids 404s and lets the sidebar show checkbox filters.
    effect(() => {
      const categoryId = this.shopService.selectedCategoryId();
      if (categoryId != null) return; // Only run on search page

      const derived = this.searchService.searchDerivedCategoryId();
      if (derived == null) {
        this.filtersLoading.set(false);
        return;
      }
      if (this.loadedFor === derived) return;
      this.loadedFor = derived;

      // Ensure the category tree contains the derived id, otherwise we
      // can't resolve category/subcategory names for the "კატეგორიები" block.
      this.ensureCategoryNameLoadedForDerivedId(derived);

      this.loadForCategory(derived);
    });

    // Re-fetch sidebar options when active filters change so counts stay accurate.
    effect(() => {
      const categoryId = this.shopService.selectedCategoryId() ?? this.searchService.searchDerivedCategoryId();
      if (categoryId == null) return;

      this.shopService.shopMinPrice();
      this.shopService.shopMaxPrice();
      this.searchService.selectedBrandIds();
      this.searchService.selectedSearchFilters();

      this.loadForCategory(categoryId);
    });
  }

  ngOnInit(): void {
    // Load filter groups once when the sidebar mounts.
    this.filtersLoading.set(true);
    this.searchService.setSearchFilterGroups([]);

    const categoryId = this.shopService.selectedCategoryId();

    if (categoryId != null) {
      this.loadForCategory(categoryId);
      return;
    }
  }

  private loadForCategory(id: number): void {
    this.filtersLoading.set(true);
    const additionalParams: Record<string, string | number | boolean> = {
      ...this.searchService.getSelectedFilterQueryParams(),
      in_stock: true,
    };
    if (this.minPrice() > 0) additionalParams['min_price'] = this.minPrice();
    if (this.maxPrice() < this.dynamicMaxPrice()) additionalParams['max_price'] = this.maxPrice();

    this.shopService
      .getFilterOptions(id, additionalParams)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: payload => {
          this.searchService.setSearchFilterGroups(payload.filters);
          this.searchService.setSearchBrands(payload.brands);
          this.filtersLoading.set(false);
        },
        error: () => {
          this.searchService.setSearchFilterGroups([]);
          this.searchService.setSearchBrands([]);
          this.filtersLoading.set(false);
        },
      });
  }

  /**
   * Backend filter endpoint is keyed by a category_id, but the name resolution
   * (`shopService.flatCategories()`) only includes categories that we have already
   * loaded into the local cache. This ensures we load subcategories until the
   * derived category id is present (or we hit a small depth limit).
   */
  private ensureCategoryNameLoadedForDerivedId(targetId: number, roundsLeft: number = 5): void {
    if (roundsLeft <= 0) return;

    const flat = this.shopService.flatCategories();
    if (flat.some(c => Number(c.id) === Number(targetId))) return;

    const cache = this.shopService.categoriesByParentId();
    const missingParents = flat
      .filter(c => c.has_subcategories)
      .map(c => Number(c.id))
      .filter(id => !cache[id]);

    if (missingParents.length === 0) return;

    forkJoin(
      missingParents.map(id =>
        this.shopService.getSubcategories(id)
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.ensureCategoryNameLoadedForDerivedId(targetId, roundsLeft - 1);
      });
  }

  clearAll(): void {
    this.searchService.clearSearchFilters();
    this.expandedFields.set(new Set());
    // Reset to dynamic max price
    this.maxPrice.set(this.dynamicMaxPrice());
  }

  getPriceStep(): number {
    const max = this.maxPrice();
    if (max <= 100) return 5;
    if (max <= 500) return 10;
    if (max <= 1000) return 25;
    if (max <= 5000) return 50;
    return 100;
  }

  setSortBy(value: string): void {
    this.sortBy.set(value);
  }

  onMinPriceChange(event: Event): void {
    const next = +(event.target as HTMLInputElement).value || 0;
    this.minPrice.set(next);
  }

  onMaxPriceChange(event: Event): void {
    const next = +(event.target as HTMLInputElement).value || this.dynamicMaxPrice();
    this.maxPrice.set(next);
  }

  toggleField(fieldId: number): void {
    this.expandedFields.update(current => {
      const next = new Set(current);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  }

  isFieldExpanded(fieldId: number): boolean {
    return this.expandedFields().has(fieldId);
  }

  isFilterOptionSelected(fieldId: number, optionId: number): boolean {
    return this.searchService.isSearchFilterOptionSelected(fieldId, optionId);
  }

  toggleFilterOption(fieldId: number, optionId: number): void {
    this.searchService.toggleSearchFilterOption(fieldId, optionId);
  }

  isBrandSelected(brandId: number): boolean {
    return this.searchService.isBrandSelected(brandId);
  }

  toggleBrand(brandId: number): void {
    this.searchService.toggleBrandSelection(brandId);
  }

  maxPriceForSlider(): number {
    return this.dynamicMaxPrice();
  }

  relevantCategoryChips = computed(() => {
    const products = this.searchService.searchSidebarProducts();
    const derived = this.searchService.searchDerivedCategoryId();

    if (!products?.length) {
      if (derived == null) return [];
      const categories = this.shopService.flatCategories();
      const match = categories.find(c => Number(c.id) === Number(derived));
      return match ? [{ id: Number(derived), name: match.name }] : [{ id: Number(derived), name: String(derived) }];
    }

    const categories = this.shopService.flatCategories();
    const byId = new Map<number, string>();
    for (const c of categories) {
      byId.set(Number(c.id), c.name);
    }

    const seen = new Map<number, string>();
    for (const p of products) {
      const catId = p.category_id;
      if (catId == null) continue;

      const numId = Number(catId);
      if (!Number.isFinite(numId) || seen.has(numId)) continue;

      const name = p.category?.name || byId.get(numId) || String(numId);
      seen.set(numId, name);
    }

    const chips = Array.from(seen.entries()).map(([id, name]) => ({ id, name }));

    if (chips.length > 0) return chips;

    // Fallback: if we couldn't extract per-product category ids but we have a derived id,
    // show it so users still see something meaningful.
    if (derived != null) {
      const categories = this.shopService.flatCategories();
      const match = categories.find(c => Number(c.id) === Number(derived));
      return match ? [{ id: Number(derived), name: match.name }] : [{ id: Number(derived), name: String(derived) }];
    }

    return [];
  });
}

