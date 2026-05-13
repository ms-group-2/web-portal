import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SnackbarService } from 'lib/services/snackbar.service';
import { NotificationOptions, withNotification } from 'lib/utils/api-notification.util';
import {
  ReviewCreateRequest,
  ReviewUpdateRequest,
  ReviewResponse,
} from './models/booking.models';

@Injectable({ providedIn: 'root' })
export class BookingReviewApiService {
  private http = inject(HttpClient);
  private snackbar = inject(SnackbarService);
  private baseUrl = `${environment.apiBaseUrl}/booking`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  createReview(
    body: ReviewCreateRequest,
    options?: NotificationOptions,
  ): Observable<ReviewResponse> {
    return this.http
      .post<ReviewResponse>(`${this.baseUrl}/reviews`, body, {
        headers: this.headers,
      })
      .pipe(withNotification(this.snackbar, options));
  }

  updateReview(
    reviewId: string,
    body: ReviewUpdateRequest,
    options?: NotificationOptions,
  ): Observable<ReviewResponse> {
    return this.http
      .patch<ReviewResponse>(`${this.baseUrl}/reviews/${reviewId}`, body, {
        headers: this.headers,
      })
      .pipe(withNotification(this.snackbar, options));
  }

  deleteReview(
    reviewId: string,
    options?: NotificationOptions,
  ): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/reviews/${reviewId}`, {
        headers: this.headers,
      })
      .pipe(withNotification(this.snackbar, options));
  }

  getProviderReviews(providerId: string): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(
      `${this.baseUrl}/providers/${providerId}/reviews`,
      { headers: this.headers },
    );
  }
}
