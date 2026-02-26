import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ProductCardComponent } from '../product-card/product-card';
import { ShopService } from 'lib/services/shop/shop.service';
import { Product } from '../../shop.models';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-suggested-products',
  imports: [ProductCardComponent, TranslatePipe],
  templateUrl: './suggested-products.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestedProductsComponent implements OnInit {
  private shopService = inject(ShopService);
  
  suggestedProducts = signal<Product[]>([]);

  ngOnInit() {
    this.shopService.getProducts().subscribe(products => {
      this.suggestedProducts.set(products.slice(0, 4));
    });
  }
}
