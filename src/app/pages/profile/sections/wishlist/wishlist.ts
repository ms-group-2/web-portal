import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'lib/services/shop/shop.service';
import { ProductCardComponent } from 'src/app/pages/shop/components/product-card/product-card';
import { Product } from 'src/app/pages/shop/shop.models';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslationService } from 'lib/services/translation.service';

@Component({
  selector: 'app-wishlist',
  imports: [ RouterModule, MatIconModule, TranslatePipe, ProductCardComponent],
  templateUrl: './wishlist.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistComponent implements OnInit {
  private shopService = inject(ShopService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);

  loading = signal(true);

  favoriteProducts = computed(() => {
    const favoriteIds = Array.from(this.shopService.favorites());
    const productsById = this.shopService.productsById();

    return favoriteIds
      .map(id => productsById[id])
      .filter((product): product is Product => !!product);
  });

  ngOnInit() {
    this.translation.loadModule('shop')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    const favoriteIds = Array.from(this.shopService.favorites());

    if (favoriteIds.length === 0) {
      this.loading.set(false);
      return;
    }

    const requests = favoriteIds.map(id => this.shopService.getProductById(id));

    forkJoin(requests.length > 0 ? requests : [of(null)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }
}

