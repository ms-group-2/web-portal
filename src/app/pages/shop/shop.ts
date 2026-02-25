import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopService } from 'lib/services/shop/shop.service';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { ShopHeroComponent } from './components/shop-hero/shop-hero';
import { CategoryScrollerComponent } from './components/category-scroller/category-scroller';
import { PromoBannersComponent } from './components/promo-banners/promo-banners';
import { ProductFiltersComponent } from './components/product-filters/product-filters';
import { ProductGridComponent } from './components/product-grid/product-grid';
import { SuggestedProductsComponent } from './components/suggested-products/suggested-products';
import { TrustSectionComponent } from './components/trust-section/trust-section';

@Component({
  selector: 'app-shop',
  imports: [
    Header,
    Footer,
    ShopHeroComponent,
    CategoryScrollerComponent,
    PromoBannersComponent,
    ProductFiltersComponent,
    ProductGridComponent,
    SuggestedProductsComponent,
    TrustSectionComponent,
  ],
  templateUrl: './shop.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shop implements OnInit {
  private shopService = inject(ShopService);

  ngOnInit() {
    this.shopService.getProducts().subscribe();
  }
}
