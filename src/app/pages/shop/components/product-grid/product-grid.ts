import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCardComponent } from '../product-card/product-card';
import { ProductCardSkeletonComponent } from '../skeletons/product-card-skeleton';
import { ShopService } from 'lib/services/shop/shop.service';
import { Product } from '../../shop.models';

@Component({
  selector: 'app-product-grid',
  imports: [ProductCardComponent, ProductCardSkeletonComponent],
  templateUrl: './product-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent {
  private shopService = inject(ShopService);
  private destroyRef = inject(DestroyRef);

  products = signal<Product[]>([]);
  displayProducts = computed(() => this.products());

  // header search count in sync with what the user sees
  private setSearchResultsCountEffect = effect(() => {
    this.shopService.setSearchResultsCount(this.totalItems());
  });

  isLoading = signal(false);
  skeletonArray = Array(8).fill(0);

  currentPage = signal(1);
  totalPages = signal(0);
  totalItems = signal(0);
  pageSize = 30;
  private latestRequestId = 0;
  private lastQuerySignature = '';

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  constructor() {
    effect(() => {
      const querySignature = JSON.stringify({
        categoryId: this.shopService.selectedCategoryId(),
        search: this.shopService.searchQuery().trim(),
        sortBy: this.shopService.shopSortBy(),
        minPrice: this.shopService.shopMinPrice(),
        maxPrice: this.shopService.shopMaxPrice(),
        selectedBrands: this.shopService.selectedBrandIds(),
        selectedSpecs: this.shopService.selectedSearchFilters(),
      });

      if (querySignature === this.lastQuerySignature) return;

      this.lastQuerySignature = querySignature;
      this.currentPage.set(1);

      // Fetch first page with larger sample to estimate max price immediately
      this.fetchMaxPriceSample();
      this.fetchProducts(1);
    });

    // Keep search sidebar categories in sync with what the user is actually seeing.
    effect(() => {
      // Use the raw API results here (before local checkbox filtering),
      // so the sidebar can still show relevant categories/subcategories
      // even when checkboxes are active.
      const raw = this.products();
      this.shopService.setSearchSidebarProducts(raw);

      // Also derive a category id to load checkbox filter groups from.
      // Backend expects a single category_id, so we pick the first product's
      // most available category-ish field.
      const first = raw?.[0];
      const rawId = first?.category_id ?? first?.category?.id;

      const derived = rawId == null ? null : Number(rawId);
      this.shopService.setSearchDerivedCategoryId(Number.isFinite(derived as number) ? (derived as number) : null);
    });
  }

  goToPage(page: number) {
    if (this.isLoading()) return;
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.fetchProducts(page);
    if (typeof window !== 'undefined') {
      const filtersStart = document.getElementById('shop-filters-start');
      if (filtersStart) {
        const headerOffset = 110;
        const y = filtersStart.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  }

  private fetchMaxPriceSample(): void {
    const searchQuery = this.shopService.searchQuery();
    const categoryId = this.shopService.selectedCategoryId();
    const extraFilters = this.shopService.getSelectedFilterQueryParams();

    // Fetch a larger sample (100 items) to get better max price estimate
    const sampleSize = 100;

    if (searchQuery && searchQuery.trim().length >= 2) {
      this.shopService.searchProductsPaginated(searchQuery, 1, sampleSize, {
        category_id: categoryId ?? undefined,
        extra_filters: extraFilters,
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: response => {
            this.shopService.updateDynamicMaxPrice(response.items, false); // Don't accumulate, set directly
          }
        });
    } else {
      this.shopService.getProductsPaginated({
        category_id: categoryId,
        page: 1,
        limit: sampleSize,
        extra_filters: extraFilters,
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: response => {
            this.shopService.updateDynamicMaxPrice(response.items, false); // Don't accumulate, set directly
          }
        });
    }
  }

  private fetchProducts(page: number) {
    const requestId = ++this.latestRequestId;
    this.isLoading.set(true);

    const searchQuery = this.shopService.searchQuery();
    const categoryId = this.shopService.selectedCategoryId();
    const sortBy = this.shopService.shopSortBy();
    const minPrice = this.shopService.shopMinPrice();
    const maxPrice = this.shopService.shopMaxPrice();
    const dynamicMax = this.shopService.dynamicMaxPrice();
    const extraFilters = this.shopService.getSelectedFilterQueryParams();

    if (searchQuery && searchQuery.trim().length >= 2) {
      // Use dedicated search endpoint so header suggestions match.
      // Pass sort + price to backend so pagination works correctly.
      const params = {
        sort_by: sortBy || undefined,
        min_price: minPrice > 0 ? minPrice : undefined,
        max_price: maxPrice < dynamicMax ? maxPrice : undefined,
        category_id: categoryId ?? undefined,
        in_stock: true,
        extra_filters: extraFilters,
      };

      this.shopService.searchProductsPaginated(searchQuery, page, this.pageSize, params)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: response => {
            if (requestId !== this.latestRequestId) return;
            this.products.set(response.items);
            this.totalPages.set(response.total_pages);
            this.totalItems.set(response.total);

            // Accumulate max price across all pages visited
            this.shopService.updateDynamicMaxPrice(response.items);

            this.isLoading.set(false);
          },
          error: () => {
            if (requestId !== this.latestRequestId) return;
            this.isLoading.set(false);
          }
        });
      return;
    }

    this.shopService.getProductsPaginated({
      category_id: categoryId,
      page,
      limit: this.pageSize,
      sort_by: sortBy || undefined,
      min_price: minPrice > 0 ? minPrice : undefined,
      max_price: maxPrice < dynamicMax ? maxPrice : undefined,
      extra_filters: extraFilters,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (requestId !== this.latestRequestId) return;
          this.products.set(response.items);
          this.totalPages.set(response.total_pages);
          this.totalItems.set(response.total);

          // Accumulate max price across all pages visited
          this.shopService.updateDynamicMaxPrice(response.items);

          this.isLoading.set(false);
        },
        error: () => {
          if (requestId !== this.latestRequestId) return;
          this.isLoading.set(false);
        }
      });
  }

}
