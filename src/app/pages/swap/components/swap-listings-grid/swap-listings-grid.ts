import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { SwapItem } from '../../swap.models';
import { SwapItemCard } from '../swap-item-card/swap-item-card';

@Component({
  selector: 'app-swap-listings-grid',
  imports: [MatIconModule, TranslatePipe, ScrollAnimateDirective, SwapItemCard],
  templateUrl: './swap-listings-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapListingsGrid {
  private router = inject(Router);

  items = input.required<SwapItem[]>();
  isLoading = input(false);

  postItem = output<void>();

  favorites = signal<Set<string>>(new Set());

  toggleFavorite(itemId: string) {
    this.favorites.update((set) => {
      const next = new Set(set);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  isFavorite(itemId: string): boolean {
    return this.favorites().has(itemId);
  }

  navigateToDetail(itemId: string) {
    this.router.navigate(['/swap', itemId]);
  }
}
