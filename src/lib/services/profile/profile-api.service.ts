import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Profile, UpdateProfileRequest } from './models/profile.model';

export interface WishlistItem {
  id: number;
  title: string;
  cover_image_url?: string;
}

export interface WishlistResponse {
  items: WishlistItem[];
  total: number;
  page: number;
  limit: number;
}

export interface WishlistToggleResponse {
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private http = inject(HttpClient);
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

  updateProfile(body: UpdateProfileRequest): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/me`, body, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      tap(() => this.clearCache())
    );
  }

  clearCache(): void {
    this.profileCache$.clear();
  }

  uploadAvatar(avatar: File): Observable<Profile> {
    const formData = new FormData();
    formData.append('avatar', avatar);
    return this.http.patch<Profile>(`${this.baseUrl}/avatar`, formData).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteAvatar(): Observable<Profile> {
    return this.http.delete<Profile>(`${this.baseUrl}/avatar`).pipe(
      tap(() => this.clearCache())
    );
  }

  getWishlist(page: number = 1, limit: number = 20): Observable<WishlistResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    return this.http.get<WishlistResponse>(`${this.baseUrl}/wishlist`, { params });
  }

  toggleWishlist(productId: number): Observable<WishlistToggleResponse> {
    return this.http.post<WishlistToggleResponse>(`${this.baseUrl}/wishlist/toggle`, {
      product_id: productId,
    });
  }
}

