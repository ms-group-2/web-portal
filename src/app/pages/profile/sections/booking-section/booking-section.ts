import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VerificationService } from 'lib/services/verification/verification.service';
import { AuthService } from 'lib/services/identity/auth.service';
import {
  BookingProviderApiService,
  ProviderProfileResponse,
} from 'lib/services/booking';

@Component({
  selector: 'app-booking-section',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './booking-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSectionComponent implements OnInit {
  private router = inject(Router);
  private translation = inject(TranslationService);
  private verificationService = inject(VerificationService);
  private providerApi = inject(BookingProviderApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  isVerified = this.verificationService.isVerified;
  providerProfile = signal<ProviderProfileResponse | null>(null);
  isProvider = signal(false);
  loading = signal(true);

  profileLoading = computed(() =>
    this.loading() || (this.auth.isAuthenticated() && !this.auth.user()),
  );

  ngOnInit(): void {
    this.translation.loadModule('profile').subscribe();
    this.loadProviderProfile();
  }

  startRegistration(): void {
    this.router.navigate(['/booking/register']);
  }

  goToDashboard(): void {
    this.router.navigate(['/booking/dashboard']);
  }

  private loadProviderProfile(): void {
    this.providerApi
      .getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.providerProfile.set(profile);
          this.isProvider.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.isProvider.set(false);
          this.loading.set(false);
        },
      });
  }
}
