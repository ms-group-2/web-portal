import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, catchError, forkJoin, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CategoriesResponse, ProductsResponse, Category, Product } from 'src/app/pages/shop/shop.models';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private headers = { 'ngrok-skip-browser-warning': 'true' };

  cartCount = signal(0);
  favorites = signal<Set<number>>(new Set());
  favoriteCount = computed(() => this.favorites().size);


  categoriesByParentId = signal<Partial<Record<number | 'root', Category[]>>>({});
  categoriesLoadingFor = signal<number | 'root' | null>(null);

  mainCategories = computed(() => this.categoriesByParentId()['root'] || []);

  subcategoriesByParentId = computed(() => {
    const cache = this.categoriesByParentId();
    const { root, ...rest } = cache;
    return rest as Record<number, Category[]>;
  });

  selectedCategoryId = signal<number | null>(null);

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

  // Flat list of all categories from all levels
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
    // Check if already cached
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
    // If parentId is null, get main categories
    if (parentId === null) {
      return this.getMainCategories();
    }

    // Check cache
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
      .get<ProductsResponse>(`${this.baseUrl}/ecommerce/products/`, {
        headers: this.headers,
        params: queryParams,
      })
      .pipe(
        map(response => {
          console.log('Products API response:', response);
          if (!response || !response.items) {
            return [];
          }
          // Map API fields to component fields
          return response.items.map(product => ({
            ...product,
            name: product.title || product.name,
            image: product.image_url || product.image,
          }));
        }),
        catchError(err => {
          console.error('Failed to load products:', err);
          return of([]);
        })
      );
  }

  // Convenience method to get products by category (single category only)
  getProductsByCategory(categoryId: number, page: number = 1, limit: number = 20): Observable<Product[]> {
    return this.getProducts({
      category_id: categoryId,
      page,
      limit,
    });
  }

  // Get all subcategory IDs recursively for a given category (all levels)
  private getAllSubcategoryIds(categoryId: number): Observable<number[]> {
    return this.getSubcategories(categoryId).pipe(
      switchMap(subcategories => {
        if (!subcategories || subcategories.length === 0) {
          return of([]);
        }

        const directSubIds = subcategories.map(sub => Number(sub.id));

        // Recursively get subcategories of each subcategory
        const nestedRequests = directSubIds.map(subId =>
          this.getAllSubcategoryIds(subId).pipe(
            catchError(() => of([]))
          )
        );

        if (nestedRequests.length === 0) {
          return of(directSubIds);
        }

        // Wait for all nested subcategory fetches to complete
        return forkJoin(nestedRequests).pipe(
          map(nestedResults => {
            // Flatten all nested subcategory IDs
            const allNestedIds = nestedResults.flat();
            // Combine direct subcategories with all nested ones
            return [...directSubIds, ...allNestedIds];
          })
        );
      }),
      catchError(() => of([]))
    );
  }

  // Get products from a category AND all its direct subcategories
  getAllProductsInCategoryTree(categoryId: number, params?: {
    page?: number;
    limit?: number;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
  }): Observable<Product[]> {
    // First, get all subcategory IDs
    return this.getAllSubcategoryIds(categoryId).pipe(
      switchMap(subcategoryIds => {
        // Include the parent category ID as well
        const allCategoryIds = [categoryId, ...subcategoryIds];

        // Fetch products from all categories in parallel
        const productRequests = allCategoryIds.map(catId =>
          this.getProducts({
            category_id: catId,
            page: 1, // Always fetch first page for each category
            limit: 100, // Fetch more per category to get all products
            min_price: params?.min_price,
            max_price: params?.max_price,
            sort_by: params?.sort_by,
          }).pipe(
            catchError(err => {
              console.error(`Error fetching products for category ${catId}:`, err);
              return of([]);
            })
          )
        );

        // Wait for all requests to complete
        if (productRequests.length === 0) {
          return of([]);
        }

        return forkJoin(productRequests).pipe(
          map(resultsArray => {
            // Flatten all products from all categories
            const allProducts = resultsArray.flat();

            // Deduplicate by product ID
            const uniqueProducts = Array.from(
              new Map(allProducts.map(p => [p.id, p])).values()
            );

            return uniqueProducts;
          })
        );
      }),
      catchError(err => {
        console.error('Error in getAllProductsInCategoryTree:', err);
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

  isFavorite(productId: number | undefined): boolean {
    return !!productId && this.favorites().has(productId);
  }
  
}