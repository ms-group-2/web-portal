import { Injectable } from '@angular/core';

const ACCESS = 'vipo_access_token';
const REFRESH = 'vipo_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenManagementService {
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS, accessToken);
    localStorage.setItem(REFRESH, refreshToken);
  }

  getAccessToken() {
    return localStorage.getItem(ACCESS);
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH);
  }

  hasAccessToken() {
    return !!this.getAccessToken();
  }

  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  }
}