import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  AddToCartRequest,
  CartItemResponse,
  CartResponse,
  CheckoutResponse,
  MessageResponse,
  UpdateCartItemRequest,
} from 'lib/services/shop/models/shop-cart.models';

@Injectable({ providedIn: 'root' })
export class ShopCartApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly headers = { 'ngrok-skip-browser-warning': 'true' };
  private readonly cartBasePath = '/ecommerce/cart';

  getMyCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.baseUrl}${this.cartBasePath}/`, {
      headers: this.headers,
    });
  }

  addItem(payload: AddToCartRequest): Observable<CartItemResponse> {
    return this.http.post<CartItemResponse>(`${this.baseUrl}${this.cartBasePath}/items`, payload, {
      headers: this.headers,
    });
  }

  updateItem(itemId: string, payload: UpdateCartItemRequest): Observable<CartItemResponse> {
    return this.http.put<CartItemResponse>(`${this.baseUrl}${this.cartBasePath}/items/${itemId}`, payload, {
      headers: this.headers,
    });
  }

  removeItem(itemId: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}${this.cartBasePath}/items/${itemId}`, {
      headers: this.headers,
    });
  }

  checkout(): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.baseUrl}${this.cartBasePath}/checkout`, {}, {
      headers: this.headers,
    });
  }
}
