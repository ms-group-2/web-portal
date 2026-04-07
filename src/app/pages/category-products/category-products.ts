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
import { Product, FilterField, FilterGroup, CategoryWithProducts } from '../shop/shop.models';
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
              next: (response) => {
                this.filterGroups.set(this.toFilterGroups(response.filters));
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

  isOptionDisabled(option: { option_id: number; option_value: string; product_count: number }): boolean {
    return option.product_count === 0;
  }

  applyFilters(): void {
    let filtered = [...this.products()];

    // Apply price filter
    filtered = filtered.filter(p => p.price >= this.minPrice() && p.price <= this.maxPrice());

    // Apply checkbox filters (spec filters)
    const selectedFilters = this.selectedFilters();
    const filterEntries: [number, number[]][] = Object.entries(selectedFilters)
      .map(([fieldId, optionIds]) => [Number(fieldId), optionIds || []] as [number, number[]])
      .filter(([, optionIds]) => optionIds.length > 0);

    if (filterEntries.length > 0) {
      filtered = this.applyCheckboxFilters(filtered, filterEntries);
    }

    // Apply sorting
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

    // Re-fetch filter options with current filters to get updated product_count
    const categoryId = this.categoryId();
    if (categoryId) {
      this.refetchFilterOptions(categoryId);
    }
  }

  private applyCheckboxFilters(
    products: Product[],
    filterEntries: [number, number[]][]
  ): Product[] {
    const filterGroups = this.filterGroups();
    if (!filterGroups.length) return products;

    // Build field lookup: field_id -> field definition
    const fieldById = new Map<number, { field_name: string; options: Array<{ option_id: number; option_value: string }> }>();
    for (const group of filterGroups) {
      for (const field of group.fields) {
        fieldById.set(field.field_id, {
          field_name: field.field_name,
          options: field.options
        });
      }
    }

    const normalize = (value: unknown): string => String(value ?? '').trim().toLowerCase();

    const fieldNameLooksLikeBrand = (fieldName: string): boolean => {
      const n = normalize(fieldName);
      return n.includes('brand') || n.includes('manufacturer') || n.includes('ბრენ') || n.includes('მწარმო');
    };

    const productMatchesField = (product: Product, fieldId: number, optionIds: number[]): boolean => {
      const field = fieldById.get(fieldId);
      if (!field) return false;

      const selectedValues = field.options
        .filter(o => optionIds.includes(o.option_id))
        .map(o => normalize(o.option_value));
      if (!selectedValues.length) return false;

      const fieldName = field.field_name;
      const matchesBrandField = fieldNameLooksLikeBrand(fieldName);
      const productBrandName = normalize(product.brand?.name);
      const specs = product.specifications ?? [];

      // Check if any selected value matches
      return selectedValues.some(expectedValue => {
        // Brand field: match against product.brand.name
        if (matchesBrandField && productBrandName === expectedValue) {
          return true;
        }

        // Spec field: match against product.specifications
        for (const group of specs) {
          for (const spec of group.specifications) {
            const specNameNorm = normalize(spec.name);
            const specValueNorm = normalize(spec.value);
            const fieldNameNorm = normalize(fieldName);

            // Value must match
            if (specValueNorm !== expectedValue) continue;

            // Field name should loosely match spec name
            if (specNameNorm === fieldNameNorm ||
                specNameNorm.includes(fieldNameNorm) ||
                fieldNameNorm.includes(specNameNorm)) {
              return true;
            }
          }
        }

        return false;
      });
    };

    // AND across fields: product must match ALL selected fields
    return products.filter(product => {
      for (const [fieldId, optionIds] of filterEntries) {
        if (!productMatchesField(product, fieldId, optionIds)) {
          return false;
        }
      }
      return true;
    });
  }

  private refetchFilterOptions(categoryId: number): void {
    this.filtersLoading.set(true);

    // Pass currently active filters to get updated product_count
    const params: any = { category_id: categoryId };

    const minPrice = this.minPrice();
    const maxPrice = this.maxPrice();
    if (minPrice > 0) params.min_price = minPrice;
    if (maxPrice < this.categoryMaxPrice()) params.max_price = maxPrice;

    // Add selected checkbox filters
    const selectedFilters = this.selectedFilters();
    for (const [fieldId, optionIds] of Object.entries(selectedFilters)) {
      if (optionIds && optionIds.length > 0) {
        const field = this.findFieldById(Number(fieldId));
        if (field) {
          // Use field_name as param key, comma-separated option IDs as value
          params[field.field_name] = optionIds.join(',');
        }
      }
    }

    this.shopService.getFilterOptions(categoryId, params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.filterGroups.set(this.toFilterGroups(response.filters));
          this.filtersLoading.set(false);
        },
        error: () => {
          this.filtersLoading.set(false);
        }
      });
  }

  private toFilterGroups(filters: FilterField[]): FilterGroup[] {
    if (!filters?.length) {
      return [];
    }

    return [{
      group_id: 0,
      group_name: 'Filters',
      fields: filters,
    }];
  }

  private findFieldById(fieldId: number): { field_id: number; field_name: string; options: any[] } | undefined {
    for (const group of this.filterGroups()) {
      const field = group.fields.find(f => f.field_id === fieldId);
      if (field) return field;
    }
    return undefined;
  }
}
