import { Component, ChangeDetectionStrategy, signal, computed, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of, map, catchError } from 'rxjs';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { SwapListingApiService } from 'lib/services/swap';
import { SwapFavoritesService } from 'lib/services/swap/swap-favorites.service';
import { SwapWishlistApiService } from 'lib/services/swap/swap-wishlist-api.service';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';
import { SwapItem } from '../../swap.models';
import { SwapItemCard } from '../../components/swap-item-card/swap-item-card';

type WishlistTab = 'swap' | 'shop' | 'booking';

@Component({
  selector: 'app-swap-wishlist',
  imports: [MatIconModule, Header, Footer, TranslatePipe, SwapItemCard],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapWishlist {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private listingApi = inject(SwapListingApiService);
  private wishlistApi = inject(SwapWishlistApiService);
  private favoritesService = inject(SwapFavoritesService);

  activeTab = signal<WishlistTab>('swap');
  isLoading = signal(false);
  swapWishlistItems = signal<SwapItem[]>([]);

  tabs = computed(() => [
    { id: 'swap' as WishlistTab, labelKey: 'swap.wishlist.tabSwap', icon: 'swap_horiz' },
    { id: 'shop' as WishlistTab, labelKey: 'swap.wishlist.tabShop', icon: 'shopping_bag' },
    { id: 'booking' as WishlistTab, labelKey: 'swap.wishlist.tabBooking', icon: 'event' },
  ]);

  itemCount = computed(() => {
    const tab = this.activeTab();
    if (tab === 'swap') return this.swapWishlistItems().length;
    return 0;
  });

  constructor() {
    this.loadSwapWishlist();
  }

  setTab(tab: WishlistTab) {
    this.activeTab.set(tab);
    if (tab === 'swap') {
      this.loadSwapWishlist();
    }
  }

  goBack() {
    this.router.navigate(['/swap']);
  }

  favoriteSet = computed(() => this.favoritesService.favorites());

  toggleFavorite(itemId: string) {
    this.favoritesService.toggleFavorite(itemId);
    this.swapWishlistItems.update(items => items.filter(i => i.id !== itemId));
  }

  navigateToDetail(itemId: string) {
    const tab = this.activeTab();
    if (tab === 'swap') {
      this.router.navigate(['/swap', itemId]);
    }
  }

  private loadSwapWishlist() {
    this.isLoading.set(true);

    this.wishlistApi.getWishlist(1, 100).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(res => res.items),
      catchError(() => {
        const localIds = Array.from(this.favoritesService.favorites());
        return of(localIds);
      }),
    ).subscribe(ids => {
      if (ids.length === 0) {
        this.swapWishlistItems.set([]);
        this.isLoading.set(false);
        this.favoritesService.syncFavoritesFromBackend([]);
        return;
      }

      this.favoritesService.syncFavoritesFromBackend(ids);

      forkJoin(
        ids.map(id =>
          this.listingApi.getListing(id).pipe(
            map(listing => ({
              ...listing,
              postedBy: 'User',
              postedDate: '',
            } as SwapItem)),
            catchError(() => of(null)),
          ),
        ),
      ).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(results => {
          this.swapWishlistItems.set(
            results.filter((item): item is SwapItem => item !== null),
          );
          this.isLoading.set(false);
        });
    });
  }
}
