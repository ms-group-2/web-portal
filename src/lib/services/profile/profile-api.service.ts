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
    // New API uses multipart/form-data for everything including avatar
    const formData = new FormData();

    formData.append('name', body.name);
    formData.append('surname', body.surname);

    if (body.phone_number !== undefined) {
      formData.append('phone_number', body.phone_number);
    }

    if (body.birth_date) {
      formData.append('birth_date', body.birth_date);
    }

    formData.append('location', body.location);

    // Only send gender if not null - backend doesn't support resetting to null via multipart/form-data
    if (body.gender !== null && body.gender !== undefined) {
      formData.append('gender', String(body.gender));
    }

    formData.append('bio', body.bio);

    // Add avatar file if provided
    if (body.avatar) {
      formData.append('avatar', body.avatar);
    }

    // Add delete_avatar flag if set
    if (body.delete_avatar) {
      formData.append('delete_avatar', 'true');
    }

    return this.http.put<Profile>(`${this.baseUrl}/${profileId}`, formData);
  }
}

