import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from 'lib/services/identity/auth.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { StorageService } from 'lib/services/storage/storage.service';

@Injectable({ providedIn: 'root' })
export class ShopFavoritesService {
  private readonly authService = inject(AuthService);
  private readonly profileApi = inject(ProfileApiService);
  private readonly storage = inject(StorageService);

  private readonly FAVORITES_STORAGE_KEY_PREFIX = 'vipo_favorites_';

  readonly favorites = signal<Set<number>>(new Set());
  readonly favoriteCount = computed(() => this.favorites().size);

  constructor() {
    this.loadForCurrentUser();

    effect(() => {
      this.authService.user();
      this.loadForCurrentUser();
    });
  }

  syncFavoritesFromBackend(productIds: number[]): void {
    this.favorites.set(new Set(productIds));
    this.saveToStorage(new Set(productIds));
  }

  toggleFavorite(productId: number): void {
    const userId = this.getCurrentUserId();

    this.favorites.update(current => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    this.saveToStorage(this.favorites());

    if (userId) {
      this.profileApi.toggleWishlist(productId).pipe(
        catchError(error => {
          console.error('Failed to toggle wishlist:', error);
          this.favorites.update(current => {
            const reverted = new Set(current);
            if (reverted.has(productId)) {
              reverted.delete(productId);
            } else {
              reverted.add(productId);
            }
            return reverted;
          });
          this.saveToStorage(this.favorites());
          return of(null);
        })
      ).subscribe();
    }
  }

  isFavorite(productId: number | undefined): boolean {
    return !!productId && this.favorites().has(productId);
  }

  clearFavorites(): void {
    this.favorites.set(new Set());
  }

  private loadForCurrentUser(): void {
    const userId = this.getCurrentUserId();
    this.favorites.set(this.loadFromStorage(userId));
  }

  private loadFromStorage(userId: string | null): Set<number> {
    const key = this.getStorageKey(userId);
    const stored = this.storage.getItem(key);
    if (!stored) {
      return new Set();
    }

    try {
      const ids = JSON.parse(stored) as number[];
      return new Set(ids);
    } catch (error) {
      console.error('Failed to parse favorites from storage:', error);
      return new Set();
    }
  }

  private saveToStorage(favorites: Set<number>): void {
    const key = this.getStorageKey(this.getCurrentUserId());
    const ids = Array.from(favorites);

    try {
      this.storage.setItem(key, JSON.stringify(ids));
    } catch (error) {
      console.error('Failed to save favorites to storage:', error);
    }
  }

  private getStorageKey(userId: string | null): string {
    return userId ? `${this.FAVORITES_STORAGE_KEY_PREFIX}${userId}` : `${this.FAVORITES_STORAGE_KEY_PREFIX}guest`;
  }

  private getCurrentUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }
}
