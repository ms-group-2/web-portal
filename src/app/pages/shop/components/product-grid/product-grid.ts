import { Component, ChangeDetectionStrategy, DestroyRef, PLATFORM_ID, inject, signal, computed, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private platformId = inject(PLATFORM_ID);

  products = signal<Product[]>([]);
  isLoading = signal(false);
  skeletonArray = Array(8).fill(0);

  currentPage = signal(1);
  totalPages = signal(0);
  totalItems = signal(0);
  pageSize = 30;

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
      this.shopService.selectedCategoryId();
      this.shopService.searchQuery();
      this.shopService.shopSortBy();
      this.shopService.shopMinPrice();
      this.shopService.shopMaxPrice();

      this.currentPage.set(1);
      this.fetchProducts(1);
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.fetchProducts(page);
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private fetchProducts(page: number) {
    this.isLoading.set(true);

    const searchQuery = this.shopService.searchQuery();
    const categoryId = this.shopService.selectedCategoryId();
    const sortBy = this.shopService.shopSortBy();
    const minPrice = this.shopService.shopMinPrice();
    const maxPrice = this.shopService.shopMaxPrice();

    if (searchQuery && searchQuery.trim().length >= 2) {
      this.shopService.searchProductsPaginated(searchQuery, page, this.pageSize)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: response => {
            this.products.set(response.items);
            this.totalPages.set(response.total_pages);
            this.totalItems.set(response.total);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      return;
    }

    this.shopService.getProductsPaginated({
      category_id: categoryId,
      page,
      limit: this.pageSize,
      sort_by: sortBy || undefined,
      min_price: minPrice > 0 ? minPrice : undefined,
      max_price: maxPrice < 10000 ? maxPrice : undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.products.set(response.items);
          this.totalPages.set(response.total_pages);
          this.totalItems.set(response.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }
}
