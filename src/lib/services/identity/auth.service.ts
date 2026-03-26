import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TokenManagementService } from 'lib/services/identity/token-management.service';
import { VendorService } from 'lib/services/vendor/vendor.service';

import { RegisterRequest } from './models/register.request.model';
import { VerifyRequest } from './models/verify.request.model';
import { UserResponse } from './models/user.response.model';
import { TokenResponse } from './models/token.response.model';
import { VerifyResponse } from './models/verify.response.model';
import { MessageResponse } from './models/message.response.model';
import { ChangePasswordRequest } from './models/change-password.request.model';


import { tap } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokens = inject(TokenManagementService);
  private vendorService = inject(VendorService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  user = signal<UserResponse | null>(null);
  pendingEmail = signal<string | null>(null);
  pendingRegistration = signal<{
    email: string;
    firstName: string;
    lastName: string;
    // password: string;
  } | null>(null);
  pendingPasswordReset = signal<string | null>(null);



  private baseUrl = environment.apiBaseUrl;

  isAuthenticated(): boolean {
    return this.tokens.isAuthenticated();
  }

  register(payload: RegisterRequest) {
    const body = {
      email: payload.email,
      password: payload.password,
      name: payload.firstName,
      surname: payload.lastName,
    };
    return this.http.post<UserResponse>(`${this.baseUrl}/auth/register`, body, {
      params: new HttpParams().set('showSpinner', 'true')
    });
  }

  verify(payload: VerifyRequest) {
    return this.http.post<VerifyResponse>(`${this.baseUrl}/auth/verify`, payload, {
      params: new HttpParams().set('showSpinner', 'true')
    });
  }

  login(email: string, password: string) {
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('username', email)
      .set('password', password);

    return this.http.post<TokenResponse>(`${this.baseUrl}/auth/token`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      params: new HttpParams().set('showSpinner', 'true')
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
    this.vendorService.clearVendorState();
    this.user.set(null);
    this.pendingEmail.set(null);
    this.pendingRegistration.set(null);
    this.pendingPasswordReset.set(null);

    // Clear basic cached user data (keep mocked verification keys)
    const prefixes = [
      'vipo_user_firstName',
      'vipo_user_lastName',
      'vipo_user_email',
    ];

    if (this.isBrowser) {
      try {
        const allKeys = Object.keys(localStorage);

        allKeys.forEach(key => {
          if (prefixes.some(prefix => key.startsWith(prefix))) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // ignore
      }
    }
  }

  resendVerification(email: string) {
  return this.http.post<MessageResponse>(
    `${this.baseUrl}/auth/resend-verification-code`,
    { email }
  );

  }
  
  forgotPassword(email: string) {
    return this.http.post<{ message: string; reset_token?: string }>(
      `${this.baseUrl}/auth/forgot-password`,
      { email }
    );
  }

resendPasswordResetCode(email: string, reset_token?: string) {
  const body = reset_token ? { email, reset_token } : { email };
  return this.http.post<{ message: string; reset_token?: string }>(`${this.baseUrl}/auth/resend-password-reset-code`, body);
}

validateResetCode(payload: { email: string; code: string; reset_token: string }) {
  return this.http.post<{ password_change_token: string }>(
    `${this.baseUrl}/auth/validate-reset-code`,
    payload
  );
}

setNewPassword(payload: { email: string; new_password: string; password_change_token: string }) {
  return this.http.post<{ message: string }>(`${this.baseUrl}/auth/set-new-password`, payload);
}

  googleLoginRedirect() {
    const callbackUrl = encodeURIComponent(`${window.location.origin}/auth/google-callback`);
    window.location.href = `${environment.apiBaseUrl}/auth/login/google?redirect_uri=${callbackUrl}`;
  }
  
  loadMe() {
  return this.me().pipe(
    tap(u => {
      console.log('[AuthService] setting user:', u);
      this.user.set(u);
    })
  );
  }

  changePassword(payload: ChangePasswordRequest) {
    return this.http.post<MessageResponse>(`${this.baseUrl}/auth/change-password`, payload);
  }
}
