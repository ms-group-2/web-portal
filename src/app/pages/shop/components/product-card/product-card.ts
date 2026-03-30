import { Component, ChangeDetectionStrategy, input, inject, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Product } from '../../shop.models';
import { ShopCartService } from 'lib/services/shop/shop-cart.service';
import { ShopFavoritesService } from 'lib/services/shop/shop-favorites.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-product-card',
  imports: [NgClass, MatIconModule, TranslatePipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  product = input.required<Product>();
  compact = input<boolean>(false);

  private cartService = inject(ShopCartService);
  private favoritesService = inject(ShopFavoritesService);
  isFavorited = computed(() => this.favoritesService.isFavorite(this.product()?.id));
  isAtStockLimit = computed(() => !this.cartService.canAddMore(this.product()));

  addToCart(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.cartService.addToCart(this.product());
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.favoritesService.toggleFavorite(this.product().id);
  }
}
