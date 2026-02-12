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

  updateProfile(profileId: string, body: UpdateProfileRequest): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/${profileId}`, body);
  }

  uploadAvatar(profileId: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<string>(`${this.baseUrl}/${profileId}/avatar`, formData);
  }
}

