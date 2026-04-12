import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ShopSearchService } from 'lib/services/shop/shop-search.service';
import { ShopCartService } from 'lib/services/shop/shop-cart.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-shop-hero',
  imports: [ MatIconModule, TranslatePipe],
  templateUrl: './shop-hero.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopHeroComponent {
  private searchService = inject(ShopSearchService);
  private cartService = inject(ShopCartService);
  private destroyRef = inject(DestroyRef);
  private searchSubject = new Subject<string>();

  cartCount = this.cartService.cartCount;
  showCart = signal(false);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(query => this.searchService.setSearchQuery(query));
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  toggleCart() {
    this.showCart.update(value => !value);
  }
}
