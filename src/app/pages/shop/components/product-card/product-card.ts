import { Component, ChangeDetectionStrategy, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../shop.models';
import { ShopService } from 'lib/services/shop/shop.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  product = input.required<Product>();
  compact = input<boolean>(false);

  private shopService = inject(ShopService);
  isFavorited = computed(() => this.shopService.isFavorite(this.product()?.id));

  addToCart(event: Event) {
    event.stopPropagation();
    this.shopService.addToCart(this.product());
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    this.shopService.toggleFavorite(this.product());
  }
}
