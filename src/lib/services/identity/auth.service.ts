import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TokenManagementService } from './token-management.service';

import { RegisterRequest } from './models/register.request.model';
import { VerifyRequest } from './models/verify.request.model';
import { UserResponse } from './models/user.response.model';
import { TokenResponse } from './models/token.response.model';

type VerifyResponse = UserResponse & {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokens = inject(TokenManagementService);

  user = signal<UserResponse | null>(null);
  pendingEmail = signal<string | null>(null);



  private baseUrl = environment.apiBaseUrl; // "/api"

  isAuthenticated(): boolean {
    return this.tokens.isAuthenticated();
  }

  register(payload: RegisterRequest) {
    const body = { email: payload.email, password: payload.password };
    return this.http.post<UserResponse>(`${this.baseUrl}/auth/register`, body);
  }

  verify(payload: VerifyRequest) {
    return this.http.post<VerifyResponse>(`${this.baseUrl}/auth/verify`, payload);
  }

  login(email: string, password: string) {
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('username', email)
      .set('password', password);

    return this.http.post<TokenResponse>(`${this.baseUrl}/auth/token`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }
    refresh() {
    const refreshToken = this.tokens.refreshToken();

    return this.http.post<TokenResponse>(
      `${this.baseUrl}/auth/refresh`,
      null,
      refreshToken ? { headers: { Authorization: `Bearer ${refreshToken}` } } : undefined
    );
  }

  me() {
    return this.http.get<UserResponse>(`${this.baseUrl}/auth/me`);
  }

  setTokensFromResponse(res: { access_token: string; refresh_token: string; token_type: string }) {
    this.tokens.setTokens({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      tokenType: res.token_type,
    });
  }

  logout() {
    this.tokens.clear();
    this.user.set(null);
    this.pendingEmail.set(null);
  }

  resendVerification(email: string) {
  return this.http.post<{ message: string }>(
    `${this.baseUrl}/auth/resend-verification-code`,
    { email }
  );
  }
  googleLoginRedirect() {
  window.location.href = `${environment.oauthBaseUrl}/auth/login/google`;
  }
}