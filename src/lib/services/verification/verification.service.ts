import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { AuthService } from 'lib/services/identity/auth.service';
import { StorageService } from 'lib/services/storage/storage.service';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private authService = inject(AuthService);
  private storage = inject(StorageService);
  private readonly STORAGE_KEY_PREFIX = 'vipo_user_verified_';
  private readonly ID_NUMBER_KEY_PREFIX = 'vipo_user_id_number_';

  private _isVerified = signal<boolean>(false);

  isVerified = computed(() => this._isVerified());

  constructor() {
    this.loadVerificationForCurrentUser();

    effect(() => {
      this.authService.user();
      this.loadVerificationForCurrentUser();
    });
  }

  private getCurrentUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }

  private getStorageKey(userId: string | null, prefix: string): string {
    return userId ? `${prefix}${userId}` : `${prefix}guest`;
  }

  private loadVerificationForCurrentUser(): void {
    const userId = this.getCurrentUserId();
    const verified = this.getVerificationStatus(userId);
    this._isVerified.set(verified);
  }

  private getVerificationStatus(userId: string | null): boolean {
    const key = this.getStorageKey(userId, this.STORAGE_KEY_PREFIX);
    return this.storage.getItem(key) === 'true';
  }

  verify(idNumber: string): void {
    const userId = this.getCurrentUserId();
    const verifiedKey = this.getStorageKey(userId, this.STORAGE_KEY_PREFIX);
    const idNumberKey = this.getStorageKey(userId, this.ID_NUMBER_KEY_PREFIX);

    this.storage.setItem(verifiedKey, 'true');
    this.storage.setItem(idNumberKey, idNumber);
    this._isVerified.set(true);
  }

  clearVerification(): void {
    const userId = this.getCurrentUserId();
    const verifiedKey = this.getStorageKey(userId, this.STORAGE_KEY_PREFIX);
    const idNumberKey = this.getStorageKey(userId, this.ID_NUMBER_KEY_PREFIX);

    this.storage.removeItem(verifiedKey);
    this.storage.removeItem(idNumberKey);
    this._isVerified.set(false);
  }
}
