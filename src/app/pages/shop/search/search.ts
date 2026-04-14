import { Component, ChangeDetectionStrategy, OnInit, DestroyRef, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, tap } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { ShopService } from 'lib/services/shop/shop.service';
import { ShopSearchService } from 'lib/services/shop/shop-search.service';
import { TranslationService } from 'lib/services/translation.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { CategoryMenu } from 'lib/components/category-dialog/category-dialog';
import { BottomSheet } from 'lib/components/bottom-sheet/bottom-sheet';
import { MobileFilterBar } from 'lib/components/mobile-filter-bar/mobile-filter-bar';
import { SortBottomSheet } from 'lib/components/sort-bottom-sheet/sort-bottom-sheet';
import { PriceRangeFilter } from 'lib/components/price-range-filter/price-range-filter';
import { BrandFilterList } from 'lib/components/brand-filter-list/brand-filter-list';
import { SpecFilterList } from 'lib/components/spec-filter-list/spec-filter-list';
import { SearchFiltersSidebarComponent } from '../components/search-filters-sidebar/search-filters-sidebar';
import { ProductGridComponent } from '../components/product-grid/product-grid';

@Component({
  selector: 'app-shop-search',
  imports: [
    Header, Footer, CategoryMenu, SearchFiltersSidebarComponent, ProductGridComponent,
    BottomSheet, MobileFilterBar, SortBottomSheet, PriceRangeFilter, BrandFilterList, SpecFilterList,
    MatIcon, TranslatePipe, RouterLink,
  ],
  templateUrl: './search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopSearch implements OnInit {
  private shopService = inject(ShopService);
  readonly searchService = inject(ShopSearchService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  searchQueryText = computed(() => this.searchService.searchQuery().trim());
  searchResultsCount = this.searchService.searchResultsCount;
  isGeorgian = computed(() => this.translation.isGeorgian());

  sortBy = this.shopService.shopSortBy;
  minPrice = this.shopService.shopMinPrice;
  maxPrice = this.shopService.shopMaxPrice;
  dynamicMaxPrice = this.shopService.dynamicMaxPrice;

  filterGroups = computed(() => this.searchService.searchFilterGroups());
  brands = computed(() => this.searchService.searchBrands());
  relevantCategoryChips = computed(() => {
    const products = this.searchService.searchSidebarProducts();
    const derived = this.searchService.searchDerivedCategoryId();
    if (!products?.length) {
      if (derived == null) return [];
      const categories = this.shopService.flatCategories();
      const match = categories.find(c => Number(c.id) === Number(derived));
      return match ? [{ id: Number(derived), name: match.name }] : [];
    }
    const categories = this.shopService.flatCategories();
    const byId = new Map<number, string>();
    for (const c of categories) byId.set(Number(c.id), c.name);
    const seen = new Map<number, string>();
    for (const p of products) {
      const catId = p.category_id;
      if (catId == null) continue;
      const numId = Number(catId);
      if (!Number.isFinite(numId) || seen.has(numId)) continue;
      seen.set(numId, p.category?.name || byId.get(numId) || String(numId));
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  });

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
    if (this.minPrice() > 0 || this.maxPrice() < this.dynamicMaxPrice()) count++;
    const brandIds = this.searchService.selectedBrandIds();
    if (brandIds && brandIds.length > 0) count++;
    const specFilters = this.searchService.selectedSearchFilters();
    if (specFilters) {
      for (const optionIds of Object.values(specFilters)) {
        if (optionIds && (optionIds as number[]).length > 0) count++;
      }
    }
    return count;
  });

  clearAll(): void {
    this.searchService.clearSearchFilters();
    this.maxPrice.set(this.dynamicMaxPrice());
  }

  ngOnInit() {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const query = params['q'] || '';
        if (query !== this.searchService.searchQuery()) {
          this.searchService.setSearchQuery(query);
        }
      });

    this.translation.loadModule('shop')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.shopService.getMainCategories()
      .pipe(
        tap(main => {
          const parents = main.filter(c => c.has_subcategories);
          if (!parents.length) return;
          forkJoin(
            parents.map(p => this.shopService.getSubcategories(Number(p.id))),
          )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
