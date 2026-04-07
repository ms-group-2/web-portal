import { Component, ChangeDetectionStrategy, OnInit, DestroyRef, inject, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, tap } from 'rxjs';
import { ShopService } from 'lib/services/shop/shop.service';
import { TranslationService } from 'lib/services/translation.service';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { CategoryMenu } from 'lib/components/category-dialog/category-dialog';
import { SearchFiltersSidebarComponent } from '../components/search-filters-sidebar/search-filters-sidebar';
import { ProductGridComponent } from '../components/product-grid/product-grid';

@Component({
  selector: 'app-shop-search',
  imports: [Header, Footer, CategoryMenu, SearchFiltersSidebarComponent, ProductGridComponent],
  templateUrl: './search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopSearch implements OnInit {
  shopService = inject(ShopService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  searchQueryText = computed(() => this.shopService.searchQuery().trim());
  isGeorgian = computed(() => this.translation.isGeorgian());

  ngOnInit() {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const query = params['q'] || '';
        if (query !== this.shopService.searchQuery()) {
          this.shopService.setSearchQuery(query);
        }
      });

    this.translation.loadModule('shop')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    // Load category tree so the sidebar can show category/subcategory names.
    this.shopService.getMainCategories()
      .pipe(
        tap(main => {
          const parents = main.filter(c => c.has_subcategories);
          if (!parents.length) return;
          forkJoin(
            parents.map(p => this.shopService.getSubcategories(Number(p.id))),
          )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}

