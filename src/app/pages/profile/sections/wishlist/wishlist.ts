import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ProductCardComponent } from 'src/app/pages/shop/components/product-card/product-card';
import { Product } from 'src/app/pages/shop/shop.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslationService } from 'lib/services/translation.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { ShopFavoritesService } from 'lib/services/shop/shop-favorites.service';

@Component({
  selector: 'app-wishlist',
  imports: [RouterModule, MatIconModule, TranslatePipe, ProductCardComponent],
  templateUrl: './wishlist.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistComponent implements OnInit {
  private profileApi = inject(ProfileApiService);
  private favoritesService = inject(ShopFavoritesService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);

  loading = signal(true);
  favoriteProducts = signal<Product[]>([]);

  ngOnInit() {
    this.translation.loadModule('shop')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.profileApi.getWishlist(1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.favoriteProducts.set(
            response.items.map(item => ({
              ...item,
              name: item.title,
              image: item.cover_image_url,
              image_url: item.cover_image_url,
              category_id: 0,
            } as Product))
          );
          this.favoritesService.syncFavoritesFromBackend(response.items.map(item => item.id));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
