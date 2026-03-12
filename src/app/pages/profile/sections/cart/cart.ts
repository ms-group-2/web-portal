import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'lib/services/shop/shop.service';
import { ProductCardComponent } from 'src/app/pages/shop/components/product-card/product-card';
import { Product } from 'src/app/pages/shop/shop.models';
import { TranslationService } from 'lib/services/translation.service';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule, MatIconModule, TranslatePipe, ProductCardComponent],
  templateUrl: './cart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  private shopService = inject(ShopService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);

  loading = signal(true);

  cartProducts = computed(() => {
    const ids = this.shopService.cartItems();
    const uniqueIds = Array.from(new Set(ids));
    const productsById = this.shopService.productsById();

    return uniqueIds
      .map(id => productsById[id])
      .filter((product): product is Product => !!product);
  });

  totalItems = computed(() => this.shopService.cartItems().length);

  totalPrice = computed(() => {
    const ids = this.shopService.cartItems();
    const productsById = this.shopService.productsById();
    let sum = 0;

    ids.forEach(id => {
      const product = productsById[id];
      if (product) {
        sum += product.price;
      }
    });

    return sum;
  });

  getQuantity(productId: number): number {
    return this.shopService.cartItems().filter(id => id === productId).length;
  }

  increaseQuantity(product: Product): void {
    this.shopService.addToCart(product);
  }

  decreaseQuantity(productId: number): void {
    this.shopService.removeOneFromCart(productId);
  }

  removeFromCart(productId: number): void {
    this.shopService.removeAllFromCart(productId);
  }

  ngOnInit() {
    this.translation.loadModule('shop')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    const ids = this.shopService.cartItems();

    if (ids.length === 0) {
      this.loading.set(false);
      return;
    }

    const uniqueIds = Array.from(new Set(ids));
    const requests = uniqueIds.map(id => this.shopService.getProductById(id));

    forkJoin(requests.length > 0 ? requests : [of(null)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
  }
}

