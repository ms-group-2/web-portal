import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private platformId = inject(PLATFORM_ID);

  private get storage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  getItem(key: string): string | null {
    const store = this.storage;
    return store ? store.getItem(key) : null;
  }

  setItem(key: string, value: string): void {
    const store = this.storage;
    if (!store) return;
    try {
      store.setItem(key, value);
    } catch {
    }
  }

  removeItem(key: string): void {
    const store = this.storage;
    if (!store) return;
    try {
      store.removeItem(key);
    } catch {
    }
  }

  keysWithPrefix(prefix: string): string[] {
    const store = this.storage;
    if (!store) return [];
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
    
  }
}

