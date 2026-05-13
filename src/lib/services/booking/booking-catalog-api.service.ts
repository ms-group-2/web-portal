import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CategoryResponse } from './models/booking.models';

@Injectable({ providedIn: 'root' })
export class BookingCatalogApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/booking/catalog`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  private categories$: Observable<CategoryResponse[]> | null = null;

  getCategories(): Observable<CategoryResponse[]> {
    if (!this.categories$) {
      this.categories$ = this.http
        .get<CategoryResponse[]>(`${this.baseUrl}/categories`, { headers: this.headers })
        .pipe(shareReplay(1));
    }
    return this.categories$;
  }

  clearCache(): void {
    this.categories$ = null;
  }
}
