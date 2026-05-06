import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { SwapFavoritesService } from 'lib/services/swap/swap-favorites.service';
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
  private favoritesService = inject(SwapFavoritesService);

  items = input.required<SwapItem[]>();
  isLoading = input(false);
  searchQuery = input('');
  compactTopSpacing = input(false);

  postItem = output<void>();

  toggleFavorite(itemId: string) {
    this.favoritesService.toggleFavorite(itemId);
  }

  isFavorite(itemId: string): boolean {
    return this.favoritesService.isFavorite(itemId);
  }

  navigateToDetail(itemId: string) {
    this.router.navigate(['/swap', itemId]);
  }
}
