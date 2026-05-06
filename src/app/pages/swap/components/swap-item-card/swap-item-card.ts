import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { SwapItem } from '../../swap.models';
import { SwapListingPhoto } from '../swap-listing-photo/swap-listing-photo';

@Component({
  selector: 'app-swap-item-card',
  imports: [NgClass, MatIconModule, TranslatePipe, SwapListingPhoto],
  templateUrl: './swap-item-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapItemCard {
  item = input.required<SwapItem>();
  isFavorite = input(false);
  isExchanged = input(false);

  favoriteToggle = output<Event>();
  cardClick = output<void>();

  activeBoostTier = computed(() => {
    const i = this.item();
    if (!i.boost_tier || !i.boost_expires_at) return null;
    if (new Date(i.boost_expires_at).getTime() <= Date.now()) return null;
    return i.boost_tier;
  });

  onToggleFavorite(event: Event) {
    event.stopPropagation();
    this.favoriteToggle.emit(event);
  }

  onCardClick() {
    this.cardClick.emit();
  }
}
