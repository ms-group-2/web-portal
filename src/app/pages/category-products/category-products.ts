import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { ShopService } from 'lib/services/shop/shop.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { Product } from '../shop/shop.models';
import { LoadingSpinner } from 'lib/components/spinner/loading-spinner';
import { ProductCardComponent } from '../shop/components/product-card/product-card';

@Component({
  selector: 'app-category-products',
  imports: [Header, Footer, TranslatePipe, RouterLink, LoadingSpinner, ProductCardComponent],
  templateUrl: './category-products.html',
  styleUrls: ['./category-products.scss']
})
export class CategoryProducts implements OnInit {
  private route = inject(ActivatedRoute);
  private shopService = inject(ShopService);
  private translation = inject(TranslationService);

  categoryId = signal<number | null>(null);
  products = signal<Product[]>([]);
  loading = signal<boolean>(true);

  currentCategory = computed(() => {
    const id = this.categoryId();
    if (!id) return null;
    return this.shopService.flatCategories().find(c => c.id === id) || null;
  });

  parentCategory = computed(() => {
    const current = this.currentCategory();
    if (!current?.parent_id) return null;
    return this.shopService.flatCategories().find(c => c.id === current.parent_id) || null;
  });

  categoryName = computed(() => this.currentCategory()?.name || '');

  childCategories = computed(() => {
    const id = this.categoryId();
    if (!id) return [];
    return this.shopService.subcategoriesByParentId()[id] || [];
  });

  // Build full breadcrumb trail recursively
  breadcrumbTrail = computed(() => {
    const current = this.currentCategory();
    if (!current) return [];

    const categories = this.shopService.flatCategories();
    const trail: any[] = [];
    let currentCategoryId: number | null = Number(current.id);

    // Build trail by following parent_id chain all the way up
    while (currentCategoryId !== null) {
      const category = categories.find(c => Number(c.id) === currentCategoryId);
      if (!category) break;
      trail.unshift(category); // Add to front of array
      currentCategoryId = category.parent_id;
    }

    return trail;
  });

  ngOnInit() {
    this.translation.loadModule('shop').subscribe();

    this.route.params.subscribe(params => {
      const categoryId = +params['categoryId'];
      this.categoryId.set(categoryId);
      this.loading.set(true);

      // Ensure main categories are loaded (will use cache if already loaded)
      this.shopService.getMainCategories().subscribe(() => {
        // Load products from category tree (includes all subcategories)
        this.shopService.getAllProductsInCategoryTree(categoryId).subscribe({
          next: (products) => {
            this.products.set(products);
            this.loading.set(false);
          },
          error: () => {
            this.products.set([]);
            this.loading.set(false);
          }
        });
      });
    });
  }

  getCategoryRoute(categoryId: number | string): string[] {
    return ['/shop/category', String(categoryId)];
  }
}
