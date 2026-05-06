import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SnackbarService } from 'lib/services/snackbar.service';
import { NotificationOptions, withNotification } from 'lib/utils/api-notification.util';
import { ReminderCreateRequest, ReminderResponse } from './models/booking.models';

@Injectable({ providedIn: 'root' })
export class BookingReminderApiService {
  private http = inject(HttpClient);
  private snackbar = inject(SnackbarService);
  private baseUrl = `${environment.apiBaseUrl}/booking/bookings`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  getReminders(bookingId: string): Observable<ReminderResponse[]> {
    return this.http.get<ReminderResponse[]>(
      `${this.baseUrl}/${bookingId}/reminders`,
      { headers: this.headers },
    );
  }

  createReminder(
    bookingId: string,
    body: ReminderCreateRequest,
    options?: NotificationOptions,
  ): Observable<ReminderResponse> {
    return this.http
      .post<ReminderResponse>(
        `${this.baseUrl}/${bookingId}/reminders`,
        body,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  deleteReminder(
    bookingId: string,
    reminderId: string,
    options?: NotificationOptions,
  ): Observable<void> {
    return this.http
      .delete<void>(
        `${this.baseUrl}/${bookingId}/reminders/${reminderId}`,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }
}
