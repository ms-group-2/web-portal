import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SwapListing, CreateListingRequest, UpdateListingRequest, FilterListingsParams, GetAllListingsResponse} from './';

@Injectable({
  providedIn: 'root'
})
export class SwapListingApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/swap/listing/`;

  getAllListings(): Observable<GetAllListingsResponse> {
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.get<GetAllListingsResponse>(this.baseUrl, { headers });
  }

  createListing(profileId: string, data: CreateListingRequest): Observable<string> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('swap_item_title', data.swap_item_title);
    formData.append('description', data.description);

    data.files.forEach(file => {
      formData.append('files', file);
    });

    const params = new HttpParams().set('profile_id', profileId);
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.post<string>(this.baseUrl, formData, { params, headers });
  }

  updateListing(listingId: string, profileId: string, request: UpdateListingRequest): Observable<string> {
    const formData = new FormData();

    const requestData = {
      title: request.title,
      swap_item_title: request.swap_item_title,
      description: request.description
    };
    formData.append('request', JSON.stringify(requestData));

    if (request.photos_to_delete) {
      formData.append('photos_to_delete', JSON.stringify(request.photos_to_delete));
    }

    if (request.new_files) {
      request.new_files.forEach(file => {
        formData.append('new_files', file);
      });
    }

    const params = new HttpParams().set('profile_id', profileId);
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.put<string>(`${this.baseUrl}/${listingId}`, formData, { params, headers });
  }

  deleteListing(listingId: string, profileId: string): Observable<void> {
    const params = new HttpParams().set('profile_id', profileId);
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.delete<void>(`${this.baseUrl}/${listingId}`, { params, headers });
  }

  getListing(listingId: string): Observable<SwapListing> {
    return this.http.get<SwapListing>(`${this.baseUrl}/${listingId}`);
  }

  getListingsByProfile(profileId: string): Observable<GetAllListingsResponse> {
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.get<GetAllListingsResponse>(`${this.baseUrl}/profile/${profileId}`, { headers });
  }

  filterListings(filters: FilterListingsParams): Observable<string> {
    let params = new HttpParams();

    if (filters.q) params = params.set('q', filters.q);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.min_price) params = params.set('min_price', filters.min_price.toString());
    if (filters.max_price) params = params.set('max_price', filters.max_price.toString());

    return this.http.get<string>(`${this.baseUrl}/search`, { params });
  }

  getListingPhoto(filename: string): string {
    return `${this.baseUrl}/photos/${filename}`;
  }
}
