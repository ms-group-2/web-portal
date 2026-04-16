import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { RecentTrade } from '../../swap.models';

@Component({
  selector: 'app-swap-recent-trades',
  imports: [NgClass, MatIconModule, TranslatePipe, ScrollAnimateDirective],
  templateUrl: './swap-recent-trades.html',
  styleUrl: './swap-recent-trades.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapRecentTrades {
  recentTrades = input.required<RecentTrade[]>();
}
