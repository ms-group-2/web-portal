import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { SwapItem } from '../../swap.models';
import { SwapListingPhoto } from '../swap-listing-photo/swap-listing-photo';
import { formatRelativeShort } from 'lib/utils/relative-time';

@Component({
  selector: 'app-swap-trending',
  imports: [MatIconModule, TranslatePipe, ScrollAnimateDirective, SwapListingPhoto],
  templateUrl: './swap-trending.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapTrending {
  items = input.required<SwapItem[]>();

  trendingIndex = signal(0);
  maxTrendingIndex = computed(() => Math.max(this.items().length - 3, 0));
  trendingTransform = computed(() => `translateX(-${this.trendingIndex() * 33.33}%)`);

  scrollTrending(direction: 'left' | 'right') {
    this.trendingIndex.update((i) => {
      if (direction === 'right') return Math.min(i + 1, this.maxTrendingIndex());
      return Math.max(i - 1, 0);
    });
  }

  postedDisplay(item: SwapItem): string {
    return item.postedDate ?? formatRelativeShort(item.created_at);
  }
}
