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

    if (body.gender !== null && body.gender !== undefined) {
      formData.append('gender', String(body.gender));
    }

    formData.append('bio', body.bio);

    // Only append avatar if it's actually a File object (not null or undefined)
    if (body.avatar instanceof File) {
      formData.append('avatar', body.avatar);
    }

    // Only include delete_avatar flag if explicitly set to true
    if (body.delete_avatar === true) {
      formData.append('delete_avatar', 'true');
    }

    return this.http.put<Profile>(`${this.baseUrl}/${profileId}`, formData);
  }
}

