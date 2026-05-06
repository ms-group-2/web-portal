import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from 'lib/services/identity/auth.service';
import { StorageService } from 'lib/services/storage/storage.service';
import { SwapWishlistApiService } from './swap-wishlist-api.service';

@Injectable({ providedIn: 'root' })
export class SwapFavoritesService {
  private readonly authService = inject(AuthService);
  private readonly wishlistApi = inject(SwapWishlistApiService);
  private readonly storage = inject(StorageService);

  private readonly STORAGE_KEY_PREFIX = 'vipo_swap_favorites_';

  readonly favorites = signal<Set<string>>(new Set());
  readonly favoriteCount = computed(() => this.favorites().size);

  constructor() {
    this.loadForCurrentUser();

    effect(() => {
      this.authService.user();
      this.loadForCurrentUser();
    });
  }

  syncFavoritesFromBackend(listingIds: string[]): void {
    this.favorites.set(new Set(listingIds));
    this.saveToStorage(new Set(listingIds));
  }

  toggleFavorite(listingId: string): void {
    const userId = this.getCurrentUserId();

    this.favorites.update(current => {
      const next = new Set(current);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });

    this.saveToStorage(this.favorites());

    if (userId) {
      this.wishlistApi.toggleWishlist(listingId).pipe(
        catchError(() => {
          this.favorites.update(current => {
            const reverted = new Set(current);
            if (reverted.has(listingId)) {
              reverted.delete(listingId);
            } else {
              reverted.add(listingId);
            }
            return reverted;
          });
          this.saveToStorage(this.favorites());
          return of(null);
        }),
      ).subscribe();
    }
  }

  isFavorite(listingId: string): boolean {
    return this.favorites().has(listingId);
  }

  clearFavorites(): void {
    this.favorites.set(new Set());
  }

  loadWishlistFromBackend(): void {
    this.wishlistApi.getWishlist(1, 100).subscribe({
      next: (res) => this.syncFavoritesFromBackend(res.items),
    });
  }

  private loadForCurrentUser(): void {
    const userId = this.getCurrentUserId();
    this.favorites.set(this.loadFromStorage(userId));
    if (userId) {
      this.loadWishlistFromBackend();
    }
  }

  private loadFromStorage(userId: string | null): Set<string> {
    const key = this.getStorageKey(userId);
    const stored = this.storage.getItem(key);
    if (!stored) return new Set();

    try {
      return new Set(JSON.parse(stored) as string[]);
    } catch {
      return new Set();
    }
  }

  private saveToStorage(favorites: Set<string>): void {
    const key = this.getStorageKey(this.getCurrentUserId());
    try {
      this.storage.setItem(key, JSON.stringify(Array.from(favorites)));
    } catch {}
  }

  private getStorageKey(userId: string | null): string {
    return userId
      ? `${this.STORAGE_KEY_PREFIX}${userId}`
      : `${this.STORAGE_KEY_PREFIX}guest`;
  }

  private getCurrentUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }
}
