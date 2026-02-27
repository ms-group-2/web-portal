import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CategoriesResponse, ProductsResponse, Category, Product } from 'src/app/pages/shop/shop.models';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private headers = { 'ngrok-skip-browser-warning': 'true' };

  cartCount = signal(0);
  favorites = signal<Set<string>>(new Set());
  favoriteCount = computed(() => this.favorites().size);


  mainCategories = signal<Category[]>([]);
  mainCategoriesLoading = signal(false);
  private mainLoaded = signal(false);

  subcategoriesByParentId = signal<Record<number, Category[]>>({});
  subcategoriesLoadingFor = signal<number | null>(null);

  selectedCategoryId = signal<number | null>(null);

  selectedCategory = computed(() => {
    const id = this.selectedCategoryId();
    if (id === null) return null;

    const main = this.mainCategories().find(c => c.id === id);
    if (main) return main;

    const mapObj = this.subcategoriesByParentId();
    for (const key of Object.keys(mapObj)) {
      const found = mapObj[Number(key)]?.find(c => c.id === id);
      if (found) return found;
    }

    return null;
  });

  getMainCategories(): Observable<Category[]> {
    if (this.mainLoaded()) {
      return of(this.mainCategories());
    }

    this.mainCategoriesLoading.set(true);

    return this.http
      .get<CategoriesResponse>(`${this.baseUrl}/ecommerce/products/categories/main`, {
        headers: this.headers,
      })
      .pipe(
        map(res => res.categories ?? []),
        tap(cats => {
          this.mainCategories.set(cats);
          this.mainLoaded.set(true);
          this.mainCategoriesLoading.set(false);
        }),
        catchError(err => {
          console.error('Failed to load main categories:', err);
          this.mainCategoriesLoading.set(false);
          return of([]);
        })
      );
  }

  getSubcategories(parentId: number): Observable<Category[]> {
    const cache = this.subcategoriesByParentId();
    if (cache[parentId]) {
      return of(cache[parentId]);
    }

    this.subcategoriesLoadingFor.set(parentId);

    return this.http
      .get<CategoriesResponse>(
        `${this.baseUrl}/ecommerce/products/categories/${parentId}/subcategories`,
        { headers: this.headers }
      )
      .pipe(
        map(res => res.categories ?? []),
        tap(subs => {
          this.subcategoriesByParentId.update(prev => ({
            ...prev,
            [parentId]: subs,
          }));
          this.subcategoriesLoadingFor.set(null);
        }),
        catchError(err => {
          console.error(`Failed to load subcategories for ${parentId}:`, err);
          this.subcategoriesLoadingFor.set(null);
          return of ([]);
        })
      );
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  getProducts(params?: {
    category_id?: number | null;
    page?: number;
    limit?: number;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
  }): Observable<Product[]> {
    const queryParams: any = {
      page: params?.page ?? 1,
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

    return this.http
      .get<ProductsResponse>(`${this.baseUrl}/ecommerce/products`, {
        headers: this.headers,
        params: queryParams,
      })
      .pipe(
        map(response => response.products ?? []),
        catchError(err => {
          console.error('Failed to load products:', err);
          return of([]);
        })
      );
  }

  addToCart(product: Product): void {
    this.cartCount.update(count => count + 1);
  }

  toggleFavorite(product: Product): void {
    this.favorites.update(current => {
      const next = new Set(current);
      if (next.has(product.id)) next.delete(product.id);
      else next.add(product.id);
      return next;
    });
  }

  isFavorite(productId: string | undefined): boolean {
    return !!productId && this.favorites().has(productId);
  }
  
}