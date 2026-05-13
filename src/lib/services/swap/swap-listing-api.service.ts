import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SwapListing,
  CreateListingRequest,
  UpdateListingRequest,
  ListingQueryParams,
  PaginatedListingsResponse,
  TradeChain,
  VoteRequest,
  ProposalSessionResponse,
  ProposalUploadUrlRequest,
  ProposalUploadUrlResponse,
  CreateProposalRequest,
  ProposalResponse,
  MonetizationInfoResponse,
  BoostedListingsResponse,
  CategoryAttributesListResponse,
  ApplyBoostRequest,
  ApplyBoostResponse,
  CreateSwapOfferRequest,
  SwapOfferResponse,
  RespondSwapOfferRequest,
  PaginatedSwapHistoryResponse,
  SwapHistoryStatsResponse,
  SwapCategory,
} from './';

@Injectable({
  providedIn: 'root',
})
export class SwapListingApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/swap/listing`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  getAllListings(query?: ListingQueryParams): Observable<PaginatedListingsResponse> {
    let params = new HttpParams();
    if (query?.page) params = params.set('page', query.page);
    if (query?.limit) params = params.set('limit', query.limit);
    if (query?.q) params = params.set('q', query.q);
    if (query?.category_id != null) params = params.set('category_id', query.category_id);
    if (query?.sort_by) params = params.set('sort_by', query.sort_by);
    if (query?.min_price != null) params = params.set('min_price', query.min_price);
    if (query?.max_price != null) params = params.set('max_price', query.max_price);
    if (query?.status) params = params.set('status', query.status);
    return this.http.get<PaginatedListingsResponse>(`${this.baseUrl}/`, { params, headers: this.headers });
  }

  getListing(listingId: string): Observable<SwapListing> {
    return this.http.get<SwapListing>(`${this.baseUrl}/${listingId}`, { headers: this.headers });
  }

  getListingsByProfile(profileId: string, query?: ListingQueryParams): Observable<PaginatedListingsResponse> {
    let params = new HttpParams();
    if (query?.page) params = params.set('page', query.page);
    if (query?.limit) params = params.set('limit', query.limit);
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

  getSwapCategories(): Observable<SwapCategory[]> {
    return this.http.get<SwapCategory[]>(`${this.baseUrl}/categories`, { headers: this.headers });
  }

  getMonetizationInfo(): Observable<MonetizationInfoResponse> {
    return this.http.get<MonetizationInfoResponse>(`${this.baseUrl}/monetization`, { headers: this.headers });
  }

  getBoostedListings(limit = 10): Observable<BoostedListingsResponse> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<BoostedListingsResponse>(`${this.baseUrl}/boosted`, { params, headers: this.headers });
  }

  getCategoryAttributes(categoryId: number): Observable<CategoryAttributesListResponse> {
    return this.http.get<CategoryAttributesListResponse>(`${this.baseUrl}/categories/${categoryId}/attributes`, {
      headers: this.headers,
    });
  }

  applyBoost(listingId: string, payload: ApplyBoostRequest): Observable<ApplyBoostResponse> {
    return this.http.post<ApplyBoostResponse>(`${this.baseUrl}/${listingId}/boost`, payload, { headers: this.headers });
  }

  checkCanCreateListing(profileId: string): Observable<{ canCreate: boolean; message?: string }> {
    void profileId;
    return of({ canCreate: true });
  }

  uploadPhoto(listingId: string, file: File): Observable<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
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

  createSwapOffer(payload: CreateSwapOfferRequest): Observable<SwapOfferResponse[]> {
    return this.http.post<SwapOfferResponse[]>(`${this.baseUrl}/swap-offers/`, payload, { headers: this.headers });
  }

  respondToSwapOffer(offerId: string, payload: RespondSwapOfferRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/swap-offers/${offerId}/respond`, payload, { headers: this.headers });
  }

  getMySentSwapOffers(): Observable<SwapOfferResponse[]> {
    return this.http.get<SwapOfferResponse[]>(`${this.baseUrl}/swap-offers/my-offers`, { headers: this.headers });
  }

  getSwapOffersForItem(itemId: string): Observable<SwapOfferResponse[]> {
    return this.http.get<SwapOfferResponse[]>(`${this.baseUrl}/swap-offers/for-item/${itemId}`, { headers: this.headers });
  }

  getSwapHistory(params?: { type?: string; page?: number; limit?: number }): Observable<PaginatedSwapHistoryResponse> {
    let httpParams = new HttpParams();
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<PaginatedSwapHistoryResponse>(`${this.baseUrl}/swap-history/`, { params: httpParams, headers: this.headers });
  }

  getSwapHistoryStats(): Observable<SwapHistoryStatsResponse> {
    return this.http.get<SwapHistoryStatsResponse>(`${this.baseUrl}/swap-history/stats`, { headers: this.headers });
  }
}
