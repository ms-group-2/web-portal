import { Injectable, signal, computed, inject, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

  private destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user?.id) {
        this.profileApi.clearCache();
        this.profileApi.getProfile(user.id).pipe(
          takeUntilDestroyed(this.destroyRef),
        ).subscribe(profile => {
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
