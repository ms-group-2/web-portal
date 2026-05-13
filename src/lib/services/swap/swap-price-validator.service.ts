import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PriceValidationRequest,
  PriceValidationResponse,
} from './models/price-validation.model';

@Injectable({ providedIn: 'root' })
export class SwapPriceValidatorService {
  private http = inject(HttpClient);
  private baseUrl = 'http://10.3.12.144:8003';

  validatePrice(
    request: PriceValidationRequest
  ): Observable<PriceValidationResponse> {
    return this.http.post<PriceValidationResponse>(
      `${this.baseUrl}/api/v1/validate-price`,
      request
    );
  }
}
