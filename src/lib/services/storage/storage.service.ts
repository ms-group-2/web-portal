import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  getItem(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.removeItem(key);
  }

  clear(): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.clear();
  }
}
