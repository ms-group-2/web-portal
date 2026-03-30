import { Component, ChangeDetectionStrategy, inject, OnInit, DestroyRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { MockOrder, ShopOrdersService } from 'lib/services/shop/shop-orders.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-shop-history',
  imports: [RouterModule, MatIconModule, TranslatePipe, DatePipe],
  templateUrl: './shop-history.html',
  styleUrl: './shop-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopHistoryComponent implements OnInit {
  private ordersService = inject(ShopOrdersService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  orders = this.ordersService.orders;

  ngOnInit() {
    this.translation.loadModule('profile')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  getStatusClass(status: MockOrder['status']): string {
    switch (status) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-600';
      case 'shipped': return 'bg-market/10 text-market';
      case 'delivered': return 'bg-primary/10 text-primary';
    }
  }
}
