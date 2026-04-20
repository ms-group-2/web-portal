import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { Profile } from 'lib/services/profile/models/profile.model';
import { SwapListingApiService } from 'lib/services/swap';
import { SwapListing } from 'lib/services/swap/models/swap-listing.model';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';
import { formatRelativeShort } from 'lib/utils/relative-time';

@Component({
  selector: 'app-user-profile',
  imports: [MatIconModule, Header, Footer, TranslatePipe],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfile {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileApi = inject(ProfileApiService);
  private swapApi = inject(SwapListingApiService);
  private destroyRef = inject(DestroyRef);

  profile = signal<Profile | null>(null);
  listings = signal<SwapListing[]>([]);
  isLoading = signal(true);
  isListingsLoading = signal(true);

  initials = computed(() => {
    const p = this.profile();
    if (!p) return '?';
    return ((p.name?.[0] ?? '') + (p.surname?.[0] ?? '')).toUpperCase() || '?';
  });

  fullName = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return `${p.name} ${p.surname}`.trim();
  });

  memberSince = computed(() => {
    const p = this.profile();
    if (!p?.created_at) return '';
    const date = new Date(p.created_at);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.loadProfile(id);
          this.loadListings(id);
        }
      });
  }

  private loadProfile(profileId: string) {
    this.isLoading.set(true);
    this.profileApi
      .getProfile(profileId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private loadListings(profileId: string) {
    this.isListingsLoading.set(true);
    this.swapApi
      .getListingsByProfile(profileId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.listings.set(response.items);
          this.isListingsLoading.set(false);
        },
        error: () => {
          this.isListingsLoading.set(false);
        },
      });
  }

  getListingPhoto(listing: SwapListing): string {
    const photos = normalizeSwapPhotos(listing.photos);
    return photos[0] ?? SWAP_PHOTO_PLACEHOLDER;
  }

  getRelativeDate(dateStr: string): string {
    return formatRelativeShort(dateStr);
  }

  goBack() {
    this.router.navigate(['/swap']);
  }

  navigateToListing(listingId: string) {
    this.router.navigate(['/swap', listingId]);
  }
}
