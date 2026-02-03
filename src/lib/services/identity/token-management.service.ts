import { Injectable, signal } from '@angular/core';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

const ACCESS_KEY = 'vipo_access_token';
const REFRESH_KEY = 'vipo_refresh_token';
const TYPE_KEY = 'vipo_token_type';

@Injectable({ providedIn: 'root' })
export class TokenManagementService {
  private _access = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  private _refresh = signal<string | null>(localStorage.getItem(REFRESH_KEY));
  private _type = signal<string | null>(localStorage.getItem(TYPE_KEY));

  accessToken = this._access.asReadonly();
  refreshToken = this._refresh.asReadonly();
  tokenType = this._type.asReadonly();

  isAuthenticated(): boolean {
    return !!this._access();
  }

  setTokens(tokens: Tokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    localStorage.setItem(TYPE_KEY, tokens.tokenType ?? 'bearer');

    this._access.set(tokens.accessToken);
    this._refresh.set(tokens.refreshToken);
    this._type.set(tokens.tokenType ?? 'bearer');
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(TYPE_KEY);

    this._access.set(null);
    this._refresh.set(null);
    this._type.set(null);
  }
}