import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';

export interface MyOfferCard {
  id: string;
  type: 'proposal' | 'swap-offer';
  targetListingId: string;
  status: string;
  createdLabel: string;
  message: string;
  itemTitles: string[];
  itemPhotos: string[];
}

@Component({
  selector: 'app-swap-my-offers',
  imports: [MatIconModule, RouterLink, TranslatePipe, ScrollAnimateDirective],
  templateUrl: './swap-my-offers.html',
  styleUrl: './swap-my-offers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapMyOffers {
  readonly offers = input.required<MyOfferCard[]>();
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);

  statusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'accepted': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  }
}
