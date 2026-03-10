import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private readonly STORAGE_KEY = 'vipo_user_verified';

  private _isVerified = signal<boolean>(this.getVerificationStatus());

  isVerified = computed(() => this._isVerified());

  private getVerificationStatus(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  verify(idNumber: string): void {
    localStorage.setItem(this.STORAGE_KEY, 'true');
    localStorage.setItem('vipo_user_id_number', idNumber);
    this._isVerified.set(true);
  }


  clearVerification(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('vipo_user_id_number');
    this._isVerified.set(false);
  }
}
