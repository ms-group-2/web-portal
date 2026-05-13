import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SnackbarService } from 'lib/services/snackbar.service';
import { NotificationOptions, withNotification } from 'lib/utils/api-notification.util';
import {
  BranchRequest,
  BranchUpdateRequest,
  BranchResponse,
  AddressRequest,
  ProviderProfileRequest,
  ProviderProfileResponse,
  ServiceOfferingRequest,
  ServiceOfferingUpdateRequest,
  ServiceOfferingResponse,
  AvailabilityRequest,
  AvailabilityResponse,
  ScheduleExceptionRequest,
  ScheduleExceptionResponse,
  ResourceRequest,
  ResourceResponse,
  LinkResourceRequest,
  SlotResponse,
} from './models/booking.models';

@Injectable({ providedIn: 'root' })
export class BookingProviderApiService {
  private http = inject(HttpClient);
  private snackbar = inject(SnackbarService);
  private baseUrl = `${environment.apiBaseUrl}/booking`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  // ── Provider Profile ───────────────────────────────────────────

  upsertProfile(body: ProviderProfileRequest): Observable<ProviderProfileResponse> {
    return this.http.post<ProviderProfileResponse>(
      `${this.baseUrl}/providers/profile`,
      body,
      { headers: this.headers },
    );
  }

  getMyProfile(): Observable<ProviderProfileResponse> {
    return this.http.get<ProviderProfileResponse>(
      `${this.baseUrl}/providers/me`,
      { headers: this.headers },
    );
  }

  getProviders(
    page = 0,
    size = 20,
    categoryId?: number,
  ): Observable<ProviderProfileResponse[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (categoryId != null) {
      params = params.set('category_id', categoryId);
    }
    return this.http.get<ProviderProfileResponse[]>(
      `${this.baseUrl}/providers`,
      { params, headers: this.headers },
    );
  }

  getProvider(providerId: string): Observable<ProviderProfileResponse> {
    return this.http.get<ProviderProfileResponse>(
      `${this.baseUrl}/providers/${providerId}`,
      { headers: this.headers },
    );
  }

  // ── Branches ───────────────────────────────────────────────────

  createBranch(body: BranchRequest): Observable<BranchResponse> {
    return this.http.post<BranchResponse>(
      `${this.baseUrl}/providers/branches`,
      body,
      { headers: this.headers },
    );
  }

  updateBranch(branchId: string, body: BranchUpdateRequest): Observable<BranchResponse> {
    return this.http.put<BranchResponse>(
      `${this.baseUrl}/providers/branches/${branchId}`,
      body,
      { headers: this.headers },
    );
  }

  deactivateBranch(branchId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/providers/branches/${branchId}`,
      { headers: this.headers },
    );
  }

  setBranchAddress(branchId: string, body: AddressRequest): Observable<BranchResponse> {
    return this.http.post<BranchResponse>(
      `${this.baseUrl}/providers/branches/${branchId}/address`,
      body,
      { headers: this.headers },
    );
  }

  getBranches(providerId: string, page = 0, size = 20): Observable<BranchResponse[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<BranchResponse[]>(
      `${this.baseUrl}/providers/${providerId}/branches`,
      { params, headers: this.headers },
    );
  }

  // ── Service Offerings ──────────────────────────────────────────

  getServices(page = 0, size = 50): Observable<ServiceOfferingResponse[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ServiceOfferingResponse[]>(
      `${this.baseUrl}/providers/services`,
      { params, headers: this.headers },
    );
  }

  createService(
    body: ServiceOfferingRequest,
    options?: NotificationOptions,
  ): Observable<ServiceOfferingResponse> {
    return this.http
      .post<ServiceOfferingResponse>(
        `${this.baseUrl}/providers/services`,
        body,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  updateService(
    serviceId: string,
    body: ServiceOfferingUpdateRequest,
    options?: NotificationOptions,
  ): Observable<ServiceOfferingResponse> {
    return this.http
      .put<ServiceOfferingResponse>(
        `${this.baseUrl}/providers/services/${serviceId}`,
        body,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  deleteService(
    serviceId: string,
    options?: NotificationOptions,
  ): Observable<void> {
    return this.http
      .delete<void>(
        `${this.baseUrl}/providers/services/${serviceId}`,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  getBranchServices(
    providerId: string,
    branchId: string,
    page = 0,
    size = 20,
  ): Observable<ServiceOfferingResponse[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ServiceOfferingResponse[]>(
      `${this.baseUrl}/providers/${providerId}/branches/${branchId}/services`,
      { params, headers: this.headers },
    );
  }

  // ── Availability ───────────────────────────────────────────────

  getAvailability(): Observable<AvailabilityResponse[]> {
    return this.http.get<AvailabilityResponse[]>(
      `${this.baseUrl}/providers/availability`,
      { headers: this.headers },
    );
  }

  setAvailability(
    body: AvailabilityRequest[],
    options?: NotificationOptions,
  ): Observable<AvailabilityResponse[]> {
    return this.http
      .put<AvailabilityResponse[]>(
        `${this.baseUrl}/providers/availability`,
        body,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  deleteAvailability(
    availabilityId: string,
    options?: NotificationOptions,
  ): Observable<void> {
    return this.http
      .delete<void>(
        `${this.baseUrl}/providers/availability/${availabilityId}`,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  getBranchAvailability(
    providerId: string,
    branchId: string,
  ): Observable<AvailabilityResponse[]> {
    return this.http.get<AvailabilityResponse[]>(
      `${this.baseUrl}/providers/${providerId}/branches/${branchId}/availability`,
      { headers: this.headers },
    );
  }

  // ── Schedule Exceptions ────────────────────────────────────────

  getScheduleExceptions(): Observable<ScheduleExceptionResponse[]> {
    return this.http.get<ScheduleExceptionResponse[]>(
      `${this.baseUrl}/providers/availability/exceptions`,
      { headers: this.headers },
    );
  }

  createScheduleException(
    body: ScheduleExceptionRequest,
    options?: NotificationOptions,
  ): Observable<ScheduleExceptionResponse> {
    return this.http
      .post<ScheduleExceptionResponse>(
        `${this.baseUrl}/providers/availability/exceptions`,
        body,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  deleteScheduleException(
    exceptionId: string,
    options?: NotificationOptions,
  ): Observable<void> {
    return this.http
      .delete<void>(
        `${this.baseUrl}/providers/availability/exceptions/${exceptionId}`,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  getBranchScheduleExceptions(
    providerId: string,
    branchId: string,
  ): Observable<ScheduleExceptionResponse[]> {
    return this.http.get<ScheduleExceptionResponse[]>(
      `${this.baseUrl}/providers/${providerId}/branches/${branchId}/availability/exceptions`,
      { headers: this.headers },
    );
  }

  // ── Resources ──────────────────────────────────────────────────

  getResources(): Observable<ResourceResponse[]> {
    return this.http.get<ResourceResponse[]>(
      `${this.baseUrl}/providers/resources`,
      { headers: this.headers },
    );
  }

  createResource(
    body: ResourceRequest,
    options?: NotificationOptions,
  ): Observable<ResourceResponse> {
    return this.http
      .post<ResourceResponse>(
        `${this.baseUrl}/providers/resources`,
        body,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  deleteResource(
    resourceId: string,
    options?: NotificationOptions,
  ): Observable<void> {
    return this.http
      .delete<void>(
        `${this.baseUrl}/providers/resources/${resourceId}`,
        { headers: this.headers },
      )
      .pipe(withNotification(this.snackbar, options));
  }

  getBranchResources(
    providerId: string,
    branchId: string,
  ): Observable<ResourceResponse[]> {
    return this.http.get<ResourceResponse[]>(
      `${this.baseUrl}/providers/${providerId}/branches/${branchId}/resources`,
      { headers: this.headers },
    );
  }

  linkResourceToService(
    serviceId: string,
    body: LinkResourceRequest,
  ): Observable<ResourceResponse> {
    return this.http.post<ResourceResponse>(
      `${this.baseUrl}/providers/services/${serviceId}/resources/link`,
      body,
      { headers: this.headers },
    );
  }

  // ── Slots ──────────────────────────────────────────────────────

  getAvailableSlots(
    providerId: string,
    serviceId: string,
    date: string,
  ): Observable<SlotResponse[]> {
    const params = new HttpParams()
      .set('service_id', serviceId)
      .set('date', date);
    return this.http.get<SlotResponse[]>(
      `${this.baseUrl}/providers/${providerId}/slots`,
      { params, headers: this.headers },
    );
  }
}
