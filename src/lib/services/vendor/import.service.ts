import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ImportResponse,
  ConfirmResponse,
  ProductResult,
  ReferenceDataResponse,
} from './models/import.models';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private http = inject(HttpClient);
  private baseUrl = '/import-api/api/import';

  private headers = new HttpHeaders({
    'ngrok-skip-browser-warning': 'true',
    'X-Admin-Key': environment.importAdminKey,
  });

  private referenceData$: Observable<ReferenceDataResponse> | null = null;

  uploadFile(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResponse>(`${this.baseUrl}/upload`, formData, {
      headers: this.headers,
    });
  }

  getReferenceData(): Observable<ReferenceDataResponse> {
    if (!this.referenceData$) {
      this.referenceData$ = this.http
        .get<ReferenceDataResponse>(`${this.baseUrl}/reference-data`, {
          headers: this.headers,
        })
        .pipe(shareReplay(1));
    }
    return this.referenceData$;
  }

  confirmImport(importId: string, products: ProductResult[]): Observable<ConfirmResponse> {
    return this.http.post<ConfirmResponse>(
      `${this.baseUrl}/${importId}/confirm`,
      { products },
      { headers: this.headers },
    );
  }

  getImportResult(importId: string): Observable<ImportResponse> {
    return this.http.get<ImportResponse>(`${this.baseUrl}/${importId}`, {
      headers: this.headers,
    });
  }
}
