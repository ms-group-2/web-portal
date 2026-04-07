import { Component, ChangeDetectionStrategy, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ShopService } from 'lib/services/shop/shop.service';
import { TranslationService } from 'lib/services/translation.service';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { CategoryMenu } from 'lib/components/category-dialog/category-dialog';
import { CategoryScrollerComponent } from './components/category-scroller/category-scroller';
import { PromoBannersComponent } from './components/promo-banners/promo-banners';
import { ProductFiltersComponent } from './components/product-filters/product-filters';
import { ProductGridComponent } from './components/product-grid/product-grid';
import { TrustSectionComponent } from './components/trust-section/trust-section';

@Component({
  selector: 'app-shop',
  imports: [
    Header,
    Footer,
    CategoryMenu,
    CategoryScrollerComponent,
    PromoBannersComponent,
    ProductFiltersComponent,
    ProductGridComponent,
    TrustSectionComponent,
  ],
  templateUrl: './shop.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shop implements OnInit {
  private shopService = inject(ShopService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.translation.loadModule('shop')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.shopService.clearProductCaches();

    // when returning to default shop, clearing any active search state
    this.shopService.setSearchQuery('');
    this.shopService.clearSearchFilters();
    this.shopService.selectCategory(null);

    this.shopService.getMainCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
