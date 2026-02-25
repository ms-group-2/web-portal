import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ShopService } from 'lib/services/shop/shop.service';

@Component({
  selector: 'app-shop-hero',
  imports: [CommonModule, MatIconModule],
  templateUrl: './shop-hero.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopHeroComponent {
  private shopService = inject(ShopService);
  
  cartCount = this.shopService.cartCount;
  showCart = signal(false);

  toggleCart() {
    this.showCart.update(value => !value);
  }
}
