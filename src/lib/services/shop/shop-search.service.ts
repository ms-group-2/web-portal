import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProductsResponse, Product, FilterField, FilterBrand } from 'src/app/pages/shop/shop.models';
import { ShopService } from './shop.service';

@Injectable({ providedIn: 'root' })
export class ShopSearchService {
  private http = inject(HttpClient);
  private shopService = inject(ShopService);
  private baseUrl = environment.apiBaseUrl;

  private headers = { 'ngrok-skip-browser-warning': 'true' };

  readonly searchQuery = signal<string>('');

  // Checkbox filters are applied client-side because the current search endpoint
  // is wired only for price/sort (backend support for these filters may be added later).
  readonly searchFilterGroups = signal<FilterField[]>([]);
  readonly selectedSearchFilters = signal<Record<number, number[]>>({});
  readonly searchBrands = signal<FilterBrand[]>([]);
  readonly selectedBrandIds = signal<number[]>([]);

  // Used by the search sidebar to display "relevant categories" derived from
  // the currently displayed search results.
  readonly searchSidebarProducts = signal<Product[]>([]);

  // When on the search page (no selectedCategoryId), we still need a category
  // to load checkbox filter groups from the backend. We derive it from the
  // first search result product.
  readonly searchDerivedCategoryId = signal<number | null>(null);

  readonly searchResultsCount = signal<number>(0);

  setSearchQuery(query: string): void {
    const next = query ?? '';
    const current = this.searchQuery();
    this.searchQuery.set(next);

    if (next.trim() === '' || next.trim() !== current.trim()) {
      this.clearSearchFilters();
    }
  }

  setSearchFilterGroups(filters: FilterField[]): void {
    this.searchFilterGroups.set(filters);
  }

  setSearchBrands(brands: FilterBrand[]): void {
    this.searchBrands.set(brands);
  }

  toggleSearchFilterOption(fieldId: number, optionId: number): void {
    this.selectedSearchFilters.update(current => {
      const selected = current[fieldId] || [];
      const index = selected.indexOf(optionId);

      if (index > -1) {
        const nextSelected = selected.filter(id => id !== optionId);
        if (nextSelected.length === 0) {
          const { [fieldId]: _, ...rest } = current;
          return rest;
        }
        return { ...current, [fieldId]: nextSelected };
      }

      return { ...current, [fieldId]: [...selected, optionId] };
    });
  }

  isSearchFilterOptionSelected(fieldId: number, optionId: number): boolean {
    const selected = this.selectedSearchFilters()[fieldId] || [];
    return selected.includes(optionId);
  }

  clearSearchFilters(): void {
    this.selectedSearchFilters.set({});
    this.searchFilterGroups.set([]);
    this.searchBrands.set([]);
    this.selectedBrandIds.set([]);
    this.searchDerivedCategoryId.set(null);

    this.shopService.shopSortBy.set('popular');
    this.shopService.shopMinPrice.set(0);
    this.shopService.shopMaxPrice.set(this.shopService.dynamicMaxPrice());
  }

  setSearchSidebarProducts(products: Product[]): void {
    this.searchSidebarProducts.set(products);
  }

  setSearchDerivedCategoryId(categoryId: number | null): void {
    this.searchDerivedCategoryId.set(categoryId);
  }

  setSearchResultsCount(count: number): void {
    this.searchResultsCount.set(count);
  }

  toggleBrandSelection(brandId: number): void {
    this.selectedBrandIds.update(current =>
      current.includes(brandId) ? current.filter(id => id !== brandId) : [...current, brandId]
    );
  }

  isBrandSelected(brandId: number): boolean {
    return this.selectedBrandIds().includes(brandId);
  }

  getSelectedFilterQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};

    const selectedBrands = this.selectedBrandIds();
    if (selectedBrands.length > 0) {
      params['brand'] = selectedBrands.join(',');
    }

    const fieldsById = new Map(this.searchFilterGroups().map(field => [field.field_id, field]));
    const selectedFields = this.selectedSearchFilters();
    for (const [fieldIdRaw, optionIds] of Object.entries(selectedFields)) {
      const fieldId = Number(fieldIdRaw);
      if (!optionIds?.length) continue;

      const field = fieldsById.get(fieldId);
      if (!field) continue;

      params[field.field_name] = optionIds.join(',');
    }

    return params;
  }

  searchProductsPaginated(
    query: string,
    page: number = 1,
    limit: number = 20,
    params?: {
      sort_by?: string;
      min_price?: number;
      max_price?: number;
      category_id?: number;
      in_stock?: boolean;
      extra_filters?: Record<string, string>;
    }
  ): Observable<ProductsResponse> {
    if (!query || query.trim().length < 2) {
      return of({ items: [], total: 0, page: 1, limit: 20, total_pages: 0 } as ProductsResponse);
    }

    const queryParams: Record<string, string | number | boolean> = { q: query.trim(), page, limit };
    if (params?.sort_by) queryParams['sort_by'] = params.sort_by;
    if (params?.min_price !== undefined) queryParams['min_price'] = params.min_price;
    if (params?.max_price !== undefined) queryParams['max_price'] = params.max_price;
    if (params?.category_id !== undefined) queryParams['category_id'] = params.category_id;
    if (params?.in_stock !== undefined) queryParams['in_stock'] = params.in_stock;
    if (params?.extra_filters) Object.assign(queryParams, params.extra_filters);

    return this.http
      .get<ProductsResponse>(`${this.baseUrl}/ecommerce/products/search`, {
        headers: this.headers,
        params: queryParams,
      })
      .pipe(
        map(response => {
          const rawItems = response?.items ?? response?.products ?? [];
          if (!response || !rawItems) {
            return { items: [], total: 0, page: 1, limit: 20, total_pages: 0 } as ProductsResponse;
          }
          const totalPages = response.total_pages ?? Math.ceil((response.total || 0) / Math.max(response.limit || limit, 1));
          return {
            ...response,
            items: rawItems.map(product => this.shopService.normalizeProduct(product)),
            total_pages: totalPages,
          };
        }),
        catchError(() => of({ items: [], total: 0, page: 1, limit: 20, total_pages: 0 } as ProductsResponse))
      );
  }

  searchProducts(query: string, page: number = 1, limit: number = 20): Observable<Product[]> {
    if (!query || query.trim().length < 2) {
      return of([]);
    }

    const queryParams = {
      q: query.trim(),
      page,
      limit,
    };

    return this.http
      .get<ProductsResponse>(`${this.baseUrl}/ecommerce/products/search`, {
        headers: this.headers,
        params: queryParams,
      })
      .pipe(
        map(response => {
          const rawItems = response?.items ?? response?.products ?? [];
          if (!response || !rawItems) {
            return [];
          }
          return rawItems.map(product => this.shopService.normalizeProduct(product));
        }),
        catchError(() => of([]))
      );
  }
}
