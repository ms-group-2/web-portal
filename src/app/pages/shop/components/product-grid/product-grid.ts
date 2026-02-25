import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../product-card/product-card';
import { ShopService } from 'lib/services/shop/shop.service';
import { Product } from '../../shop.models';

@Component({
  selector: 'app-product-grid',
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './product-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent implements OnInit {
  private shopService = inject(ShopService);
  
  products = signal<Product[]>([]);

  ngOnInit() {
    this.shopService.getProducts().subscribe(products => {
      this.products.set(products);
    });
  }
}
