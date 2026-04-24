import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SwapListing,
  CreateListingRequest,
  UpdateListingRequest,
  PaginationParams,
  PaginatedListingsResponse,

  TradeChain,
  VoteRequest,
} from './';

@Injectable({
  providedIn: 'root',
})
export class SwapListingApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/swap/listing`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  // ── Listings ──────────────────────────────────────────────

  getAllListings(pagination?: PaginationParams): Observable<PaginatedListingsResponse> {
    let params = new HttpParams();
    if (pagination?.page) params = params.set('page', pagination.page);
    if (pagination?.limit) params = params.set('limit', pagination.limit);
    return this.http.get<PaginatedListingsResponse>(`${this.baseUrl}/`, { params, headers: this.headers });
  }

  getListing(listingId: string): Observable<SwapListing> {
    return this.http.get<SwapListing>(`${this.baseUrl}/${listingId}`, { headers: this.headers });
  }

  getListingsByProfile(profileId: string, pagination?: PaginationParams): Observable<PaginatedListingsResponse> {
    let params = new HttpParams();
    if (pagination?.page) params = params.set('page', pagination.page);
    if (pagination?.limit) params = params.set('limit', pagination.limit);
    return this.http.get<PaginatedListingsResponse>(`${this.baseUrl}/profile/${profileId}`, {
      params,
      headers: this.headers,
    });
  }

  createListing(profileId: string, data: CreateListingRequest): Observable<SwapListing> {
    const params = new HttpParams().set('profile_id', profileId);
    return this.http.post<SwapListing>(`${this.baseUrl}/`, data, { params, headers: this.headers });
  }

  updateListing(listingId: string, data: UpdateListingRequest): Observable<SwapListing> {
    return this.http.put<SwapListing>(`${this.baseUrl}/${listingId}`, data, { headers: this.headers });
  }

  deleteListing(listingId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${listingId}`, { headers: this.headers });
  }

  // ── Photos ────────────────────────────────────────────────

  uploadPhoto(listingId: string, file: File): Observable<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Record<string, unknown>>(
      `${this.baseUrl}/${listingId}/photos`,
      formData,
      { headers: this.headers }
    );
  }

  deletePhoto(listingId: string, photoUrl: string): Observable<void> {
    const params = new HttpParams().set('photo_url', photoUrl);
    return this.http.delete<void>(`${this.baseUrl}/${listingId}/photos`, { params, headers: this.headers });
  }

  // ── Trades ────────────────────────────────────────────────

  getMyTrades(): Observable<TradeChain[]> {
    return this.http.get<TradeChain[]>(`${this.baseUrl}/trades/`, { headers: this.headers });
  }

  voteOnTrade(chainId: string, vote: VoteRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/trades/${chainId}/vote`, vote, { headers: this.headers });
  }
}
