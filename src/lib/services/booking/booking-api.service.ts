import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SnackbarService } from 'lib/services/snackbar.service';
import { NotificationOptions, withNotification } from 'lib/utils/api-notification.util';
import {
  BookingCreateRequest,
  BookingResponse,
  BookingSeriesCreateRequest,
  BookingSeriesResponse,
  BookingStatus,
  RescheduleBookingRequest,
} from './models/booking.models';

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private http = inject(HttpClient);
  private snackbar = inject(SnackbarService);
  private baseUrl = `${environment.apiBaseUrl}/booking/bookings`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  // ── Single Bookings ────────────────────────────────────────────

  createBooking(
    body: BookingCreateRequest,
    options?: NotificationOptions,
  ): Observable<BookingResponse> {
    return this.http
      .post<BookingResponse>(`${this.baseUrl}`, body, { headers: this.headers })
      .pipe(withNotification(this.snackbar, options));
  }

  retryPayment(
    bookingId: string,
    options?: NotificationOptions,
  ): Observable<BookingResponse> {
    return this.http
      .post<BookingResponse>(
        `${this.baseUrl}/${bookingId}/retry-payment`,
        {},
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  approveBooking(
    bookingId: string,
    options?: NotificationOptions,
  ): Observable<BookingResponse> {
    return this.http
      .patch<BookingResponse>(
        `${this.baseUrl}/${bookingId}/approve`,
        {},
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  rejectBooking(
    bookingId: string,
    options?: NotificationOptions,
  ): Observable<BookingResponse> {
    return this.http
      .patch<BookingResponse>(
        `${this.baseUrl}/${bookingId}/reject`,
        {},
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  cancelBooking(
    bookingId: string,
    options?: NotificationOptions,
  ): Observable<BookingResponse> {
    return this.http
      .patch<BookingResponse>(
        `${this.baseUrl}/${bookingId}/cancel`,
        {},
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  completeBooking(
    bookingId: string,
    options?: NotificationOptions,
  ): Observable<BookingResponse> {
    return this.http
      .patch<BookingResponse>(
        `${this.baseUrl}/${bookingId}/complete`,
        {},
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  noShowBooking(
    bookingId: string,
    options?: NotificationOptions,
  ): Observable<BookingResponse> {
    return this.http
      .patch<BookingResponse>(
        `${this.baseUrl}/${bookingId}/no-show`,
        {},
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  rescheduleBooking(
    bookingId: string,
    body: RescheduleBookingRequest,
    options?: NotificationOptions,
  ): Observable<BookingResponse> {
    return this.http
      .patch<BookingResponse>(
        `${this.baseUrl}/${bookingId}/reschedule`,
        body,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  getMyBookings(
    page = 0,
    size = 20,
    status?: BookingStatus[],
  ): Observable<BookingResponse[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status?.length) {
      status.forEach(s => (params = params.append('status', s)));
    }
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/me`, {
      params,
      headers: this.headers,
    });
  }

  // ── Series ─────────────────────────────────────────────────────

  createSeries(
    body: BookingSeriesCreateRequest,
    options?: NotificationOptions,
  ): Observable<BookingSeriesResponse> {
    return this.http
      .post<BookingSeriesResponse>(`${this.baseUrl}/series`, body, {
        headers: this.headers,
      })
      .pipe(withNotification(this.snackbar, options));
  }

  getUserSeries(): Observable<BookingSeriesResponse[]> {
    return this.http.get<BookingSeriesResponse[]>(`${this.baseUrl}/series/me`, {
      headers: this.headers,
    });
  }

  getProviderSeries(): Observable<BookingSeriesResponse[]> {
    return this.http.get<BookingSeriesResponse[]>(
      `${this.baseUrl}/series/provider`,
      { headers: this.headers },
    );
  }

  getSeries(seriesId: string): Observable<BookingSeriesResponse> {
    return this.http.get<BookingSeriesResponse>(
      `${this.baseUrl}/series/${seriesId}`,
      { headers: this.headers },
    );
  }

  cancelSeries(
    seriesId: string,
    options?: NotificationOptions,
  ): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/series/${seriesId}`, {
        headers: this.headers,
      })
      .pipe(withNotification(this.snackbar, options));
  }

  approveSeries(
    seriesId: string,
    options?: NotificationOptions,
  ): Observable<BookingSeriesResponse> {
    return this.http
      .patch<BookingSeriesResponse>(
        `${this.baseUrl}/series/${seriesId}/approve`,
        {},
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }
}
