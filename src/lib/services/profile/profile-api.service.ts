import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Profile, UpdateProfileRequest } from './models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/profile`;

  getProfile(profileId: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/${profileId}`);
  }

  updateProfile(body: UpdateProfileRequest): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/me`, body, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  uploadAvatar(avatar: File): Observable<Profile> {
    const formData = new FormData();
    formData.append('avatar', avatar);
    return this.http.patch<Profile>(`${this.baseUrl}/avatar`, formData);
  }

  deleteAvatar(): Observable<Profile> {
    return this.http.delete<Profile>(`${this.baseUrl}/avatar`);
  }
}

