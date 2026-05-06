import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SwapWishlistToggleResponse, SwapWishlistResponse } from './models/swap-wishlist.model';

@Injectable({ providedIn: 'root' })
export class SwapWishlistApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/profile/wishlist/swap`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  toggleWishlist(listingId: string): Observable<SwapWishlistToggleResponse> {
    return this.http.post<SwapWishlistToggleResponse>(
      `${this.baseUrl}/`,
      { listing_id: listingId },
      { headers: this.headers },
    );
  }

  getWishlist(page = 1, limit = 20): Observable<SwapWishlistResponse> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<SwapWishlistResponse>(
      `${this.baseUrl}/`,
      { params, headers: this.headers },
    );
  }
}
