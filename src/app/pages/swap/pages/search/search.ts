import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'lib/services/shop/shop.service';
import { SwapListingApiService } from 'lib/services/swap/swap-listing-api.service';
import { SwapItem } from '../../swap.models';
import { SwapListingsGrid } from '../../components/swap-listings-grid/swap-listings-grid';
import { formatRelativeShort } from 'lib/utils/relative-time';

@Component({
  selector: 'app-swap-search',
  imports: [Header, Footer, MatIconModule, TranslatePipe, SwapListingsGrid, NgClass],
  templateUrl: './search.html',
  styleUrl: './search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapSearch {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private shopService = inject(ShopService);
  private swapApi = inject(SwapListingApiService);

  categories = this.shopService.mainCategories;
  selectedCategoryId = signal<number | null>(null);
  showMobileCategories = signal(false);
  searchQuery = signal('');
  isLoading = signal(false);
  items = signal<SwapItem[]>([]);

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const query = (params.get('q') ?? '').trim();
        const categoryParam = params.get('category');
        const categoryId = categoryParam ? Number(categoryParam) : null;

        this.searchQuery.set(query);
        this.selectedCategoryId.set(Number.isFinite(categoryId) ? categoryId : null);
        this.loadResults();
      });

    this.shopService.getMainCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((main) => {
        const parents = main.filter((c) => c.has_subcategories);
        if (!parents.length) return;

        forkJoin(parents.map((p) => this.shopService.getSubcategories(Number(p.id))))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      });
  }

  selectCategory(categoryId: number | null): void {
    this.showMobileCategories.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: categoryId ?? null },
      queryParamsHandling: 'merge',
    });
  }

  clearCategory(): void {
    this.selectCategory(null);
  }

  private loadResults(): void {
    const query = this.searchQuery();
    if (!query) {
      this.items.set([]);
      return;
    }

    this.isLoading.set(true);
    this.swapApi.getAllListings({
      limit: 100,
      q: query,
      category_id: this.selectedCategoryId() ?? undefined,
    }).subscribe({
      next: (response) => {
        const mapped: SwapItem[] = response.items.map((listing) => ({
          ...listing,
          postedBy: 'User',
          postedDate: formatRelativeShort(listing.created_at),
        }));
        this.items.set(this.filterByQuery(mapped, query));
        this.isLoading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.isLoading.set(false);
      },
    });
  }

  private filterByQuery(items: SwapItem[], query: string): SwapItem[] {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return items;
    }

    return items.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.swap_item_title,
        item.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }
}
