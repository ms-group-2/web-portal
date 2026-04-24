import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { AuthService } from 'lib/services/identity/auth.service';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private profileApi = inject(ProfileApiService);
  private authService = inject(AuthService);

  private _isVerified = signal<boolean>(false);

  isVerified = computed(() => this._isVerified());

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user?.id) {
        if (user.is_verified) {
          this._isVerified.set(true);
          return;
        }
        this.profileApi.clearCache();
        this.profileApi.getProfile(user.id).subscribe(profile => {
          this._isVerified.set(profile.kyc_verified ?? false);
        });
      } else {
        this._isVerified.set(false);
      }
    });
  }

  setVerified(value: boolean): void {
    this._isVerified.set(value);
  }

  startVerification(callbackUrl?: string) {
    return this.profileApi.startVerification(callbackUrl);
  }
}
