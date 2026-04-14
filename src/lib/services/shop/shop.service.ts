import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CategoriesResponse, CategoriesWithProductsResponse, ProductsResponse, Category, CategoryWithProducts, Product, GetFiltersResponse, FilterField, FilterBrand } from 'src/app/pages/shop/shop.models';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private headers = { 'ngrok-skip-browser-warning': 'true' };

  private normalizeImageUrl(url?: string | null): string {
    if (!url) {
      return '';
    }

    if (url.startsWith('http://localhost:9000') || url.startsWith('https://localhost:9000')) {
      try {
        const apiBase = new URL(this.baseUrl);
        const source = new URL(url);
        return `${apiBase.origin}${source.pathname}`;
      } catch {
        return url;
      }
    }

    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }

    return url;
  }

  normalizeProduct(product: Product): Product {
    const cover = this.normalizeImageUrl(product.cover_image_url || product.image_url || product.image);

    const qty =
      product.quantity != null ? product.quantity : product.stock_quantity != null ? product.stock_quantity : undefined;

    return {
      ...product,
      cover_image_url: this.normalizeImageUrl(product.cover_image_url) || cover,
      image_url: this.normalizeImageUrl(product.image_url) || cover,
      image: cover,
      name: product.title || product.name,
      quantity: qty,
    };
  }

  categoriesByParentId = signal<Partial<Record<number | 'root', Category[]>>>({});
  categoriesLoadingFor = signal<number | 'root' | null>(null);

  productsByCategoryId = signal<Partial<Record<number | 'all', Product[]>>>({});
  paginatedCache = signal<Record<string, ProductsResponse>>({});
  categoriesWithProductsCache = signal<Record<number, CategoryWithProducts[]>>({});
  filterOptionsCache = signal<Record<number, { filters: FilterField[]; brands: FilterBrand[] }>>({});

  productsById = signal<Record<number, Product>>({});

  mainCategories = computed(() => this.categoriesByParentId()['root'] || []);

  subcategoriesByParentId = computed(() => {
    const cache = this.categoriesByParentId();
    const { root, ...rest } = cache;
    return rest as Record<number, Category[]>;
  });

  selectedCategoryId = signal<number | null>(null);

  dynamicMaxPrice = signal<number>(10000);

  shopSortBy = signal<string>('popular');
  shopMinPrice = signal<number>(0);
  shopMaxPrice = signal<number>(10000);

  updateDynamicMaxPrice(products: Product[], accumulate = true): void {
    const maxPrice = products.reduce((max, p) => Math.max(max, p.price || 0), 0);
    if (maxPrice > 0) {
      const oldCeiling = this.dynamicMaxPrice();
      const newMax = Math.ceil(maxPrice / 100) * 100; // Round up to nearest 100
      if (!accumulate || newMax > oldCeiling) {
        this.dynamicMaxPrice.set(newMax);
        // If user hasn't set a custom max (still at old ceiling), keep it at the new ceiling
        if (this.shopMaxPrice() >= oldCeiling) {
          this.shopMaxPrice.set(newMax);
        }
      }
    }
    // Clamp down if above ceiling
    const ceiling = this.dynamicMaxPrice();
    if (ceiling > 0 && this.shopMaxPrice() > ceiling) {
      this.shopMaxPrice.set(ceiling);
    }
  }

  resetDynamicMaxPrice(): void {
    this.dynamicMaxPrice.set(0);
  }

  clearProductCaches(): void {
    this.productsByCategoryId.set({});
    this.paginatedCache.set({});
    this.productsById.set({});
    this.categoriesWithProductsCache.set({});
  }

  selectedCategory = computed(() => {
    const id = this.selectedCategoryId();
    if (id === null) return null;

    const cache = this.categoriesByParentId();
    for (const categories of Object.values(cache)) {
      const found = categories?.find(c => c.id === id);
      if (found) return found;
    }

    return null;
  });

  flatCategories = computed(() => {
    const result: Category[] = [];
    const cache = this.categoriesByParentId();

    for (const categories of Object.values(cache)) {
      if (categories) {
        result.push(...categories);
      }
    }

    return result;
  });

  getMainCategories(): Observable<Category[]> {
    const cache = this.categoriesByParentId();
    if (cache['root']) {
      return of(cache['root']);
    }

    this.categoriesLoadingFor.set('root');

    return this.http
      .get<CategoriesResponse>(`${this.baseUrl}/ecommerce/products/categories`, {
        headers: this.headers,
      })
      .pipe(
        map(res => res.categories ?? []),
        tap(cats => {
          this.categoriesByParentId.update(prev => ({
            ...prev,
            'root': cats,
          }));
          this.categoriesLoadingFor.set(null);
        }),
        catchError(() => {
          this.categoriesLoadingFor.set(null);
          return of([]);
        })
      );
  }

  getSubcategories(parentId: number | null): Observable<Category[]> {
    if (parentId === null) {
      return this.getMainCategories();
    }

    const cache = this.categoriesByParentId();
    if (cache[parentId]) {
      return of(cache[parentId]);
    }

    this.categoriesLoadingFor.set(parentId);

    return this.http
      .get<CategoriesResponse>(
        `${this.baseUrl}/ecommerce/products/categories`,
        {
          headers: this.headers,
          params: { parent_id: parentId.toString() }
        }
      )
      .pipe(
        map(res => res.categories ?? []),
        tap(subs => {
          this.categoriesByParentId.update(prev => ({
            ...prev,
            [parentId]: subs,
          }));
          this.categoriesLoadingFor.set(null);
        }),
        catchError(() => {
          this.categoriesLoadingFor.set(null);
          return of([]);
        })
      );
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  getProductsPaginated(params?: {
    category_id?: number | null;
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    min_price?: number;
    max_price?: number;
    extra_filters?: Record<string, string>;
  }): Observable<ProductsResponse> {
    const queryParams: Record<string, string | number | boolean> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    };
    if (params?.category_id) queryParams['category_id'] = params.category_id;
    if (params?.search) queryParams['search'] = params.search;
    if (params?.sort_by) queryParams['sort_by'] = params.sort_by;
    if (params?.min_price !== undefined) queryParams['min_price'] = params.min_price;
    if (params?.max_price !== undefined) queryParams['max_price'] = params.max_price;
    if (params?.extra_filters) Object.assign(queryParams, params.extra_filters);

    // Cache key based on all params
    const cacheKey = JSON.stringify(queryParams);
    const cached = this.paginatedCache()[cacheKey];
    if (cached) return of(cached);

    return this.http
      .get<ProductsResponse>(`${this.baseUrl}/ecommerce/products/`, {
        headers: this.headers,
        params: queryParams,
      })
      .pipe(
        map(response => {
          const rawItems = response?.items ?? response?.products ?? [];
          if (!response || !rawItems) {
            return { items: [], total: 0, page: 1, limit: 20, total_pages: 0 };
          }
          const totalPages = response.total_pages ?? Math.ceil((response.total || 0) / Math.max(response.limit || 20, 1));
          return {
            ...response,
            items: rawItems.map(product => this.normalizeProduct(product)),
            total_pages: totalPages,
          };
        }),
        tap(response => {
          this.paginatedCache.update(cache => ({ ...cache, [cacheKey]: response }));
        }),
        catchError(() => {
          return of({ items: [], total: 0, page: 1, limit: 20, total_pages: 0 } as ProductsResponse);
        })
      );
  }

  getProducts(params?: {
    category_id?: number | null;
    page?: number;
    limit?: number;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
  }): Observable<Product[]> {
    const hasFilters = params?.min_price !== undefined ||
                      params?.max_price !== undefined ||
                      params?.sort_by !== undefined;

    const page = params?.page ?? 1;
    const categoryKey: number | 'all' = params?.category_id ?? 'all';

    if (!hasFilters && page === 1) {
      const cached = this.productsByCategoryId()[categoryKey];
      if (cached) {
        return of(cached);
      }
    }

    const queryParams: Record<string, string | number | boolean> = {
      page: page,
      limit: params?.limit ?? 20,
    };

    if (params?.category_id) {
      queryParams['category_id'] = params.category_id;
    }
    if (params?.min_price !== undefined) {
      queryParams['min_price'] = params.min_price;
    }
    if (params?.max_price !== undefined) {
      queryParams['max_price'] = params.max_price;
    }
    if (params?.sort_by) {
      queryParams['sort_by'] = params.sort_by;
    }
    if (params?.search) {
      queryParams['search'] = params.search;
    }

    return this.http
      .get<ProductsResponse>(`${this.baseUrl}/ecommerce/products/`, {
        headers: this.headers,
        params: queryParams,
      })
      .pipe(
        map(response => {
          const rawItems = response?.items ?? response?.products ?? [];
          if (!response || !rawItems) {
            return [];
          }
          return rawItems.map(product => this.normalizeProduct(product));
        }),
        tap(products => {
          if (!hasFilters && page === 1) {
            this.productsByCategoryId.update(cache => ({
              ...cache,
              [categoryKey]: products
            }));
          }
        }),
        catchError(() => of([]))
      );
  }

  getProductsByCategory(categoryId: number, page: number = 1, limit: number = 20): Observable<Product[]> {
    return this.getProducts({
      category_id: categoryId,
      page,
      limit,
    });
  }

  getCategoriesWithProducts(parentId?: number): Observable<CategoryWithProducts[]> {
    if (parentId !== undefined) {
      const cached = this.categoriesWithProductsCache()[parentId];
      if (cached) return of(cached);
    }

    const params: Record<string, string | number> = {};
    if (parentId !== undefined) {
      params['parent_id'] = parentId;
    }

    return this.http
      .get<CategoriesWithProductsResponse>(
        `${this.baseUrl}/ecommerce/products/categories/products`,
        { headers: this.headers, params }
      )
      .pipe(
        map(response => {
          if (!response?.categories) return [];
          return response.categories.map(cat => ({
            ...cat,
            products: (cat.products || []).map(product => this.normalizeProduct(product)),
          }));
        }),
        tap(categories => {
          if (parentId !== undefined) {
            this.categoriesByParentId.update(prev => ({
              ...prev,
              [parentId]: categories,
            }));
            this.categoriesWithProductsCache.update(prev => ({
              ...prev,
              [parentId]: categories,
            }));
          }
        }),
        catchError(() => of([]))
      );
  }

  getProductById(productId: number): Observable<Product | null> {
    const cached = this.productsById()[productId];
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<{ product: Product }>(`${this.baseUrl}/ecommerce/products/${productId}`, {
        headers: this.headers,
      })
      .pipe(
        map(response => {
          if (!response || !response.product) {
            return null;
          }
          const product = response.product;
          return this.normalizeProduct(product);
        }),
        tap(product => {
          if (product) {
            this.productsById.update(cache => ({
              ...cache,
              [productId]: product
            }));
          }
        }),
        catchError(() => of(null))
      );
  }

  getFilterOptions(categoryId?: number, additionalParams?: Record<string, string | number | boolean>): Observable<{ filters: FilterField[]; brands: FilterBrand[] }> {
    const useCache = !additionalParams || Object.keys(additionalParams).length === 0;

    if (categoryId && useCache) {
      const cached = this.filterOptionsCache()[categoryId];
      if (cached) return of(cached);
    }

    const params: Record<string, string | number | boolean> = { ...additionalParams };
    if (categoryId) {
      params['category_id'] = categoryId;
    }

    return this.http
      .get<GetFiltersResponse>(`${this.baseUrl}/ecommerce/products/filters`, {
        headers: this.headers,
        params,
      })
      .pipe(
        map(response => {
          const rawFilters = response?.filters ?? [];

          const normalizedFilters: FilterField[] = (rawFilters as Array<FilterField & { fields?: FilterField[] }>).flatMap(entry => {
            if (Array.isArray(entry?.fields)) return entry.fields;
            return entry ? [entry] : [];
          });

          return {
            filters: normalizedFilters,
            brands: response?.brands || [],
          };
        }),
        tap(payload => {
          if (categoryId && useCache) {
            this.filterOptionsCache.update(prev => ({
              ...prev,
              [categoryId]: payload,
            }));
          }
        }),
        catchError(() => of({ filters: [], brands: [] }))
      );
  }

}