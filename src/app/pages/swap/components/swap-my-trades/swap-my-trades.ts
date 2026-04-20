import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
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
  isPending: boolean;
}

@Component({
  selector: 'app-swap-my-trades',
  standalone: true,
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
}
