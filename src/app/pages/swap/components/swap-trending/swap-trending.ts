import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { TrendingSwap } from '../../swap.models';

@Component({
  selector: 'app-swap-trending',
  imports: [MatIconModule, TranslatePipe, ScrollAnimateDirective],
  templateUrl: './swap-trending.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapTrending {
  trendingSwaps = input.required<TrendingSwap[]>();

  trendingIndex = signal(0);
  maxTrendingIndex = computed(() => this.trendingSwaps().length - 3);
  trendingTransform = computed(() => `translateX(-${this.trendingIndex() * 33.33}%)`);

  scrollTrending(direction: 'left' | 'right') {
    this.trendingIndex.update((i) => {
      if (direction === 'right') return Math.min(i + 1, this.maxTrendingIndex());
      return Math.max(i - 1, 0);
    });
  }
}
