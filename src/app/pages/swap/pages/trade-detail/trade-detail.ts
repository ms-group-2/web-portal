import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of, map, switchMap, catchError } from 'rxjs';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { SwapListingApiService, TradeChain } from 'lib/services/swap';
import { SwapListing } from 'lib/services/swap/models/swap-listing.model';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslationService } from 'lib/services/translation.service';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';
import { formatRelativeShort } from 'lib/utils/relative-time';

@Component({
  selector: 'app-trade-detail',
  imports: [MatIconModule, Header, Footer, TranslatePipe],
  templateUrl: './trade-detail.html',
  styleUrl: './trade-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(SwapListingApiService);
  private snackbar = inject(SnackbarService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  trade = signal<TradeChain | null>(null);
  listingMap = signal<Map<string, SwapListing>>(new Map());
  isLoading = signal(true);
  error = signal<string | null>(null);
  isVoting = signal(false);

  isPending = computed(() => this.trade()?.status.toLowerCase() === 'pending');
  createdLabel = computed(() => {
    const t = this.trade();
    return t ? formatRelativeShort(t.created_at) : '';
  });
  expiresLabel = computed(() => {
    const t = this.trade();
    return t ? formatRelativeShort(t.expires_at) : '';
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const chainId = params.get('chainId');
        if (chainId) this.loadTrade(chainId);
      });
  }

  getListingTitle(id: string): string {
    return this.listingMap().get(id)?.title ?? id.slice(0, 8) + '…';
  }

  getListingPhoto(id: string): string {
    const listing = this.listingMap().get(id);
    if (!listing) return SWAP_PHOTO_PLACEHOLDER;
    return normalizeSwapPhotos(listing.photos)[0] ?? SWAP_PHOTO_PLACEHOLDER;
  }

  getListingCondition(id: string): string {
    return this.listingMap().get(id)?.condition ?? '';
  }

  getListingLocation(id: string): string {
    return this.listingMap().get(id)?.location ?? '';
  }

  getListingDescription(id: string): string {
    return this.listingMap().get(id)?.description ?? '';
  }

  statusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  }

  goBack() {
    this.router.navigate(['/swap/notifications']);
  }

  viewListing(listingId: string) {
    this.router.navigate(['/swap', listingId]);
  }

  voteOnChain(accept: boolean) {
    const trade = this.trade();
    if (!trade || this.isVoting()) return;

    this.isVoting.set(true);
    this.api.voteOnTrade(trade.id, { accept })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isVoting.set(false);
          this.snackbar.success(
            this.translation.translate(accept ? 'swap.tradeDetail.accepted' : 'swap.tradeDetail.declined'),
          );
          this.loadTrade(trade.id);
        },
        error: () => {
          this.isVoting.set(false);
          this.snackbar.error(this.translation.translate('swap.tradeDetail.respondError'));
        },
      });
  }

  private loadTrade(chainId: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.api.getMyTrades().pipe(
      map(trades => trades.find(t => t.id === chainId) ?? null),
      switchMap(trade => {
        if (!trade) return of({ trade: null, listings: new Map<string, SwapListing>() });

        const ids = new Set<string>();
        for (const item of trade.items) {
          if (item.from_item_id) ids.add(item.from_item_id);
          if (item.to_item_id) ids.add(item.to_item_id);
        }

        if (ids.size === 0) return of({ trade, listings: new Map<string, SwapListing>() });

        return forkJoin(
          [...ids].map(id =>
            this.api.getListing(id).pipe(
              map(listing => [id, listing] as [string, SwapListing]),
              catchError(() => of(null)),
            ),
          ),
        ).pipe(
          map(entries => ({
            trade,
            listings: new Map(entries.filter((e): e is [string, SwapListing] => e !== null)),
          })),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ trade, listings }) => {
        if (!trade) {
          this.error.set('not_found');
        } else {
          this.trade.set(trade);
          this.listingMap.set(listings);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('load_failed');
        this.isLoading.set(false);
      },
    });
  }
}
