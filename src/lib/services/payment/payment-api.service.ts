import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SnackbarService } from 'lib/services/snackbar.service';
import { NotificationOptions, withNotification } from 'lib/utils/api-notification.util';
import {
  OrderPaginatedResponse,
  OrderResponse,
  OrderWithPaymentResponse,
} from './models/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private http = inject(HttpClient);
  private snackbar = inject(SnackbarService);
  private baseUrl = `${environment.apiBaseUrl}/payment`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  getOrderHistory(page = 1, limit = 20): Observable<OrderPaginatedResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.http.get<OrderPaginatedResponse>(this.baseUrl, {
      params,
      headers: this.headers,
    });
  }

  getOrderDetails(orderId: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.baseUrl}/${orderId}`, {
      headers: this.headers,
    });
  }

  processPayment(
    orderId: string,
    successRedirectUri?: string,
    failRedirectUri?: string,
    options?: NotificationOptions,
  ): Observable<OrderWithPaymentResponse> {
    let params = new HttpParams();
    if (successRedirectUri) {
      params = params.set('success_redirect_uri', successRedirectUri);
    }
    if (failRedirectUri) {
      params = params.set('fail_redirect_uri', failRedirectUri);
    }

    return this.http
      .post<OrderWithPaymentResponse>(
        `${this.baseUrl}/${orderId}/pay`,
        null,
        { params, headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  verifyPayment(
    orderId: string,
    options?: NotificationOptions,
  ): Observable<OrderWithPaymentResponse> {
    return this.http
      .post<OrderWithPaymentResponse>(
        `${this.baseUrl}/${orderId}/verify`,
        null,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }
}
