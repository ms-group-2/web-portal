import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService, MockOrderItem } from 'lib/services/shop/shop.service';
import { Product } from 'src/app/pages/shop/shop.models';
import { TranslationService } from 'lib/services/translation.service';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-cart',
  imports: [RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './cart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  private shopService = inject(ShopService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);

  loading = signal(true);
  orderPlaced = signal(false);
  mockOrderId = '';

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

  checkout(): void {
    const products = this.cartProducts();
    const items: MockOrderItem[] = products.map(p => ({
      productId: p.id,
      title: p.title || p.name || '',
      imageUrl: p.cover_image_url || p.image_url || p.image || '',
      price: p.price,
      quantity: this.getQuantity(p.id),
    }));
    const total = this.totalPrice();
    this.mockOrderId = this.shopService.placeOrder(items, total);
    this.orderPlaced.set(true);
  }

  ngOnInit() {
    this.translation.loadModule('profile')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
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

