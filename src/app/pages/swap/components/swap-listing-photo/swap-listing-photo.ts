import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal,
  effect,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';

@Component({
  selector: 'app-swap-listing-photo',
  imports: [NgClass, TranslatePipe],
  templateUrl: './swap-listing-photo.html',
  styleUrl: './swap-listing-photo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class SwapListingPhoto {
  photos = input<unknown>([]);

  listingId = input.required<string>();

  alt = input.required<string>();

  locked = input(false);

  hoverZoom = input(true);

  private readonly previewCap = 3;

  hoveredDotIndex = signal<number | null>(null);
  private lastListingIdForReset?: string;

  normalized = computed(() => normalizeSwapPhotos(this.photos()));

  previewDots = computed(() => {
    const n = this.normalized().length;
    if (n <= 1) return [] as number[];
    const len = Math.min(n, this.previewCap);
    return Array.from({ length: len }, (_, i) => i);
  });

  activePhotoIndex = computed(() => {
    const urls = this.normalized();
    if (!urls.length) return 0;
    const h = this.hoveredDotIndex();
    if (h === null) return 0;
    const maxIdx = Math.min(urls.length - 1, this.previewCap - 1);
    return Math.min(Math.max(0, h), maxIdx);
  });

  currentPhoto = computed(() => {
    const urls = this.normalized();
    if (!urls.length) return SWAP_PHOTO_PLACEHOLDER;
    const i = this.activePhotoIndex();
    return urls[i] ?? SWAP_PHOTO_PLACEHOLDER;
  });

  showPhotoDots = computed(() => !this.locked() && this.normalized().length > 1);

  constructor() {
    effect(() => {
      const id = this.listingId();
      if (this.lastListingIdForReset !== id) {
        this.lastListingIdForReset = id;
        this.hoveredDotIndex.set(null);
      }
    });
  }

  onDotEnter(index: number, event: Event) {
    event.stopPropagation();
    this.hoveredDotIndex.set(index);
  }

  onDotsLeave() {
    this.hoveredDotIndex.set(null);
  }

  isDotActive(index: number): boolean {
    const h = this.hoveredDotIndex();
    if (h === null) return index === 0;
    return index === h;
  }
}
