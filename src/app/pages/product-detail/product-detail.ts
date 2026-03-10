import { Component, OnInit, DestroyRef, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs/operators';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { ShopService } from 'lib/services/shop/shop.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { Product } from '../shop/shop.models';
import { LoadingSpinner } from 'lib/components/spinner/loading-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  imports: [Header, Footer, TranslatePipe, RouterLink, LoadingSpinner, MatIconModule, CommonModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private shopService = inject(ShopService);
  private translation = inject(TranslationService);
  private location = inject(Location);
  private destroyRef = inject(DestroyRef);

  productId = signal<number | null>(null);
  product = signal<Product | null>(null);
  loading = signal<boolean>(true);
  selectedImage = signal<string>('');
  quantity = signal<number>(1);

  isFavorited = computed(() => this.shopService.isFavorite(this.product()?.id));

  breadcrumbTrail = computed(() => {
    const product = this.product();
    if (!product?.category_id) return [];

    const categories = this.shopService.flatCategories();
    const trail: any[] = [];
    let currentCategoryId: number | null = product.category_id;

    while (currentCategoryId !== null) {
      const category = categories.find(c => Number(c.id) === currentCategoryId);
      if (!category) break;
      trail.unshift(category);
      currentCategoryId = category.parent_id;
    }

    return trail;
  });

  goBack() {
    this.location.back();
  }

  ngOnInit() {
    this.translation.loadModule('shop')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.route.params
      .pipe(
        tap(params => {
          const productId = +params['productId'];
          this.productId.set(productId);
          this.loading.set(true);
        }),
        switchMap(params => {
          const productId = +params['productId'];
          // Load categories first, then fetch the specific product by ID
          return this.shopService.getMainCategories().pipe(
            switchMap(() => this.shopService.getProductById(productId))
          );
        }),
        tap(product => {
          console.log('Product from getProductById API:', product);
          if (product) {
            this.product.set(product);
            this.selectedImage.set(product.image || product.image_url || '');

            // Load category hierarchy for breadcrumb
            if (product.category_id) {
              this.loadCategoryHierarchy(product.category_id);
            }
          }
          this.loading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: () => {
          this.loading.set(false);
        }
      });
  }

  private loadCategoryHierarchy(categoryId: number) {
    const categories = this.shopService.flatCategories();
    let currentCategoryId: number | null = categoryId;

    while (currentCategoryId !== null) {
      const category = categories.find(c => Number(c.id) === currentCategoryId);
      if (!category) break;

      if (category.parent_id !== null) {
        this.shopService.getSubcategories(category.parent_id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      }

      currentCategoryId = category.parent_id;
    }
  }

  selectImage(image: string) {
    this.selectedImage.set(image);
  }

  incrementQuantity() {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  addToCart() {
    const product = this.product();
    if (product) {
      for (let i = 0; i < this.quantity(); i++) {
        this.shopService.addToCart(product);
      }
    }
  }

  toggleFavorite() {
    const product = this.product();
    if (product) {
      this.shopService.toggleFavorite(product);
    }
  }
}
