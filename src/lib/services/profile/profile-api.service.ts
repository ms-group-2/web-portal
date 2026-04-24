import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Profile, UpdateProfileRequest, VerificationStartResponse, WishlistResponse, WishlistToggleRequest, WishlistToggleResponse } from './models/profile.model';
import { SnackbarService } from 'lib/services/snackbar.service';
import { NotificationOptions, withNotification } from 'lib/utils/api-notification.util';

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private http = inject(HttpClient);
  private snackbar = inject(SnackbarService);
  private baseUrl = `${environment.apiBaseUrl}/profile`;
  private profileCache$ = new Map<string, Observable<Profile>>();

  getProfile(profileId: string): Observable<Profile> {
    if (!this.profileCache$.has(profileId)) {
      const profile$ = this.http.get<Profile>(`${this.baseUrl}/${profileId}`).pipe(
        shareReplay(1)
      );
      this.profileCache$.set(profileId, profile$);
    }
    return this.profileCache$.get(profileId)!;
  }

  updateProfile(body: UpdateProfileRequest, options?: NotificationOptions): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/`, body, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      tap(() => this.clearCache()),
      withNotification(this.snackbar, options)
    );
  }

  clearCache(): void {
    this.profileCache$.clear();
  }

  uploadAvatar(avatar: File, options?: NotificationOptions): Observable<Profile> {
    const formData = new FormData();
    formData.append('avatar', avatar);
    return this.http.patch<Profile>(`${this.baseUrl}/avatar`, formData).pipe(
      tap(() => this.clearCache()),
      withNotification(this.snackbar, options)
    );
  }

  deleteAvatar(options?: NotificationOptions): Observable<Profile> {
    return this.http.delete<Profile>(`${this.baseUrl}/avatar`).pipe(
      tap(() => this.clearCache()),
      withNotification(this.snackbar, options)
    );
  }

  getFavorites(profileId: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/${profileId}/favorites`);
  }

  getWishlist(page = 1, limit = 20): Observable<WishlistResponse> {
    return this.http.get<WishlistResponse>(`${this.baseUrl}/wishlist`, {
      params: { page, limit },
    });
  }

  toggleWishlist(productId: number): Observable<WishlistToggleResponse> {
    const body: WishlistToggleRequest = { product_id: productId };
    return this.http.post<WishlistToggleResponse>(`${this.baseUrl}/wishlist/toggle`, body);
  }

  startVerification(callbackUrl?: string): Observable<VerificationStartResponse> {
    const params: Record<string, string> = {};
    if (callbackUrl) {
      params['callback_url'] = callbackUrl;
    }
    return this.http.post<VerificationStartResponse>(`${this.baseUrl}/verify/start`, null, { params });
  }
}
