import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
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

  favoriteToggle = output<Event>();
  cardClick = output<void>();

  onToggleFavorite(event: Event) {
    event.stopPropagation();
    this.favoriteToggle.emit(event);
  }

  onCardClick() {
    this.cardClick.emit();
  }
}
