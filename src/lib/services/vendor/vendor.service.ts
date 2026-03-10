import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  VendorProfile,
  VendorRegistration,
  VendorProductCreate,
  VendorProductUpdate,
  VendorProductsResponse,
} from 'lib/models/vendor.models';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  vendorProfile = signal<VendorProfile | null>(null);
  isVendor = signal<boolean>(false);

  getMyProfile(): Observable<VendorProfile | null> {
    return this.http
      .get<{ sellers: VendorProfile[] }>(`${this.baseUrl}/vendors/profile`, {
        headers: this.headers,
      })
      .pipe(
        map(response => response.sellers?.[0] || null),
        tap(profile => {
          if (profile) {
            this.vendorProfile.set(profile);
            this.isVendor.set(true);
          } else {
            this.vendorProfile.set(null);
            this.isVendor.set(false);
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
        tap(profile => {
          this.vendorProfile.set(profile);
          this.isVendor.set(true);
        }),
        catchError(err => {
          console.error('Failed to register as vendor:', err);
          throw err;
        })
      );
  }

  getVendorProfileByUserId(userId: string): Observable<VendorProfile | null> {
    return this.http
      .get<VendorProfile>(`${this.baseUrl}/vendors/profile/${userId}`, {
        headers: this.headers,
      })
      .pipe(
        catchError(err => {
          console.error('Failed to load vendor profile:', err);
          return of(null);
        })
      );
  }

  createProduct(supplierId: number, product: VendorProductCreate): Observable<string> {
    return this.http
      .post<string>(`${this.baseUrl}/vendors/${supplierId}/products/`, product, {
        headers: this.headers,
      })
      .pipe(
        catchError(err => {
          console.error('Failed to create product:', err);
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
              return JSON.parse(response);
            } catch {
              return [];
            }
          }
          return response?.items || response || [];
        }),
        catchError(err => {
          console.error('Failed to load products:', err);
          return of([]);
        })
      );
  }
  updateProduct(
    supplierId: number,
    productId: number,
    updates: VendorProductUpdate
  ): Observable<string> {
    return this.http
      .put<string>(
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

  deleteProduct(supplierId: number, productId: number): Observable<string> {
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
  }
}
