import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SwapListing,
  CreateListingRequest,
  UpdateListingRequest,
  PaginationParams,
  PaginatedListingsResponse,
  UploadUrlResponse,
  TradeChain,
  VoteRequest,
  ProposalSessionResponse,
  ProposalUploadUrlRequest,
  ProposalUploadUrlResponse,
  CreateProposalRequest,
  ProposalResponse,
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

  checkCanCreateListing(profileId: string): Observable<{ canCreate: boolean; message?: string }> {
    const params = new HttpParams().set('profile_id', profileId);
    return this.http.post<SwapListing>(`${this.baseUrl}/`, {}, { params, headers: this.headers }).pipe(
      map(() => ({ canCreate: true })),
      catchError((err: HttpErrorResponse) => {
        if (err.error?.error_code === 'MONTHLY_LIMIT_REACHED') {
          return of({ canCreate: false, message: err.error.message as string });
        }
        return of({ canCreate: true });
      }),
    );
  }

  // ── Photos ────────────────────────────────────────────────

  getPhotoUploadUrl(listingId: string, filename: string): Observable<UploadUrlResponse> {
    const params = new HttpParams().set('filename', filename);
    return this.http.post<UploadUrlResponse>(
      `${this.baseUrl}/${listingId}/photos/upload-url`,
      null,
      { params, headers: this.headers },
    );
  }

  confirmPhoto(listingId: string, objectPath: string): Observable<Record<string, unknown>> {
    const params = new HttpParams().set('object_path', objectPath);
    return this.http.post<Record<string, unknown>>(
      `${this.baseUrl}/${listingId}/photos/confirm`,
      null,
      { params, headers: this.headers },
    );
  }

  /** @deprecated Use getPhotoUploadUrl + confirmPhoto instead */
  uploadPhoto(listingId: string, file: File): Observable<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Record<string, unknown>>(
      `${this.baseUrl}/${listingId}/photos`,
      formData,
      { headers: this.headers },
    );
  }

  deletePhoto(listingId: string, photoUrl: string): Observable<void> {
    const params = new HttpParams().set('photo_url', photoUrl);
    return this.http.delete<void>(`${this.baseUrl}/${listingId}/photos`, { params, headers: this.headers });
  }

  // ── Trades ────────────────────────────────────────────────

  getRecentTrades(limit = 10): Observable<TradeChain[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<TradeChain[]>(`${this.baseUrl}/trades/recent`, { params, headers: this.headers });
  }

  getMyTrades(): Observable<TradeChain[]> {
    return this.http.get<TradeChain[]>(`${this.baseUrl}/trades/`, { headers: this.headers });
  }

  voteOnTrade(chainId: string, vote: VoteRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/trades/${chainId}/vote`, vote, { headers: this.headers });
  }

  // ── Proposals ────────────────────────────────────────────

  createProposalSession(): Observable<ProposalSessionResponse> {
    return this.http.get<ProposalSessionResponse>(
      `${this.baseUrl}/proposals/session`,
      { headers: this.headers },
    );
  }

  getProposalUploadUrl(body: ProposalUploadUrlRequest): Observable<ProposalUploadUrlResponse> {
    return this.http.post<ProposalUploadUrlResponse>(
      `${this.baseUrl}/proposals/upload-url`,
      body,
      { headers: this.headers },
    );
  }

  addItemToSession(sessionId: string, body: { temp_path: string }): Observable<unknown> {
    return this.http.post(
      `${this.baseUrl}/proposals/session/${sessionId}/add-item`,
      body,
      { headers: this.headers },
    );
  }

  getMyProposals(): Observable<ProposalResponse[]> {
    return this.http.get<ProposalResponse[]>(`${this.baseUrl}/proposals/`, { headers: this.headers });
  }

  createProposal(body: CreateProposalRequest): Observable<ProposalResponse> {
    return this.http.post<ProposalResponse>(
      `${this.baseUrl}/proposals/`,
      body,
      { headers: this.headers },
    );
  }

  getProposalsForListing(listingId: string): Observable<ProposalResponse[]> {
    return this.http.get<ProposalResponse[]>(
      `${this.baseUrl}/proposals/listing/${listingId}`,
      { headers: this.headers },
    );
  }
}
