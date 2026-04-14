import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCardComponent } from '../product-card/product-card';
import { ProductCardSkeletonComponent } from '../skeletons/product-card-skeleton';
import { ShopService } from 'lib/services/shop/shop.service';
import { ShopSearchService } from 'lib/services/shop/shop-search.service';
import { Product } from '../../shop.models';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-product-grid',
  imports: [ProductCardComponent, ProductCardSkeletonComponent, TranslatePipe],
  templateUrl: './product-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent {
  private shopService = inject(ShopService);
  private searchService = inject(ShopSearchService);
  private destroyRef = inject(DestroyRef);

  products = signal<Product[]>([]);
  displayProducts = computed(() => this.products());

  private setSearchResultsCountEffect = effect(() => {
    this.searchService.setSearchResultsCount(this.totalItems());
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
        search: this.searchService.searchQuery().trim(),
        sortBy: this.shopService.shopSortBy(),
        minPrice: this.shopService.shopMinPrice(),
        maxPrice: this.shopService.shopMaxPrice(),
        selectedBrands: this.searchService.selectedBrandIds(),
        selectedSpecs: this.searchService.selectedSearchFilters(),
      });

      if (querySignature === this.lastQuerySignature) return;

      this.lastQuerySignature = querySignature;
      this.currentPage.set(1);

      this.fetchMaxPriceSample();
      this.fetchProducts(1);
    });

    effect(() => {
      const raw = this.products();
      this.searchService.setSearchSidebarProducts(raw);

      const first = raw?.[0];
      const rawId = first?.category_id ?? first?.category?.id;

      const derived = rawId == null ? null : Number(rawId);
      this.searchService.setSearchDerivedCategoryId(Number.isFinite(derived as number) ? (derived as number) : null);
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
    const searchQuery = this.searchService.searchQuery();
    const categoryId = this.shopService.selectedCategoryId();
    const extraFilters = this.searchService.getSelectedFilterQueryParams();

    const sampleSize = 100;

    if (searchQuery && searchQuery.trim().length >= 2) {
      this.searchService.searchProductsPaginated(searchQuery, 1, sampleSize, {
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

    const searchQuery = this.searchService.searchQuery();
    const categoryId = this.shopService.selectedCategoryId();
    const sortBy = this.shopService.shopSortBy();
    const minPrice = this.shopService.shopMinPrice();
    const maxPrice = this.shopService.shopMaxPrice();

    if (minPrice > maxPrice) {
      this.products.set([]);
      this.totalPages.set(0);
      this.totalItems.set(0);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    const dynamicMax = this.shopService.dynamicMaxPrice();
    const extraFilters = this.searchService.getSelectedFilterQueryParams();

    if (searchQuery && searchQuery.trim().length >= 2) {
      const params = {
        sort_by: sortBy || undefined,
        min_price: minPrice > 0 ? minPrice : undefined,
        max_price: maxPrice < dynamicMax ? maxPrice : undefined,
        category_id: categoryId ?? undefined,
        in_stock: true,
        extra_filters: extraFilters,
      };

      this.searchService.searchProductsPaginated(searchQuery, page, this.pageSize, params)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: response => {
            if (requestId !== this.latestRequestId) return;
            this.products.set(response.items);
            this.totalPages.set(response.total_pages);
            this.totalItems.set(response.total);

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
