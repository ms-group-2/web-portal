import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCardComponent } from '../product-card/product-card';
import { ProductCardSkeletonComponent } from '../skeletons/product-card-skeleton';
import { ShopService } from 'lib/services/shop/shop.service';
import { Product } from '../../shop.models';

@Component({
  selector: 'app-product-grid',
  imports: [CommonModule, ProductCardComponent, ProductCardSkeletonComponent],
  templateUrl: './product-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent {
  private shopService = inject(ShopService);
  private destroyRef = inject(DestroyRef);

  products = signal<Product[]>([]);
  isLoading = signal(false);
  skeletonArray = Array(8).fill(0);

  constructor() {
    effect(() => {
      const categoryId = this.shopService.selectedCategoryId();
      const searchQuery = this.shopService.searchQuery();

      this.loadProducts(categoryId, searchQuery);
    });
  }

  private loadProducts(categoryId: number | null, searchQuery: string) {
    this.isLoading.set(true);

    if (searchQuery && searchQuery.trim().length >= 2) {
      this.shopService.searchProducts(searchQuery, 1, 20)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: products => {
            this.products.set(products);
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          }
        });
      return;
    }

    const params: any = {};
    if (categoryId) {
      params.category_id = categoryId;
    }

    this.shopService.getProducts(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: products => {
          this.products.set(products);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }
}
