import { Component, OnInit, DestroyRef, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { ShopService } from 'lib/services/shop/shop.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { Product, FilterGroup } from '../shop/shop.models';
import { ProductCardComponent } from '../shop/components/product-card/product-card';

@Component({
  selector: 'app-category-products',
  imports: [CommonModule, Header, Footer, TranslatePipe, RouterLink, ProductCardComponent, FormsModule],
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
  loading = signal<boolean>(true);
  filtersLoading = signal<boolean>(false);
  skeletonArray = Array(8).fill(0);

  // Dynamic filters from backend
  filterGroups = signal<FilterGroup[]>([]);
  selectedFilters = signal<Record<number, number[]>>({});
  expandedGroups = signal<Set<number>>(new Set());
  expandedFields = signal<Set<number>>(new Set());

  // Filter properties (for basic filters like price, rating, etc)
  maxPrice = signal<number>(10000);
  minRating = signal<number>(0);
  verifiedOnly = signal<boolean>(false);
  sortBy = signal<string>('newest');

  sortOptions = [
    { value: 'newest', label: 'shop.filters.sort.newest' },
    { value: 'price-low', label: 'shop.filters.sort.priceLow' },
    { value: 'price-high', label: 'shop.filters.sort.priceHigh' },
    { value: 'rating', label: 'shop.filters.sort.rating' },
  ];

  ratingOptions = [
    { value: 4, label: '4+ Stars' },
    { value: 3, label: '3+ Stars' },
    { value: 2, label: '2+ Stars' },
    { value: 0, label: 'All Ratings' },
  ];

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
        tap(params => {
          const categoryId = +params['categoryId'];
          this.categoryId.set(categoryId);
          this.loading.set(true);
        }),
        switchMap(params => {
          const categoryId = +params['categoryId'];
          // Ensure main categories are loaded (will use cache if already loaded)
          return this.shopService.getMainCategories().pipe(
            switchMap(() =>
              // Load products from category tree (includes all subcategories)
              this.shopService.getAllProductsInCategoryTree(categoryId)
            ),
            tap(() => {
              // Load filters if this is a leaf category (no subcategories)
              if (this.childCategories().length === 0) {
                this.loadFilters(categoryId);
              }
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.applyFilters();
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.filteredProducts.set([]);
          this.loading.set(false);
        }
      });
  }

  private loadFilters(categoryId: number): void {
    console.log('🔍 Loading filters for category ID:', categoryId);
    this.filtersLoading.set(true);
    this.shopService.getFilterOptions(categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (filters) => {
          console.log('📦 Received filters:', filters);
          console.log('📊 Number of filter groups:', filters.length);
          console.log('📋 FULL JSON FOR BACKEND TEAM:', JSON.stringify(filters, null, 2));
          this.filterGroups.set(filters);
          this.filtersLoading.set(false);
        },
        error: (err) => {
          console.error('❌ Failed to load filters:', err);
          this.filterGroups.set([]);
          this.filtersLoading.set(false);
        }
      });
  }

  getCategoryRoute(categoryId: number | string): string[] {
    return ['/shop/category', String(categoryId)];
  }

  setMinRating(rating: number): void {
    this.minRating.set(rating);
    this.applyFilters();
  }

  setSortBy(sortValue: string): void {
    this.sortBy.set(sortValue);
    this.applyFilters();
  }

  clearFilters(): void {
    this.maxPrice.set(10000);
    this.minRating.set(0);
    this.verifiedOnly.set(false);
    this.sortBy.set('newest');
    this.selectedFilters.set({});
    this.applyFilters();
  }

  toggleFilterOption(fieldId: number, optionId: number): void {
    this.selectedFilters.update(current => {
      const selected = current[fieldId] || [];
      const index = selected.indexOf(optionId);

      if (index > -1) {
        // Remove option
        const newSelected = selected.filter(id => id !== optionId);
        if (newSelected.length === 0) {
          const { [fieldId]: _, ...rest } = current;
          return rest;
        }
        return { ...current, [fieldId]: newSelected };
      } else {
        // Add option
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

    // Filter by price
    filtered = filtered.filter(p => p.price <= this.maxPrice());

    // Filter by rating
    if (this.minRating() > 0) {
      filtered = filtered.filter(p => (p.rating || 0) >= this.minRating());
    }

    // Filter by verified
    if (this.verifiedOnly()) {
      filtered = filtered.filter(p => p.verified === true);
    }

    // Sort
    switch (this.sortBy()) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        // Keep original order (newest first from API)
        break;
    }

    this.filteredProducts.set(filtered);
  }
}
