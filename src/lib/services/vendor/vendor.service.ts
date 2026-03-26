import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, map, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  VendorProfile,
  VendorRegistration,
  VendorProductCreate,
  VendorProductUpdate,
  VendorProductsResponse,
} from 'lib/models/vendor.models';
import { StorageService } from 'lib/services/storage/storage.service';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;
  private headers = { 'ngrok-skip-browser-warning': 'true' };
  private storage = inject(StorageService);

  private readonly PENDING_KEY = 'vipo_vendor_pending';

  vendorProfile = signal<VendorProfile | null>(null);
  isVendor = signal<boolean>(false);
  isPendingApproval = signal<boolean>(this.loadPendingState());

  private profileRequest$: Observable<VendorProfile | null> | null = null;

  ensureProfileLoaded(): Observable<VendorProfile | null> {
    if (this.vendorProfile()) return of(this.vendorProfile());
    if (!this.profileRequest$) {
      this.profileRequest$ = this.getMyProfile().pipe(
        tap(() => this.profileRequest$ = null),
        catchError(err => {
          this.profileRequest$ = null;
          throw err;
        }),
        shareReplay(1)
      );
    }
    return this.profileRequest$;
  }

  getMyProfile(): Observable<VendorProfile | null> {
    return this.http
      .get<{ sellers: VendorProfile[] }>(`${this.baseUrl}/vendors/profile`, {
        headers: this.headers,
      })
      .pipe(
        map(response => response.sellers?.[0] || null),
        tap(profile => {
          if (profile) {
            const status = (profile.status || '').toLowerCase();
            const isPending = status === 'pending';

            this.vendorProfile.set(profile);
            this.isVendor.set(!isPending);
            this.isPendingApproval.set(isPending);

            if (isPending) {
              this.storage.setItem(this.PENDING_KEY, 'true');
            } else {
              this.storage.removeItem(this.PENDING_KEY);
            }
          } else {
            this.vendorProfile.set(null);
            this.isVendor.set(false);
            this.isPendingApproval.set(false);
          }
        }),
        catchError(err => {
          console.error('Failed to load vendor profile:', err);
          this.vendorProfile.set(null);
          this.isVendor.set(false);
          return of(null);
        })
      );
  }

  registerAsVendor(data: VendorRegistration): Observable<VendorProfile | null> {
    return this.http
      .post<VendorProfile>(`${this.baseUrl}/vendors/profile`, data, {
        headers: this.headers,
      })
      .pipe(
        tap((profile) => {
          this.vendorProfile.set(profile);
          this.isVendor.set(false);
          this.isPendingApproval.set(true);
          this.storage.setItem(this.PENDING_KEY, 'true');
        }),
        catchError(err => {
          console.error('Failed to register as vendor:', err);
          throw err;
        })
      );
  }

  getVendorProfileByUserId(supplierId: string | number): Observable<VendorProfile | null> {
    return this.http
      .get<VendorProfile>(`${this.baseUrl}/vendors/profile/${supplierId}`, {
        headers: this.headers,
      })
      .pipe(
        catchError(err => {
          console.error('Failed to load vendor profile:', err);
          return of(null);
        })
      );
  }

  createProductDraft(supplierId: number, product: VendorProductCreate): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/vendors/${supplierId}/products/`, product, { headers: this.headers })
      .pipe(
        catchError(err => {
          console.error('Failed to create product draft:', err);
          throw err;
        })
      );
  }

  uploadTaskImages(supplierId: number, taskId: string, images: File[]): Observable<any> {
    const formData = new FormData();
    images.forEach(file => formData.append('images', file));

    return this.http
      .post<any>(`${this.baseUrl}/vendors/${supplierId}/products/${taskId}/images`, formData, { headers: this.headers })
      .pipe(
        catchError(err => {
          console.error('Failed to upload task images:', err);
          throw err;
        })
      );
  }

  deleteTaskImages(supplierId: number, taskId: string, imageUrls: string[]): Observable<any> {
    return this.http
      .request<any>('DELETE', `${this.baseUrl}/vendors/${supplierId}/products/${taskId}/images`, {
        headers: this.headers,
        body: { image_urls: imageUrls },
      })
      .pipe(
        catchError(err => {
          console.error('Failed to delete task images:', err);
          throw err;
        })
      );
  }

  submitTaskProduct(supplierId: number, taskId: string): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/vendors/${supplierId}/products/${taskId}/submit`, {}, { headers: this.headers })
      .pipe(
        catchError(err => {
          console.error('Failed to submit product task:', err);
          throw err;
        })
      );
  }

  updateDraft(supplierId: number, taskId: string, updates: VendorProductUpdate): Observable<any> {
    return this.http
      .patch<any>(`${this.baseUrl}/vendors/${supplierId}/products/${taskId}/draft`, updates, { headers: this.headers })
      .pipe(
        catchError(err => {
          console.error('Failed to update draft:', err);
          throw err;
        })
      );
  }

  getMyProducts(supplierId: number, page: number = 1, limit: number = 20): Observable<any[]> {
    return this.http
      .get<any>(`${this.baseUrl}/vendors/${supplierId}/products/`, {
        headers: this.headers,
        params: { page: page.toString(), limit: limit.toString() },
      })
      .pipe(
        map(response => {
          if (typeof response === 'string') {
            try {
              response = JSON.parse(response);
            } catch {
              return [];
            }
          }

          const asArray = (value: any): any[] => (Array.isArray(value) ? value : []);

          const drafts = asArray(response?.drafts).map((d: any) => this.normalizeProduct(d, true));

          const liveProducts = asArray(response?.live_products?.items).map((p: any) => this.normalizeProduct(p, false));

          if (drafts.length || liveProducts.length) {
            return [...drafts, ...liveProducts];
          }

          const genericItems = asArray(response?.items).map((p: any) => this.normalizeProduct(p, false));
          if (genericItems.length) {
            return genericItems;
          }

          const products = asArray(response?.products).map((p: any) => this.normalizeProduct(p, false));
          return products;
        }),
        catchError(err => {
          console.error('Failed to load products:', err);
          return of([]);
        })
      );
  }

  getProductById(supplierId: number, productId: string | number): Observable<any> {
    return this.getMyProducts(supplierId, 1, 100).pipe(
      map(products => {
        const key = String(productId);
        const product = products.find(p => {
          const idMatch = p?.id != null && String(p.id) === key;
          const productIdMatch = p?.product_id != null && String(p.product_id) === key;
          const taskIdMatch = p?.task_id != null && String(p.task_id) === key;
          return idMatch || productIdMatch || taskIdMatch;
        });
        if (!product) {
          throw new Error('Product not found');
        }
        return product;
      }),
      catchError(err => {
        console.error('Failed to find product:', err);
        throw err;
      })
    );
  }
  updateProduct(
    supplierId: number,
    productId: number | string,
    updates: VendorProductUpdate
  ): Observable<any> {
    return this.http
      .put<any>(
        `${this.baseUrl}/vendors/${supplierId}/products/${productId}`,
        updates,
        { headers: this.headers }
      )
      .pipe(
        catchError(err => {
          console.error('Failed to update product:', err);
          throw err;
        })
      );
  }

  deleteProduct(supplierId: number, productId: number | string): Observable<string> {
    return this.http
      .delete<string>(`${this.baseUrl}/vendors/${supplierId}/products/${productId}`, {
        headers: this.headers,
      })
      .pipe(
        catchError(err => {
          console.error('Failed to delete product:', err);
          throw err;
        })
      );
  }

  clearVendorState(): void {
    this.vendorProfile.set(null);
    this.isVendor.set(false);
    this.isPendingApproval.set(false);
    this.storage.removeItem(this.PENDING_KEY);
  }

  private loadPendingState(): boolean {
    return this.storage.getItem(this.PENDING_KEY) === 'true';
  }

  private normalizeProduct(product: any, isDraftHint: boolean): any {
    const draftData = product?.draft_data ?? product?.payload ?? product?.data ?? {};
    const status = String(product?.status ?? product?.upload_status ?? '').toLowerCase();

    const isDraft =
      isDraftHint ||
      !!product?.isDraft ||
      !!product?.task_id ||
      status === 'draft' ||
      status.includes('draft');

    const id = product?.id ?? product?.product_id ?? product?.task_id;
    const merged = {
      ...draftData,
      ...product,
      id,
      task_id: product?.task_id ?? draftData?.task_id,
      product_id: product?.product_id ?? draftData?.product_id,
      title: product?.title ?? draftData?.title,
      description: product?.description ?? draftData?.description,
      price: product?.price ?? draftData?.price,
      sku: product?.sku ?? draftData?.sku,
      category_id: product?.category_id ?? draftData?.category_id,
      brand_id: product?.brand_id ?? draftData?.brand_id,
      field_options: product?.field_options ?? draftData?.field_options ?? [],
      cover_image_url: product?.cover_image_url ?? draftData?.cover_image_url,
      images: product?.images ?? draftData?.images ?? [],
      isDraft,
    };

    return merged;
  }
}
