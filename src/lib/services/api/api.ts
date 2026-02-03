import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, {
      params: this.toParams(params),
    });
  }

  post<T>(path: string, body: unknown, params?: Record<string, any>): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, {
      params: this.toParams(params),
    });
  }

  put<T>(path: string, body: unknown, params?: Record<string, any>): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body, {
      params: this.toParams(params),
    });
  }

  delete<T>(path: string, params?: Record<string, any>): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, {
      params: this.toParams(params),
    });
  }

  private toParams(params?: Record<string, any>): HttpParams | undefined {
    if (!params) return undefined;

    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) continue;
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}