import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { Product } from 'src/app/pages/shop/shop.models';
import { AuthService } from 'lib/services/identity/auth.service';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslationService } from 'lib/services/translation.service';
import { StorageService } from 'lib/services/storage/storage.service';
import { environment } from 'src/environments/environment';
import { ShopCartApiService } from './shop-cart-api.service';
import {
  AddToCartRequest,
  CartResponse,
  CheckoutResponse,
  UpdateCartItemRequest,
} from 'lib/services/shop/models/shop-cart.models';
import { MockOrderItem, ShopOrdersService } from './shop-orders.service';

@Injectable({ providedIn: 'root' })
export class ShopCartService {
  private readonly authService = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly snackbar = inject(SnackbarService);
  private readonly translation = inject(TranslationService);
  private readonly cartApi = inject(ShopCartApiService);
  private readonly ordersService = inject(ShopOrdersService);

  private readonly baseUrl = environment.apiBaseUrl;
  private readonly CART_STORAGE_KEY_PREFIX = 'vipo_cart_';
  private inFlightCartLoad$: Observable<CartResponse> | null = null;
  private lastEffectUserId: string | null | undefined = undefined;
  private loadedRemoteCartUserId: string | null = null;

  readonly cartItems = signal<number[]>([]);
  readonly cartCount = computed(() => this.cartItems().length);
  readonly cartItemIdsByProductId = signal<Record<number, string>>({});
  readonly cartItemQuantitiesByProductId = signal<Record<number, number>>({});
  readonly cartStatus = signal<string>('');
  readonly cartTotal = signal<number>(0);
  readonly cartProductsById = signal<Record<number, Product>>({});

  constructor() {
    effect(() => {
      this.authService.user();
      const userId = this.getCurrentUserId();
      if (this.lastEffectUserId === userId) {
        return;
      }
      this.lastEffectUserId = userId;
      this.loadCartForCurrentUser();
    });
  }

  ensureCartLoaded(): Observable<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return of(void 0);
    }

    if (this.loadedRemoteCartUserId === userId) {
      return of(void 0);
    }

    return this.fetchCartShared().pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Failed to load cart:', error);
        this.resetCartState();
        return of(void 0);
      })
    );
  }

  getMyCart(): Observable<CartResponse> {
    return this.cartApi.getMyCart();
  }

  checkoutCart(): Observable<CheckoutResponse> {
    const items = this.buildOrderItemsFromState();

    return this.cartApi.checkout().pipe(
      tap(response => {
        this.ordersService.placeOrder(items, response.total, response.cart_id);
        this.clearCart();
        this.syncCartStateFromResponse({
          id: response.cart_id,
          user_id: this.getCurrentUserId() || '',
          items: [],
          status: response.status,
          total: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      })
    );
  }

  clearCart(): void {
    this.resetCartState();
    if (!this.getCurrentUserId()) {
      this.saveCartToStorage([]);
    }
  }

  getCartQuantity(productId: number): number {
    const quantity = this.cartItemQuantitiesByProductId()[productId];
    if (quantity !== undefined) {
      return quantity;
    }
    return this.cartItems().filter(id => id === productId).length;
  }

  canAddMore(product: Product): boolean {
    if (product.quantity == null) {
      return true;
    }

    return this.getCartQuantity(product.id) < product.quantity;
  }

  addToCart(product: Product, quantity: number = 1): boolean {
    const userId = this.getCurrentUserId();
    const currentQuantity = this.getCartQuantity(product.id);
    const maxQuantity = product.quantity;

    let requestedQuantity = Math.max(0, quantity);
    if (maxQuantity != null) {
      requestedQuantity = Math.min(requestedQuantity, Math.max(0, maxQuantity - currentQuantity));
    }

    if (requestedQuantity <= 0) {
      return false;
    }

    if (!userId) {
      this.cartProductsById.update(existing => ({
        ...existing,
        [product.id]: this.normalizeProduct(product),
      }));
      const current = this.cartItems();
      const next = [...current, ...Array.from({ length: requestedQuantity }, () => product.id)];
      this.updateCart(next);
      this.snackbar.success(this.translation.translate('shop.cart.addedSuccess'), 'close', 'right', 'bottom');
      return true;
    }

    const payload: AddToCartRequest = {
      product_id: product.id,
      quantity: requestedQuantity,
    };

    this.cartApi.addItem(payload)
      .pipe(
        tap(item => {
          this.cartProductsById.update(existing => ({
            ...existing,
            [product.id]: {
              ...this.normalizeProduct(product),
              title: item.product_title || product.title,
              name: item.product_title || product.name,
              image_url: this.normalizeImageUrl(item.product_image_url || product.image_url),
              cover_image_url: this.normalizeImageUrl(item.product_image_url || product.cover_image_url),
              image: this.normalizeImageUrl(item.product_image_url || product.image),
              price: item.unit_price || product.price,
              quantity: item.stock_quantity,
            },
          }));
        }),
        catchError(error => {
          this.snackbar.error(this.resolveCartErrorMessage(error, 'Failed to add item to cart.'));
          return of(null);
        })
      )
      .subscribe(item => {
        if (item) {
          this.snackbar.success(this.translation.translate('shop.cart.addedSuccess'), 'close', 'right', 'bottom');
          this.refreshCartFromBackend();
        }
      });

    return true;
  }

  removeOneFromCart(productId: number): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      const itemId = this.cartItemIdsByProductId()[productId];
      const quantity = this.getCartQuantity(productId);

      if (!itemId || quantity <= 0) {
        return;
      }

      if (quantity === 1) {
        this.cartApi.removeItem(itemId)
          .pipe(
            catchError(error => {
              console.error('Failed to remove cart item:', error);
              return of(null);
            })
          )
          .subscribe(() => this.refreshCartFromBackend());
        return;
      }

      const payload: UpdateCartItemRequest = { quantity: quantity - 1 };
      this.cartApi.updateItem(itemId, payload)
        .pipe(
          catchError(error => {
            console.error('Failed to update cart item quantity:', error);
            return of(null);
          })
        )
        .subscribe(() => this.refreshCartFromBackend());
      return;
    }

    const current = this.cartItems();
    const index = current.indexOf(productId);
    if (index === -1) {
      return;
    }

    const next = [...current];
    next.splice(index, 1);
    this.updateCart(next);
  }

  removeAllFromCart(productId: number): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      const itemId = this.cartItemIdsByProductId()[productId];
      if (!itemId) {
        return;
      }

      this.cartApi.removeItem(itemId)
        .pipe(
          catchError(error => {
            console.error('Failed to remove cart item:', error);
            return of(null);
          })
        )
        .subscribe(() => this.refreshCartFromBackend());
      return;
    }

    const current = this.cartItems();
    const next = current.filter(id => id !== productId);
    this.updateCart(next);
  }

  clearAllFromCart(): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.updateCart([]);
      this.cartProductsById.set({});
      return;
    }

    const itemIds = [...new Set(Object.values(this.cartItemIdsByProductId()))];
    if (itemIds.length === 0) {
      this.resetCartState();
      return;
    }

    forkJoin(
      itemIds.map(itemId =>
        this.cartApi.removeItem(itemId).pipe(
          catchError(error => {
            // console.error('Failed to remove cart item:', error);
            return of(null);
          })
        )
      )
    ).subscribe(() => this.refreshCartFromBackend());
  }

  private refreshCartFromBackend(): void {
    this.fetchCartShared()
      .pipe(
        catchError(error => {
          console.error('Failed to refresh cart:', error);
          this.resetCartState();
          return of(null);
        })
      )
      .subscribe(cart => {
        if (cart) {
          this.syncCartStateFromResponse(cart);
        }
      });
  }

  private fetchCartShared(): Observable<CartResponse> {
    if (this.inFlightCartLoad$) {
      return this.inFlightCartLoad$;
    }

    this.inFlightCartLoad$ = this.cartApi.getMyCart().pipe(
      tap(cart => {
        this.syncCartStateFromResponse(cart);
        this.loadedRemoteCartUserId = this.getCurrentUserId();
      }),
      finalize(() => {
        this.inFlightCartLoad$ = null;
      }),
      shareReplay(1)
    );

    return this.inFlightCartLoad$;
  }

  private syncCartStateFromResponse(cart: CartResponse): void {
    const ids: number[] = [];
    const itemIdByProductId: Record<number, string> = {};
    const qtyByProductId: Record<number, number> = {};
    const cartProductsById: Record<number, Product> = {};

    cart.items.forEach(item => {
      const quantity = Math.max(0, item.quantity || 0);
      itemIdByProductId[item.product_id] = item.id;
      qtyByProductId[item.product_id] = quantity;

      for (let i = 0; i < quantity; i++) {
        ids.push(item.product_id);
      }

      const image = this.normalizeImageUrl(item.product_image_url);
      cartProductsById[item.product_id] = {
        id: item.product_id,
        category_id: 0,
        title: item.product_title,
        price: item.unit_price,
        sku: '',
        image_url: image,
        cover_image_url: image,
        quantity: item.stock_quantity,
        name: item.product_title,
        image,
      };
    });

    this.cartItems.set(ids);
    this.cartItemIdsByProductId.set(itemIdByProductId);
    this.cartItemQuantitiesByProductId.set(qtyByProductId);
    this.cartStatus.set(cart.status || 'open');
    this.cartTotal.set(cart.total || 0);
    this.cartProductsById.update(existing => ({
      ...existing,
      ...cartProductsById,
    }));
  }

  private updateCart(next: number[]): void {
    this.cartItems.set(next);
    const quantities: Record<number, number> = {};
    next.forEach(id => {
      quantities[id] = (quantities[id] ?? 0) + 1;
    });
    this.cartItemQuantitiesByProductId.set(quantities);
    this.cartTotal.set(this.computeTotalFromLocalState());
    this.saveCartToStorage(next);
  }

  private buildOrderItemsFromState(): MockOrderItem[] {
    const quantities = this.cartItemQuantitiesByProductId();
    const productsById = this.cartProductsById();

    return Object.keys(quantities)
      .map(rawId => {
        const productId = Number(rawId);
        const quantity = quantities[productId] || 0;
        const product = productsById[productId];

        return {
          productId,
          title: product?.title || product?.name || '',
          imageUrl: product?.cover_image_url || product?.image_url || product?.image || '',
          price: product?.price || 0,
          quantity,
        };
      })
      .filter(item => item.quantity > 0);
  }

  private computeTotalFromLocalState(): number {
    const productsById = this.cartProductsById();
    return this.cartItems().reduce((sum, id) => {
      const product = productsById[id];
      return sum + (product?.price || 0);
    }, 0);
  }

  private loadCartForCurrentUser(): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      this.refreshCartFromBackend();
      return;
    }

    this.loadedRemoteCartUserId = null;

    const key = this.getCartStorageKey(null);
    const stored = this.storage.getItem(key);
    if (!stored) {
      this.resetCartState();
      return;
    }

    try {
      const ids = JSON.parse(stored) as number[];
      this.cartItems.set(ids);
      const quantities: Record<number, number> = {};
      ids.forEach(id => {
        quantities[id] = (quantities[id] ?? 0) + 1;
      });
      this.cartItemQuantitiesByProductId.set(quantities);
      this.cartItemIdsByProductId.set({});
      this.cartStatus.set('open');
      this.cartTotal.set(this.computeTotalFromLocalState());
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
      this.resetCartState();
    }
  }

  private saveCartToStorage(items: number[]): void {
    const key = this.getCartStorageKey(this.getCurrentUserId());
    try {
      this.storage.setItem(key, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  }

  private resetCartState(): void {
    this.cartItems.set([]);
    this.cartItemIdsByProductId.set({});
    this.cartItemQuantitiesByProductId.set({});
    this.cartStatus.set('open');
    this.cartTotal.set(0);
  }

  private getCartStorageKey(userId: string | null): string {
    return userId ? `${this.CART_STORAGE_KEY_PREFIX}${userId}` : `${this.CART_STORAGE_KEY_PREFIX}guest`;
  }

  private getCurrentUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }

  private normalizeImageUrl(url?: string | null): string {
    if (!url) {
      return '';
    }

    if (url.startsWith('http://localhost:9000') || url.startsWith('https://localhost:9000')) {
      try {
        const apiBase = new URL(this.baseUrl);
        const source = new URL(url);
        return `${apiBase.origin}${source.pathname}`;
      } catch {
        return url;
      }
    }

    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }

    return url;
  }

  private normalizeProduct(product: Product): Product {
    const cover = this.normalizeImageUrl(product.cover_image_url || product.image_url || product.image);
    const qty =
      product.quantity != null ? product.quantity : product.stock_quantity != null ? product.stock_quantity : undefined;

    return {
      ...product,
      cover_image_url: this.normalizeImageUrl(product.cover_image_url) || cover,
      image_url: this.normalizeImageUrl(product.image_url) || cover,
      image: cover,
      name: product.title || product.name,
      quantity: qty,
    };
  }

  private resolveCartErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message as string | undefined;
      const errorCode = error.error?.error_code as string | undefined;

      if (apiMessage) {
        return apiMessage;
      }

      if (error.status === 409 || errorCode === 'CONFLICT') {
        return 'Cart has already been checked out.';
      }

      if (error.status === 422 || errorCode === 'VALIDATION_ERROR') {
        return 'Product is not available or insufficient stock.';
      }
    }

    return fallback;
  }
}
