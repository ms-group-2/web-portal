import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, catchError, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CategoriesResponse, CategoriesWithProductsResponse, ProductsResponse, Category, CategoryWithProducts, Product, GetFiltersResponse, FilterGroup } from 'src/app/pages/shop/shop.models';
import { AuthService } from 'lib/services/identity/auth.service';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiBaseUrl;

  private headers = { 'ngrok-skip-browser-warning': 'true' };
  private readonly FAVORITES_STORAGE_KEY_PREFIX = 'vipo_favorites_';
  private readonly CART_STORAGE_KEY_PREFIX = 'vipo_cart_';

  cartItems = signal<number[]>([]);
  cartCount = computed(() => this.cartItems().length);
  favorites = signal<Set<number>>(new Set());
  favoriteCount = computed(() => this.favorites().size);

  constructor() {
    this.loadFavoritesForCurrentUser();
    this.loadCartForCurrentUser();

    effect(() => {
      this.authService.user();
      this.loadFavoritesForCurrentUser();
      this.loadCartForCurrentUser();
    });
  }

  private getCurrentUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }

  private getFavoritesStorageKey(userId: string | null): string {
    return userId ? `${this.FAVORITES_STORAGE_KEY_PREFIX}${userId}` : `${this.FAVORITES_STORAGE_KEY_PREFIX}guest`;
  }

  private getCartStorageKey(userId: string | null): string {
    return userId ? `${this.CART_STORAGE_KEY_PREFIX}${userId}` : `${this.CART_STORAGE_KEY_PREFIX}guest`;
  }

  private loadFavoritesForCurrentUser(): void {
    const userId = this.getCurrentUserId();
    const favorites = this.loadFavoritesFromStorage(userId);
    this.favorites.set(favorites);
  }

  private loadFavoritesFromStorage(userId: string | null): Set<number> {
    try {
      const key = this.getFavoritesStorageKey(userId);
      const stored = localStorage.getItem(key);
      if (stored) {
        const ids = JSON.parse(stored) as number[];
        return new Set(ids);
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
    }
    return new Set();
  }

  private saveFavoritesToStorage(favorites: Set<number>): void {
    try {
      const userId = this.getCurrentUserId();
      const key = this.getFavoritesStorageKey(userId);
      const ids = Array.from(favorites);
      localStorage.setItem(key, JSON.stringify(ids));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }

  clearFavorites(): void {
    this.favorites.set(new Set());
  }

  private loadCartForCurrentUser(): void {
    try {
      const userId = this.getCurrentUserId();
      const key = this.getCartStorageKey(userId);
      const stored = localStorage.getItem(key);
      if (stored) {
        const ids = JSON.parse(stored) as number[];
        this.cartItems.set(ids);
        return;
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
    this.cartItems.set([]);
  }

  private saveCartToStorage(items: number[]): void {
    try {
      const userId = this.getCurrentUserId();
      const key = this.getCartStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.saveCartToStorage([]);
  }


  categoriesByParentId = signal<Partial<Record<number | 'root', Category[]>>>({});
  categoriesLoadingFor = signal<number | 'root' | null>(null);

  productsByCategoryId = signal<Partial<Record<number | 'all', Product[]>>>({});
  paginatedCache = signal<Record<string, ProductsResponse>>({});
  categoriesWithProductsCache = signal<Record<number, CategoryWithProducts[]>>({});
  filterOptionsCache = signal<Record<number, FilterGroup[]>>({});

  productsById = signal<Record<number, Product>>({});

  mainCategories = computed(() => this.categoriesByParentId()['root'] || []);

  subcategoriesByParentId = computed(() => {
    const cache = this.categoriesByParentId();
    const { root, ...rest } = cache;
    return rest as Record<number, Category[]>;
  });

  selectedCategoryId = signal<number | null>(null);
  searchQuery = signal<string>('');

  // Shared filter state for shop page
  shopSortBy = signal<string>('popular');
  shopMinPrice = signal<number>(0);
  shopMaxPrice = signal<number>(10000);

  selectedCategory = computed(() => {
    const id = this.selectedCategoryId();
    if (id === null) return null;

    const cache = this.categoriesByParentId();
    for (const key of Object.keys(cache)) {
      const found = cache[key as any]?.find(c => c.id === id);
      if (found) return found;
    }

    return null;
  });

  flatCategories = computed(() => {
    const result: Category[] = [];
    const cache = this.categoriesByParentId();

    for (const key of Object.keys(cache)) {
      const categories = cache[key as any];
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
        catchError(err => {
          console.error('Failed to load main categories:', err);
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
        catchError(err => {
          console.error(`Failed to load subcategories for ${parentId}:`, err);
          this.categoriesLoadingFor.set(null);
          return of([]);
        })
      );
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  getProductsPaginated(params?: {
    category_id?: number | null;
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    min_price?: number;
    max_price?: number;
  }): Observable<ProductsResponse> {
    const queryParams: any = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    };
    if (params?.category_id) queryParams.category_id = params.category_id;
    if (params?.search) queryParams.search = params.search;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.min_price !== undefined) queryParams.min_price = params.min_price;
    if (params?.max_price !== undefined) queryParams.max_price = params.max_price;

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
          if (!response || !response.items) {
            return { items: [], total: 0, page: 1, limit: 20, total_pages: 0 };
          }
          return {
            ...response,
            items: response.items.map(product => ({
              ...product,
              name: product.title || product.name,
              image: product.cover_image_url || product.image_url || product.image,
            })),
          };
        }),
        tap(response => {
          this.paginatedCache.update(cache => ({ ...cache, [cacheKey]: response }));
        }),
        catchError(err => {
          console.error('Failed to load products:', err);
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

    const queryParams: any = {
      page: page,
      limit: params?.limit ?? 20,
    };

    if (params?.category_id) {
      queryParams.category_id = params.category_id;
    }
    if (params?.min_price !== undefined) {
      queryParams.min_price = params.min_price;
    }
    if (params?.max_price !== undefined) {
      queryParams.max_price = params.max_price;
    }
    if (params?.sort_by) {
      queryParams.sort_by = params.sort_by;
    }
    if (params?.search) {
      queryParams.search = params.search;
    }

    return this.http
      .get<ProductsResponse>(`${this.baseUrl}/ecommerce/products/`, {
        headers: this.headers,
        params: queryParams,
      })
      .pipe(
        map(response => {
          if (!response || !response.items) {
            return [];
          }
          return response.items.map(product => ({
            ...product,
            name: product.title || product.name,
            image: product.cover_image_url || product.image_url || product.image,
          }));
        }),
        tap(products => {
          if (!hasFilters && page === 1) {
            this.productsByCategoryId.update(cache => ({
              ...cache,
              [categoryKey]: products
            }));
          }
        }),
        catchError(err => {
          console.error('Failed to load products:', err);
          return of([]);
        })
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

    const params: any = {};
    if (parentId !== undefined) {
      params.parent_id = parentId;
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
            products: (cat.products || []).map(product => ({
              ...product,
              name: product.title || product.name,
              image: product.cover_image_url || product.image_url || product.image,
            })),
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
        catchError(err => {
          console.error('Failed to load categories with products:', err);
          return of([]);
        })
      );
  }

  addToCart(product: Product): void {
    const current = this.cartItems();
    const next = [...current, product.id];
    this.cartItems.set(next);
    this.saveCartToStorage(next);
  }

  toggleFavorite(product: Product): void {
    this.favorites.update(current => {
      const next = new Set(current);
      if (next.has(product.id)) next.delete(product.id);
      else next.add(product.id);
      this.saveFavoritesToStorage(next);
      return next;
    });
  }

  isFavorite(productId: number | undefined): boolean {
    return !!productId && this.favorites().has(productId);
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
          return {
            ...product,
            name: product.title || product.name,
            image: product.cover_image_url || product.image_url || product.image,
          };
        }),
        tap(product => {
          if (product) {
            this.productsById.update(cache => ({
              ...cache,
              [productId]: product
            }));
          }
        }),
        catchError(err => {
          console.error('Failed to load product:', err);
          return of(null);
        })
      );
  }

  searchProductsPaginated(query: string, page: number = 1, limit: number = 20): Observable<ProductsResponse> {
    if (!query || query.trim().length < 2) {
      return of({ items: [], total: 0, page: 1, limit: 20, total_pages: 0 } as ProductsResponse);
    }

    return this.http
      .get<ProductsResponse>(`${this.baseUrl}/ecommerce/products/search`, {
        headers: this.headers,
        params: { q: query.trim(), page, limit },
      })
      .pipe(
        map(response => {
          if (!response || !response.items) {
            return { items: [], total: 0, page: 1, limit: 20, total_pages: 0 } as ProductsResponse;
          }
          return {
            ...response,
            items: response.items.map(product => ({
              ...product,
              name: product.title || product.name,
              image: product.cover_image_url || product.image_url || product.image,
            })),
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
          if (!response || !response.items) {
            return [];
          }
          return response.items.map(product => ({
            ...product,
            name: product.title || product.name,
            image: product.cover_image_url || product.image_url || product.image,
          }));
        }),
        catchError(err => {
          return of([]);
        })
      );
  }

  getFilterOptions(categoryId?: number): Observable<FilterGroup[]> {
    if (categoryId) {
      const cached = this.filterOptionsCache()[categoryId];
      if (cached) return of(cached);
    }

    const params: any = {};
    if (categoryId) {
      params.category_id = categoryId;
    }

    return this.http
      .get<GetFiltersResponse>(`${this.baseUrl}/ecommerce/products/filters`, {
        headers: this.headers,
        params,
      })
      .pipe(
        // timeout(15000),
        map(response => response.filters || []),
        tap(filters => {
          if (categoryId) {
            this.filterOptionsCache.update(prev => ({
              ...prev,
              [categoryId]: filters,
            }));
          }
        }),
        catchError(err => {
          console.error('Failed to load filter options:', err);
          return of([]);
        })
      );
  }

  private updateCart(next: number[]): void {
    this.cartItems.set(next);
    this.saveCartToStorage(next);
  }

  removeOneFromCart(productId: number): void {
    const current = this.cartItems();
    const index = current.indexOf(productId);
    if (index === -1) {
      return;
    }
    const next = [...current];
    next.splice(index, 1);
    this.updateCart(next);
  }

  removeAllFromCart(productId: number): void {
    const current = this.cartItems();
    const next = current.filter(id => id !== productId);
    this.updateCart(next);
  }

}