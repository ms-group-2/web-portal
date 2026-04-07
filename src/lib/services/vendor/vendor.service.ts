import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, map, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  VendorProfile,
  VendorRegistration,
  VendorProductCreate,
  VendorProductUpdate,
  // VendorProductsResponse,
} from 'lib/models/vendor.models';
import { StorageService } from 'lib/services/storage/storage.service';

const VENDOR_REJECTED_STATUSES = new Set([
  'rejected',
  'denied',
  'declined',
  'refused',
]);

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
  isRegistrationRejected = signal<boolean>(false);

  private profileRequest$: Observable<VendorProfile | null> | null = null;

  private normalizeImageUrl(input: unknown): string {
    if (!input) {
      return '';
    }

    if (typeof input !== 'string') {
      return '';
    }

    const url = input.trim();
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

  private normalizeImageEntry(entry: unknown): string {
    if (typeof entry === 'string') {
      return this.normalizeImageUrl(entry);
    }

    if (entry && typeof entry === 'object') {
      const candidate =
        (entry as any).url ??
        (entry as any).image_url ??
        (entry as any).cover_image_url ??
        (entry as any).image;

      return this.normalizeImageUrl(candidate);
    }

    return '';
  }

  private normalizeImageList(images: unknown): string[] {
    if (!Array.isArray(images)) {
      return [];
    }

    return images
      .map((item) => this.normalizeImageEntry(item))
      .filter((url): url is string => !!url);
  }

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
          this.applyVendorStatusFromProfile(profile);
        }),
        catchError(() => {
          this.vendorProfile.set(null);
          this.isVendor.set(false);
          this.isPendingApproval.set(false);
          this.isRegistrationRejected.set(false);
          return of(null);
        })
      );
  }

  /**
   * Validates identification number against the business registry (used on step 2 blur).
   * Expects 2xx when valid; 4xx with `{ error_code, message }` when not (e.g. INVALID_ID_NUMBER).
   * If your backend uses a different path or method, change only this URL/body here.
   */
  verifyIdentificationNumber(identificationNumber: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/vendors/profile/verify-identification`,
      { identification_number: identificationNumber },
      { headers: this.headers }
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
          this.isRegistrationRejected.set(false);
          this.storage.setItem(this.PENDING_KEY, 'true');
        }),
        catchError(err => {
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
        catchError(() => of(null))
      );
  }

  createProductDraft(supplierId: number, product: VendorProductCreate): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/vendors/${supplierId}/products/`, product, { headers: this.headers })
;
  }

  uploadTaskImages(supplierId: number, taskId: string, images: File[]): Observable<any> {
    const formData = new FormData();
    images.forEach(file => formData.append('images', file));

    return this.http
      .post<any>(`${this.baseUrl}/vendors/${supplierId}/products/${taskId}/images`, formData, { headers: this.headers })
;
  }

  deleteTaskImages(supplierId: number, taskId: string, imageUrls: string[]): Observable<any> {
    return this.http
      .request<any>('DELETE', `${this.baseUrl}/vendors/${supplierId}/products/${taskId}/images`, {
        headers: this.headers,
        body: { image_urls: imageUrls },
      })
;
  }

  submitTaskProduct(supplierId: number, taskId: string): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/vendors/${supplierId}/products/${taskId}/submit`, {}, { headers: this.headers })
;
  }

  updateDraft(supplierId: number, taskId: string, updates: VendorProductUpdate): Observable<any> {
    // Backend draft-update schema is strict and expects `specifications`,
    // not `field_options`, and does not accept all product fields.
    const payload: Record<string, unknown> = {};

    const addInteger = (key: 'category_id' | 'brand_id', value: unknown, min?: number) => {
      const parsed = typeof value === 'number' ? value : Number(value);
      if (Number.isInteger(parsed) && (min === undefined || parsed >= min)) {
        payload[key] = parsed;
      }
    };

    const addNumber = (key: 'price', value: unknown, min?: number) => {
      const parsed = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(parsed) && (min === undefined || parsed >= min)) {
        payload[key] = parsed;
      }
    };

    const addString = (key: 'title' | 'description', value: unknown) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          payload[key] = trimmed;
        }
      }
    };

    addInteger('category_id', updates.category_id, 1);
    addInteger('brand_id', updates.brand_id, 0);
    addString('title', updates.title);
    addString('description', updates.description);
    addNumber('price', updates.price, 1);

    const specifications =
      (updates as any).specifications ??
      (Array.isArray(updates.field_options) ? updates.field_options : undefined);
    if (Array.isArray(specifications)) {
      const normalizedSpecs = specifications
        .map((item: any) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const fieldId = Number(item.field_id);
          const optionId = Number(item.option_id);
          if (!Number.isInteger(fieldId) || fieldId <= 0) return null;
          if (!Number.isInteger(optionId) || optionId <= 0) return null;

          return { field_id: fieldId, option_id: optionId };
        })
        .filter((item): item is { field_id: number; option_id: number } => !!item);

      payload['specifications'] = normalizedSpecs;
    }

    return this.http
      .patch<any>(`${this.baseUrl}/vendors/${supplierId}/products/${taskId}/draft`, payload, { headers: this.headers })
;
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
        catchError(() => of([]))
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
;
  }

  deleteProduct(supplierId: number, productId: number | string): Observable<string> {
    return this.http
      .delete<string>(`${this.baseUrl}/vendors/${supplierId}/products/${productId}`, {
        headers: this.headers,
      })
;
  }

  deleteDraft(supplierId: number, taskId: string): Observable<any> {
    return this.http
      .delete<any>(`${this.baseUrl}/vendors/${supplierId}/products/${taskId}/draft`, {
        headers: this.headers,
      })
;
  }

  clearVendorState(): void {
    this.vendorProfile.set(null);
    this.isVendor.set(false);
    this.isPendingApproval.set(false);
    this.isRegistrationRejected.set(false);
    this.storage.removeItem(this.PENDING_KEY);
  }

  private applyVendorStatusFromProfile(profile: VendorProfile | null): void {
    if (!profile) {
      this.vendorProfile.set(null);
      this.isVendor.set(false);
      this.isPendingApproval.set(false);
      this.isRegistrationRejected.set(false);
      return;
    }

    const raw = (profile.status || '').toLowerCase().trim();
    const normalized = raw.replace(/\s+/g, '_');
    const isPending = raw === 'pending';
    const isRejected = VENDOR_REJECTED_STATUSES.has(normalized);

    this.vendorProfile.set(profile);
    this.isPendingApproval.set(isPending);
    this.isRegistrationRejected.set(isRejected);
    this.isVendor.set(!isPending && !isRejected);

    if (isPending) {
      this.storage.setItem(this.PENDING_KEY, 'true');
    } else {
      this.storage.removeItem(this.PENDING_KEY);
    }
  }

  private loadPendingState(): boolean {
    return this.storage.getItem(this.PENDING_KEY) === 'true';
  }

  private normalizeProduct(product: any, isDraftHint: boolean): any {
    const draftData = product?.draft_data ?? product?.payload ?? product?.data ?? {};
    const status = String(product?.status ?? product?.upload_status ?? '').toLowerCase();
    const normalizedStatus = status.replace(/[\s-]+/g, '_');
    const isPendingApproval =
      normalizedStatus === 'pending' ||
      normalizedStatus === 'pending_approval' ||
      normalizedStatus === 'awaiting_approval' ||
      normalizedStatus === 'in_review' ||
      normalizedStatus === 'under_review' ||
      normalizedStatus === 'review' ||
      normalizedStatus === 'submitted' ||
      normalizedStatus === 'queued';

    const isDraft = isDraftHint && !isPendingApproval;

    const id = product?.id ?? product?.product_id ?? product?.tasRk_id;
    const coverFromProduct = this.normalizeImageUrl(product?.cover_image_url);
    const coverFromDraft = this.normalizeImageUrl(draftData?.cover_image_url);
    const fallbackCover =
      this.normalizeImageEntry(product?.image_url) ||
      this.normalizeImageEntry(draftData?.image_url) ||
      this.normalizeImageEntry(product?.image) ||
      this.normalizeImageEntry(draftData?.image);

    const cover = coverFromProduct || coverFromDraft || fallbackCover;
    const productImages = this.normalizeImageList(product?.images);
    const draftImages = this.normalizeImageList(draftData?.images);
    const images = productImages.length ? productImages : draftImages;
    const specifications = Array.isArray(product?.specifications)
      ? product.specifications
      : (Array.isArray(draftData?.specifications) ? draftData.specifications : []);
    const fieldOptionsFromSpecs = specifications
      .map((spec: any) => Number(spec?.option_id))
      .filter((id: number) => Number.isInteger(id) && id > 0);

    const merged = {
      ...draftData,
      ...product,
      source: isDraftHint ? 'draft' : 'live',
      id,
      task_id: product?.task_id ?? draftData?.task_id,
      product_id: product?.product_id ?? draftData?.product_id,
      title: product?.title ?? draftData?.title,
      description: product?.description ?? draftData?.description,
      price: product?.price ?? draftData?.price,
      sku: product?.sku ?? draftData?.sku,
      category_id: product?.category_id ?? draftData?.category_id,
      brand_id: product?.brand_id ?? draftData?.brand_id,
      field_options: product?.field_options ?? draftData?.field_options ?? fieldOptionsFromSpecs,
      specifications,
      cover_image_url: cover,
      images: images.length ? images : [],
      isDraft,
    };

    return merged;
  }
}
