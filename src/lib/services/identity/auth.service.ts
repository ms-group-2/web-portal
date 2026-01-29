import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from 'lib/services/api/api';
import { TokenManagementService } from './token-management.service';

import { LoginRequest } from './models/login.request.model';
import { LoginResponse } from './models/login.response.model';
import { RegisterRequest } from './models/register.request.model';
import { VerifyRequest } from './models/verify.request.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
  private api: ApiService,
  private tokens: TokenManagementService
) {}

  login(payload: LoginRequest) {
    return this.api.post<LoginResponse>('/auth/login', payload).pipe(
      tap(res => this.tokens.setTokens(res.access_token, res.refresh_token))
    );
  }

  register(payload: RegisterRequest) {
    return this.api.post<{}>('/auth/register', payload);
  }

  verify(payload: VerifyRequest) {
    return this.api.post<LoginResponse>('/auth/verify', payload).pipe(
      tap(res => this.tokens.setTokens(res.access_token, res.refresh_token))
    );
  }

  logout() {
    this.tokens.clear();
  }
}