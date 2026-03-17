import { Component, OnInit, DestroyRef, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { ShopService } from 'lib/services/shop/shop.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { Product, FilterGroup, CategoryWithProducts } from '../shop/shop.models';
import { ProductCardComponent } from '../shop/components/product-card/product-card';
import { MatIcon } from "@angular/material/icon";
import { MatSlider, MatSliderRangeThumb } from "@angular/material/slider";

@Component({
  selector: 'app-category-products',
  imports: [Header, Footer, TranslatePipe, RouterLink, ProductCardComponent, FormsModule, MatIcon, MatSlider, MatSliderRangeThumb, NgClass],
  templateUrl: './category-products.html',
  styleUrls: ['./category-products.scss']
})
export class CategoryProducts implements OnInit {
  private route = inject(ActivatedRoute);
  private shopService = inject(ShopService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  categoryId = signal<number | null>(null);
  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  subcategoriesWithProducts = signal<CategoryWithProducts[]>([]);
  loading = signal<boolean>(true);
  filtersLoading = signal<boolean>(false);
  skeletonArray = Array(8).fill(0);

  filterGroups = signal<FilterGroup[]>([]);
  selectedFilters = signal<Record<number, number[]>>({});
  expandedGroups = signal<Set<number>>(new Set());
  expandedFields = signal<Set<number>>(new Set());

  categoryMaxPrice = computed(() => {
    const prices = this.products().map(p => p.price).filter(p => p > 0);
    if (prices.length === 0) return 10000;
    return Math.ceil(Math.max(...prices) / 100) * 100; 
  });

  minPrice = signal<number>(0);
  maxPrice = signal<number>(10000);
  sortBy = signal<string>('');

  sortOptions = [
    { value: 'price_asc', label: 'shop.filters.sort.priceLow' },
    { value: 'price_desc', label: 'shop.filters.sort.priceHigh' },
    { value: '', label: 'shop.filters.sort.default' },
  ];

  formatPrice(value: number): string {
    return `₾${value}`;
  }

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

  breadcrumbTrail = computed(() => {
    const current = this.currentCategory();
    if (!current) return [];

    const categories = this.shopService.flatCategories();
    const trail: any[] = [];
    let currentCategoryId: number | null = Number(current.id);

    while (currentCategoryId !== null) {
      const category = categories.find(c => Number(c.id) === currentCategoryId);
      if (!category) break;
      trail.unshift(category);
      currentCategoryId = category.parent_id;
    }

    return trail;
  });

  ngOnInit() {
    this.translation.loadModule('shop')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.route.params
      .pipe(
        switchMap(params => {
          const categoryId = +params['categoryId'];
          this.categoryId.set(categoryId);
          this.loading.set(true);
          this.filterGroups.set([]);
          this.filtersLoading.set(true);

          this.shopService.getFilterOptions(categoryId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (filters) => {
                this.filterGroups.set(filters);
                this.filtersLoading.set(false);
              },
              error: () => {
                this.filterGroups.set([]);
                this.filtersLoading.set(false);
              }
            });

          return forkJoin({
            mainCategories: this.shopService.getMainCategories(),
            categoriesWithProducts: this.shopService.getCategoriesWithProducts(categoryId),
            directProducts: this.shopService.getProducts({ category_id: categoryId, limit: 100 }),
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (result) => {
          this.subcategoriesWithProducts.set(result.categoriesWithProducts);
          this.products.set(result.directProducts);
          this.maxPrice.set(this.categoryMaxPrice());
          this.applyFilters();
          this.loading.set(false);

          // Load ancestor categories for breadcrumb
          const id = this.categoryId();
          if (id) this.loadBreadcrumbChain(id);
        },
        error: () => {
          this.products.set([]);
          this.filteredProducts.set([]);
          this.subcategoriesWithProducts.set([]);
          this.loading.set(false);
        }
      });
  }


  /**
   * Load ancestor category levels so breadcrumbTrail can resolve.
   * Walks down from roots loading subcategories one level at a time
   * until the target category appears in flatCategories.
   */
  private loadBreadcrumbChain(targetId: number) {
    if (this.shopService.flatCategories().find(c => Number(c.id) === targetId)) return;

    const parents = this.shopService.mainCategories().filter(c => c.has_subcategories);
    if (parents.length === 0) return;

    forkJoin(parents.map(c => this.shopService.getSubcategories(Number(c.id))))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(results => {
        if (this.shopService.flatCategories().find(c => Number(c.id) === targetId)) return;

        // Go one level deeper
        const nextParents = results.flat().filter(c => c.has_subcategories);
        if (nextParents.length === 0) return;

        forkJoin(nextParents.map(c => this.shopService.getSubcategories(Number(c.id))))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      });
  }

  getCategoryRoute(categoryId: number | string): string[] {
    return ['/shop/category', String(categoryId)];
  }

  onMinPriceChange(event: Event): void {
    this.minPrice.set(+(event.target as HTMLInputElement).value || 0);
    this.applyFilters();
  }

  onMaxPriceChange(event: Event): void {
    this.maxPrice.set(+(event.target as HTMLInputElement).value || 10000);
    this.applyFilters();
  }

  setSortBy(sortValue: string): void {
    this.sortBy.set(sortValue);
    this.applyFilters();
  }

  clearFilters(): void {
    this.minPrice.set(0);
    this.maxPrice.set(this.categoryMaxPrice());
    this.sortBy.set('');
    this.selectedFilters.set({});
    this.applyFilters();
  }

  toggleFilterOption(fieldId: number, optionId: number): void {
    this.selectedFilters.update(current => {
      const selected = current[fieldId] || [];
      const index = selected.indexOf(optionId);

      if (index > -1) {
        const newSelected = selected.filter(id => id !== optionId);
        if (newSelected.length === 0) {
          const { [fieldId]: _, ...rest } = current;
          return rest;
        }
        return { ...current, [fieldId]: newSelected };
      } else {
        return { ...current, [fieldId]: [...selected, optionId] };
      }
    });
    this.applyFilters();
  }

  isFilterOptionSelected(fieldId: number, optionId: number): boolean {
    const selected = this.selectedFilters()[fieldId] || [];
    return selected.includes(optionId);
  }

  toggleGroup(groupId: number): void {
    this.expandedGroups.update(current => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  toggleField(fieldId: number): void {
    this.expandedFields.update(current => {
      const next = new Set(current);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  }

  isGroupExpanded(groupId: number): boolean {
    return this.expandedGroups().has(groupId);
  }

  isFieldExpanded(fieldId: number): boolean {
    return this.expandedFields().has(fieldId);
  }

  applyFilters(): void {
    let filtered = [...this.products()];

    filtered = filtered.filter(p => p.price >= this.minPrice() && p.price <= this.maxPrice());

    switch (this.sortBy()) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    this.filteredProducts.set(filtered);
  }
}
