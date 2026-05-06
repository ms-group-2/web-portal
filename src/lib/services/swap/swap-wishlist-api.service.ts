import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SwapWishlistToggleResponse, SwapWishlistResponse } from './models/swap-wishlist.model';

@Injectable({ providedIn: 'root' })
export class SwapWishlistApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/profile/wishlist/swap`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  toggleWishlist(listingId: string): Observable<SwapWishlistToggleResponse> {
    const url = `${this.baseUrl}/`;
    const body = { listing_id: listingId };
    console.log('[SwapWishlist] POST toggle →', url, body);
    return this.http.post<SwapWishlistToggleResponse>(url, body, { headers: this.headers }).pipe(
      tap({
        next: (res) => console.log('[SwapWishlist] toggle response:', res),
        error: (err) => console.error('[SwapWishlist] toggle error:', err.status, err.url, err),
      }),
    );
  }

  getWishlist(page = 1, limit = 20): Observable<SwapWishlistResponse> {
    const url = `${this.baseUrl}/`;
    const params = new HttpParams().set('page', page).set('limit', limit);
    console.log('[SwapWishlist] GET wishlist →', url);
    return this.http.get<SwapWishlistResponse>(url, { params, headers: this.headers }).pipe(
      tap({
        next: (res) => console.log('[SwapWishlist] wishlist response:', res),
        error: (err) => console.error('[SwapWishlist] wishlist error:', err.status, err.url, err),
      }),
    );
  }
}
