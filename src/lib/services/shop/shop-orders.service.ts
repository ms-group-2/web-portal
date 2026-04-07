import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from 'lib/services/identity/auth.service';
import { StorageService } from 'lib/services/storage/storage.service';

export interface MockOrderItem {
  productId: number;
  title: string;
  imageUrl: string;
  price: number;
  quantity: number;
}

export interface MockOrder {
  id: string;
  items: MockOrderItem[];
  total: number;
  status: 'confirmed' | 'shipped' | 'delivered';
  date: string;
}

@Injectable({ providedIn: 'root' })
export class ShopOrdersService {
  private readonly authService = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly ORDERS_STORAGE_KEY_PREFIX = 'vipo_orders_';

  readonly orders = signal<MockOrder[]>([]);

  constructor() {
    this.loadForCurrentUser();

    effect(() => {
      this.authService.user();
      this.loadForCurrentUser();
    });
  }

  placeOrder(items: MockOrderItem[], total: number, orderId?: string): string {
    const resolvedOrderId = orderId || ('VPO-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    const order: MockOrder = {
      id: resolvedOrderId,
      items,
      total,
      status: 'confirmed',
      date: new Date().toISOString(),
    };

    const updated = [order, ...this.orders()];
    this.orders.set(updated);
    this.saveToStorage(updated);
    return resolvedOrderId;
  }

  private loadForCurrentUser(): void {
    const key = this.getStorageKey(this.getCurrentUserId());
    const stored = this.storage.getItem(key);

    if (!stored) {
      this.orders.set([]);
      return;
    }

    try {
      this.orders.set(JSON.parse(stored) as MockOrder[]);
    } catch {
      this.orders.set([]);
    }
  }

  private saveToStorage(orders: MockOrder[]): void {
    const key = this.getStorageKey(this.getCurrentUserId());

    try {
      this.storage.setItem(key, JSON.stringify(orders));
    } catch {
      // Storage write failed — non-critical
    }
  }

  private getStorageKey(userId: string | null): string {
    return userId ? `${this.ORDERS_STORAGE_KEY_PREFIX}${userId}` : `${this.ORDERS_STORAGE_KEY_PREFIX}guest`;
  }

  private getCurrentUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }
}
