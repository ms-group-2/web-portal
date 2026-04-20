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
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { SwapListingApiService } from 'lib/services/swap';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { Profile } from 'lib/services/profile/models/profile.model';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';
import { formatRelativeShort } from 'lib/utils/relative-time';
import { SwapItem } from '../../swap.models';
import { MOCK_SWAP_ITEMS } from '../../swap.mock-data';

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
  private api = inject(SwapListingApiService);
  private profileApi = inject(ProfileApiService);
  private destroyRef = inject(DestroyRef);

  item = signal<SwapItem | null>(null);
  posterProfile = signal<Profile | null>(null);
  isLoading = signal(true);
  currentImageIndex = signal(0);
  isFavorited = signal(false);

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
        if (id) this.loadItem(id);
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
            location: 'Tbilisi',
            postedDate: formatRelativeShort(listing.created_at),
          };
          this.item.set(item);
          this.isLoading.set(false);
          this.loadPosterProfile(listing.profile_id);
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
    this.router.navigate(['/swap']);
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
    this.isFavorited.update((v) => !v);
  }

  onSimilarItemClick(item: SwapItem) {
    this.router.navigate(['/swap', item.id]);
  }
}
