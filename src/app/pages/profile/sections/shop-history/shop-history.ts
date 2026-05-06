import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { SnackbarService } from 'lib/services/snackbar.service';
import { PaymentApiService } from 'lib/services/payment/payment-api.service';
import { OrderResponse } from 'lib/services/payment/models/payment.models';

type OrderFilter = 'all' | 'pending' | 'paid' | 'completed';

@Component({
  selector: 'app-shop-history',
  imports: [RouterModule, MatIconModule, TranslatePipe, DatePipe, SlicePipe],
  templateUrl: './shop-history.html',
  styleUrl: './shop-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopHistoryComponent implements OnInit {
  private paymentApi = inject(PaymentApiService);
  private translation = inject(TranslationService);
  private snackbar = inject(SnackbarService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  orders = signal<OrderResponse[]>([]);
  isLoading = signal(false);
  activeFilter = signal<OrderFilter>('all');
  page = signal(1);
  totalPages = signal(1);

  filteredOrders = computed(() => {
    const all = this.orders();
    const filter = this.activeFilter();
    if (filter === 'all') return all;
    if (filter === 'pending') return all.filter(o => o.status === 'pending' || o.status === 'awaiting_payment');
    if (filter === 'paid') return all.filter(o => o.status === 'paid');
    return all.filter(o => o.status === 'completed' || o.status === 'delivered');
  });

  hasMore = computed(() => this.page() < this.totalPages());

  ngOnInit(): void {
    this.translation
      .loadModule('profile')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    this.handlePaymentReturn();
    this.loadOrders();
  }

  setFilter(filter: OrderFilter): void {
    this.activeFilter.set(filter);
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.paymentApi
      .getOrderHistory(this.page(), 20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.orders.update(prev =>
            this.page() === 1 ? response.items : [...prev, ...response.items],
          );
          this.totalPages.set(response.total_pages);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  loadMore(): void {
    this.page.update(p => p + 1);
    this.loadOrders();
  }

  payOrder(order: OrderResponse): void {
    const baseUrl = window.location.origin;
    this.paymentApi
      .processPayment(
        order.id,
        `${baseUrl}/profile/history/shop?payment=success&order=${order.id}`,
        `${baseUrl}/profile/history/shop?payment=fail&order=${order.id}`,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result.payment?.redirect_url) {
          window.location.href = result.payment.redirect_url;
        }
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-600';
      case 'pending':
      case 'awaiting_payment':
        return 'bg-yellow-50 text-yellow-600';
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  canPay(order: OrderResponse): boolean {
    return order.status === 'pending' || order.status === 'awaiting_payment';
  }

  private handlePaymentReturn(): void {
    const params = this.route.snapshot.queryParams;
    const orderId = params['order'];
    const paymentStatus = params['payment'];

    if (!orderId || !paymentStatus) return;

    if (paymentStatus === 'success') {
      this.paymentApi
        .verifyPayment(orderId, {
          successMessage: this.translation.translate('profile.orders.paymentVerified'),
          errorMessage: this.translation.translate('profile.orders.paymentVerifyFailed'),
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.loadOrders(),
          error: () => this.loadOrders(),
        });
    } else {
      this.snackbar.error(this.translation.translate('profile.orders.paymentFailed'));
    }
  }
}
