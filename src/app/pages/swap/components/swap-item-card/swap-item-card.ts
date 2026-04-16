import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { SwapItem } from '../../swap.models';

@Component({
  selector: 'app-swap-item-card',
  imports: [NgClass, MatIconModule, TranslatePipe],
  templateUrl: './swap-item-card.html',
  styleUrl: './swap-item-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapItemCard {
  item = input.required<SwapItem>();
  isHovered = input(false);
  isFavorite = input(false);

  favoriteToggle = output<Event>();

  photo = computed(() => {
    const item = this.item();
    if (item.photos?.length > 0) {
      const index = this.isHovered() && item.photos.length > 1 ? 1 : 0;
      return item.photos[index];
    }
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3C/svg%3E';
  });

  onToggleFavorite(event: Event) {
    event.stopPropagation();
    this.favoriteToggle.emit(event);
  }
}
