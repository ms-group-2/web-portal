import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location, NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { Profile } from 'lib/services/profile/models/profile.model';
import { SwapListingApiService, ExchangedItemsService } from 'lib/services/swap';
import { SwapListing } from 'lib/services/swap/models/swap-listing.model';
import { MessagingService } from 'lib/services/messaging/messaging.service';
import { AuthService } from 'lib/services/identity/auth.service';
import { catchError, of } from 'rxjs';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';
import { formatRelativeShort, parseBackendDate } from 'lib/utils/relative-time';

@Component({
  selector: 'app-user-profile',
  imports: [NgClass, MatIconModule, Header, Footer, TranslatePipe],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfile {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private profileApi = inject(ProfileApiService);
  private swapApi = inject(SwapListingApiService);
  private exchangedService = inject(ExchangedItemsService);
  private messagingService = inject(MessagingService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  profile = signal<Profile | null>(null);
  listings = signal<SwapListing[]>([]);
  exchangedItemIds = this.exchangedService.ids;
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
    const date = parseBackendDate(p.created_at);
    if (Number.isNaN(date.getTime())) return '';
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
          this.exchangedService.load();
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
      .getListingsByProfile(profileId, { limit: 100 })
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
    this.location.back();
  }

  isExchanged(listingId: string): boolean {
    return this.exchangedItemIds().has(listingId);
  }

  navigateToListing(listingId: string) {
    this.router.navigate(['/swap', listingId]);
  }

  canMessage = computed(() => {
    const p = this.profile();
    const user = this.auth.user();
    if (!p || !user) return false;
    return p.id !== user.profile_id && p.id !== user.id;
  });

  messageUser(): void {
    const profileId = this.profile()?.id;
    if (!profileId) return;
    this.messagingService.startConversation(profileId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (convo) => this.router.navigate(['/messages', convo.id]),
        error: () => {},
      });
  }
}
