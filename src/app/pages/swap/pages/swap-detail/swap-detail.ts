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
import { MatDialog } from '@angular/material/dialog';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { SwapListingApiService, SwapOfferResponse } from 'lib/services/swap';
import { SwapFavoritesService } from 'lib/services/swap/swap-favorites.service';
import { catchError, forkJoin, of } from 'rxjs';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { Profile } from 'lib/services/profile/models/profile.model';
import { AuthService } from 'lib/services/identity/auth.service';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';
import { formatRelativeShort } from 'lib/utils/relative-time';
import { SwapItem } from '../../swap.models';
import { MOCK_SWAP_ITEMS } from '../../swap.mock-data';
import { SwapBoostDialog } from 'lib/components/swap-boost-dialog/swap-boost-dialog';
import { MessagingService } from 'lib/services/messaging/messaging.service';

@Component({
  selector: 'app-swap-detail',
  imports: [NgClass, MatIconModule, Header, Footer, TranslatePipe],
  templateUrl: './swap-detail.html',
  styleUrl: './swap-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private api = inject(SwapListingApiService);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);
  private profileApi = inject(ProfileApiService);
  private destroyRef = inject(DestroyRef);
  private messagingService = inject(MessagingService);
  private favoritesService = inject(SwapFavoritesService);

  item = signal<SwapItem | null>(null);
  posterProfile = signal<Profile | null>(null);
  isExchanged = signal(false);
  isLoading = signal(true);
  currentImageIndex = signal(0);
  isFavorited = computed(() => {
    const i = this.item();
    return !!i && this.favoritesService.isFavorite(i.id);
  });
  linkCopied = signal(false);

  isOwner = computed(() => {
    const currentUserId = this.auth.user()?.id;
    const listingOwnerId = this.item()?.owner_id;
    return !!currentUserId && !!listingOwnerId && currentUserId === listingOwnerId;
  });

  activeBoostTier = computed(() => {
    const i = this.item();
    if (!i?.boost_tier || !i.boost_expires_at) return null;
    if (new Date(i.boost_expires_at).getTime() <= Date.now()) return null;
    return i.boost_tier;
  });

  photos = computed(() => {
    const i = this.item();
    if (!i) return [];
    return normalizeSwapPhotos(i.photos);
  });

  currentPhoto = computed(() => {
    const p = this.photos();
    if (!p.length) return SWAP_PHOTO_PLACEHOLDER;
    return p[this.currentImageIndex()] ?? SWAP_PHOTO_PLACEHOLDER;
  });

  thumbnails = computed(() => this.photos().slice(0, 4));

  similarItems = computed(() => {
    const current = this.item();
    if (!current) return [];
    return MOCK_SWAP_ITEMS.filter((i) => i.id !== current.id).slice(0, 4);
  });

  similarItemPhotos = computed(() => {
    const items = this.similarItems();
    const map: Record<string, string> = {};
    for (const item of items) {
      const photos = normalizeSwapPhotos(item.photos);
      map[item.id] = photos[0] ?? SWAP_PHOTO_PLACEHOLDER;
    }
    return map;
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.loadItem(id);
          this.checkIfExchanged(id);
        }
      });
  }

  private loadItem(id: string) {
    this.isLoading.set(true);
    this.currentImageIndex.set(0);
    this.posterProfile.set(null);

    this.api
      .getListing(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (listing) => {
          const item: SwapItem = {
            ...listing,
            postedDate: formatRelativeShort(listing.created_at),
          };
          this.item.set(item);
          this.isLoading.set(false);
          if (listing.owner_id) {
            this.loadPosterProfile(listing.owner_id);
          }
        },
        error: () => {
          const mock = MOCK_SWAP_ITEMS.find((m) => m.id === id);
          if (mock) {
            this.item.set(mock);
          }
          this.isLoading.set(false);
        },
      });
  }

  private loadPosterProfile(profileId: string) {
    this.profileApi
      .getProfile(profileId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.posterProfile.set(profile),
        error: () => {},
      });
  }

  navigateToProfile() {
    const profile = this.posterProfile();
    if (profile) {
      this.router.navigate(['/user', profile.id]);
    }
  }

  goBack() {
    this.location.back();
  }

  nextImage() {
    const len = this.photos().length;
    if (len <= 1) return;
    this.currentImageIndex.update((i) => (i + 1) % len);
  }

  prevImage() {
    const len = this.photos().length;
    if (len <= 1) return;
    this.currentImageIndex.update((i) => (i - 1 + len) % len);
  }

  selectImage(index: number) {
    this.currentImageIndex.set(index);
  }

  toggleFavorite() {
    const i = this.item();
    if (i) {
      this.favoritesService.toggleFavorite(i.id);
    }
  }

  onSimilarItemClick(item: SwapItem) {
    this.router.navigate(['/swap', item.id]);
  }

  proposeSwap() {
    const item = this.item();
    if (item && !this.isExchanged()) {
      this.router.navigate(['/swap/propose', item.id]);
    }
  }

  messageUser() {
    const ownerId = this.item()?.owner_id;
    if (!ownerId) return;
    this.messagingService.startConversation(ownerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (convo) => this.router.navigate(['/messages', convo.id]),
        error: () => {},
      });
  }

  private checkIfExchanged(listingId: string) {
    this.isExchanged.set(false);

    const forItem$ = this.api.getSwapOffersForItem(listingId).pipe(
      catchError(() => of([] as SwapOfferResponse[])),
    );
    const sent$ = this.auth.isAuthenticated()
      ? this.api.getMySentSwapOffers().pipe(catchError(() => of([] as SwapOfferResponse[])))
      : of([] as SwapOfferResponse[]);

    forkJoin([forItem$, sent$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([forItem, sent]) => {
        const hasAccepted = forItem.some(o => o.status?.toLowerCase() === 'accepted')
          || sent.some(o => o.status?.toLowerCase() === 'accepted'
            && (o.sender_item_id === listingId || o.receiver_item_id === listingId));
        if (hasAccepted) this.isExchanged.set(true);
      });
  }

  shareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 1000);
    });
  }

  openBoostDialog() {
    const listing = this.item();
    if (!listing || !this.isOwner()) return;

    const dialogRef = this.dialog.open(SwapBoostDialog, {
      width: '720px',
      maxWidth: '95vw',
      data: { listingId: listing.id, title: listing.title },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((applied) => {
      if (!applied) return;
      this.loadItem(listing.id);
    });
  }
}
