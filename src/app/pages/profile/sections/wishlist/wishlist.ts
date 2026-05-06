import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, map, catchError } from 'rxjs';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { ShopFavoritesService } from 'lib/services/shop/shop-favorites.service';
import { SwapListingApiService } from 'lib/services/swap';
import { SwapFavoritesService } from 'lib/services/swap/swap-favorites.service';
import { SwapWishlistApiService } from 'lib/services/swap/swap-wishlist-api.service';
import { Product } from 'src/app/pages/shop/shop.models';
import { ProductCardComponent } from 'src/app/pages/shop/components/product-card/product-card';
import { SwapItem } from 'src/app/pages/swap/swap.models';
import { SwapItemCard } from 'src/app/pages/swap/components/swap-item-card/swap-item-card';

type WishlistTab = 'swap' | 'shop' | 'booking';

@Component({
  selector: 'app-wishlist',
  imports: [NgClass, MatIconModule, TranslatePipe, ProductCardComponent, SwapItemCard],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);
  private profileApi = inject(ProfileApiService);
  private shopFavoritesService = inject(ShopFavoritesService);
  private swapListingApi = inject(SwapListingApiService);
  private swapWishlistApi = inject(SwapWishlistApiService);
  private swapFavoritesService = inject(SwapFavoritesService);

  activeTab = signal<WishlistTab>('swap');
  loading = signal(false);
  shopProducts = signal<Product[]>([]);
  swapItems = signal<SwapItem[]>([]);

  swapFavoriteSet = computed(() => this.swapFavoritesService.favorites());

  tabs: { id: WishlistTab; labelKey: string; icon: string }[] = [
    { id: 'swap', labelKey: 'swap.wishlist.tabSwap', icon: 'swap_horiz' },
    { id: 'shop', labelKey: 'swap.wishlist.tabShop', icon: 'shopping_bag' },
    { id: 'booking', labelKey: 'swap.wishlist.tabBooking', icon: 'event' },
  ];

  itemCount = computed(() => {
    const tab = this.activeTab();
    if (tab === 'swap') return this.swapItems().length;
    if (tab === 'shop') return this.shopProducts().length;
    return 0;
  });

  ngOnInit() {
    this.translation.loadModule('swap').pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.translation.loadModule('shop').pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.loadSwapWishlist();
  }

  setTab(tab: WishlistTab) {
    this.activeTab.set(tab);
    if (tab === 'swap' && this.swapItems().length === 0) this.loadSwapWishlist();
    if (tab === 'shop' && this.shopProducts().length === 0) this.loadShopWishlist();
  }

  toggleSwapFavorite(itemId: string) {
    this.swapFavoritesService.toggleFavorite(itemId);
    this.swapItems.update(items => items.filter(i => i.id !== itemId));
  }

  navigateToSwapDetail(itemId: string) {
    this.router.navigate(['/swap', itemId]);
  }

  private loadSwapWishlist() {
    this.loading.set(true);
    this.swapWishlistApi.getWishlist(1, 100).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(res => res.items),
      catchError(() => of(Array.from(this.swapFavoritesService.favorites()))),
    ).subscribe(ids => {
      if (ids.length === 0) {
        this.swapItems.set([]);
        this.loading.set(false);
        this.swapFavoritesService.syncFavoritesFromBackend([]);
        return;
      }
      this.swapFavoritesService.syncFavoritesFromBackend(ids);
      forkJoin(
        ids.map(id =>
          this.swapListingApi.getListing(id).pipe(
            map(listing => ({ ...listing, postedDate: '' } as SwapItem)),
            catchError(() => of(null)),
          ),
        ),
      ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(results => {
        this.swapItems.set(results.filter((item): item is SwapItem => item !== null));
        this.loading.set(false);
      });
    });
  }

  private loadShopWishlist() {
    this.loading.set(true);
    this.profileApi.getWishlist(1, 100).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.shopProducts.set(
          response.items.map(item => ({
            ...item,
            name: item.title,
            image: item.cover_image_url,
            image_url: item.cover_image_url,
            category_id: 0,
          } as Product)),
        );
        this.shopFavoritesService.syncFavoritesFromBackend(response.items.map(item => item.id));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
