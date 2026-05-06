import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { Router } from '@angular/router';

export interface SwapMyTradeCard {
  id: string;
  status: string;
  createdLabel: string;
  expiresLabel: string;
  participantItems: string[];
  steps: {
    fromTitle: string;
    toTitle: string;
    fromPhoto: string;
    toPhoto: string;
    status: string;
  }[];
  isPending: boolean;
}

@Component({
  selector: 'app-swap-my-trades',
  imports: [MatIconModule, TranslatePipe, ScrollAnimateDirective],
  templateUrl: './swap-my-trades.html',
  styleUrl: './swap-my-trades.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapMyTrades {
  private router = inject(Router);

  readonly trades = input.required<SwapMyTradeCard[]>();
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly votingChainIds = input.required<string[]>();

  readonly vote = output<{ chainId: string; accept: boolean }>();

  readonly visibleTrades = computed(() => this.trades().slice(0, 2));
  readonly hiddenTradeCount = computed(() => Math.max(this.trades().length - 2, 0));
  readonly overflowPreviewItems = computed(() => this.trades()[2]?.participantItems.slice(0, 3) ?? []);

  statusBadgeClass(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized === 'pending') {
      return 'bg-amber-100 text-amber-700';
    }
    if (normalized === 'rejected') {
      return 'bg-red-100 text-red-700';
    }
    return 'bg-emerald-100 text-emerald-700';
  }

  goToAllTrades(): void {
    this.router.navigate(['/swap/notifications'], { queryParams: { tab: 'chains' } });
  }
}
