import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopCartService } from 'lib/services/shop/shop-cart.service';
import { Product } from 'src/app/pages/shop/shop.models';
import { TranslationService } from 'lib/services/translation.service';
import { SnackbarService } from 'lib/services/snackbar.service';
import { ConfirmationDialogService } from 'lib/components/confirmation-dialog/confirmation-dialog.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-cart',
  imports: [RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './cart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  private cartService = inject(ShopCartService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);
  private snackbar = inject(SnackbarService);
  private confirmDialog = inject(ConfirmationDialogService);

  loading = signal(true);
  orderPlaced = signal(false);
  checkingOut = signal(false);
  mockOrderId = '';

  cartProducts = computed(() => {
    const ids = this.cartService.cartItems();
    const uniqueIds = Array.from(new Set(ids));
    const productsById = this.cartService.cartProductsById();

    return uniqueIds
      .map(id => productsById[id])
      .filter((product): product is Product => !!product);
  });

  totalItems = computed(() => this.cartService.cartItems().length);

  totalPrice = computed(() => {
    const ids = this.cartService.cartItems();
    const productsById = this.cartService.cartProductsById();
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
    return this.cartService.getCartQuantity(productId);
  }

  isAtStockLimit(product: Product): boolean {
    return !this.cartService.canAddMore(product);
  }

  increaseQuantity(product: Product): void {
    this.cartService.addToCart(product);
  }

  decreaseQuantity(productId: number): void {
    this.cartService.removeOneFromCart(productId);
  }

  removeFromCart(product: Product): void {
    const productName = product.title || product.name || '';
    this.confirmDialog
      .confirm({
        title: this.translation.translate('profile.cart.removeItemDialog.title'),
        message: this.translation.translate('profile.cart.removeItemDialog.message', { productName }),
        confirmText: this.translation.translate('profile.cart.removeItemDialog.confirm'),
        cancelText: this.translation.translate('profile.cart.removeItemDialog.cancel'),
        confirmColor: 'warn',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.cartService.removeAllFromCart(product.id);
        }
      });
  }

  clearEntireCart(): void {
    this.confirmDialog
      .confirm({
        title: this.translation.translate('profile.cart.clearAllDialog.title'),
        message: this.translation.translate('profile.cart.clearAllDialog.message'),
        confirmText: this.translation.translate('profile.cart.clearAllDialog.confirm'),
        cancelText: this.translation.translate('profile.cart.clearAllDialog.cancel'),
        confirmColor: 'warn',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.cartService.clearAllFromCart();
        }
      });
  }

  checkout(): void {
    if (this.cartProducts().length === 0 || this.checkingOut()) {
      return;
    }

    this.checkingOut.set(true);
    this.cartService.checkoutCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.mockOrderId = response.cart_id;
          this.orderPlaced.set(true);
          this.checkingOut.set(false);
        },
        error: () => {
          // this.snackbar.error('Checkout failed. Please try again.');
          this.checkingOut.set(false);
        },
      });
  }

  ngOnInit() {
    this.translation.loadModule('profile')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    this.translation.loadModule('shop')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.cartService.ensureCartLoaded()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
  }
}

