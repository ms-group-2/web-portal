import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../shop.models';
import { ShopService } from 'lib/services/shop/shop.service';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, MatIconModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() compact = false;
  
  private shopService = inject(ShopService);

  addToCart(event: Event) {
    event.stopPropagation();
    this.shopService.addToCart(this.product);
  }
}
