import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { ScrollTopFab } from 'lib/components/scroll-top-fab/scroll-top-fab';
import { SwapListingApiService, TradeChain } from 'lib/services/swap';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';
import { SwapItem, RecentTrade } from './swap.models';
import { SwapHero } from './components/swap-hero/swap-hero';
import { SwapLiveBar } from './components/swap-live-bar/swap-live-bar';
import { SwapTrending } from './components/swap-newly-added/swap-trending';
import { SwapAiMatch } from './components/swap-ai-match/swap-ai-match';
import { SwapCategoryBar } from './components/swap-category-bar/swap-category-bar';
import { SwapListingsGrid } from './components/swap-listings-grid/swap-listings-grid';
import { SwapRecentTrades } from './components/swap-recent-trades/swap-recent-trades';
import { SwapMyTrades, SwapMyTradeCard } from './components/swap-my-trades/swap-my-trades';
import {
  MOCK_SWAP_ITEMS,
  AI_MATCHES,
  LIVE_ACTIVITIES,
} from './swap.mock-data';
import { formatRelativeShort } from 'lib/utils/relative-time';
import { finalize, switchMap, forkJoin, of, map, catchError } from 'rxjs';

@Component({
  selector: 'app-swap',
  imports: [
    Header,
    Footer,
    SwapHero,
    SwapLiveBar,
    SwapTrending,
    SwapAiMatch,
    SwapCategoryBar,
    SwapListingsGrid,
    SwapRecentTrades,
    SwapMyTrades,
    ScrollTopFab,
  ],
  templateUrl: './swap.html',
  styleUrl: './swap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Swap {
  private router = inject(Router);
  private api = inject(SwapListingApiService);

  // State
  swapItems = signal<SwapItem[]>(MOCK_SWAP_ITEMS);
  isLoading = signal(false);
  isTradesLoading = signal(false);
  tradesError = signal<string | null>(null);
  myTrades = signal<TradeChain[]>([]);
  itemTitleMap = signal<Map<string, string>>(new Map());
  votingChainIds = signal<string[]>([]);
  selectedCategoryId = signal<number | null>(null);
  searchQuery = signal('');
  onlineUsers = signal(847);


  recentTrades = signal<RecentTrade[]>([]);
  isRecentTradesLoading = signal(false);

  // Mock data
  aiMatches = AI_MATCHES;
  liveActivities = LIVE_ACTIVITIES;

  private readonly FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

  newlyAddedItems = computed(() =>
    this.swapItems().filter(
      (item) => Date.now() - new Date(item.created_at).getTime() <= this.FOUR_DAYS_MS
    )
  );

  filteredItems = computed(() => {
    return this.swapItems();
  });

  myTradeCards = computed<SwapMyTradeCard[]>(() => {
    const titles = this.itemTitleMap();
    return this.myTrades().map((trade) => ({
      id: trade.id,
      status: trade.status,
      createdLabel: formatRelativeShort(trade.created_at),
      expiresLabel: formatRelativeShort(trade.expires_at),
      participantItems: trade.items
        .map((item) => titles.get(item.to_item_id) ?? item.to_item_id.slice(0, 8) + '…')
        .filter(Boolean),
      isPending: trade.status.toLowerCase() === 'pending',
    }));
  });

  constructor() {
    effect(() => {
      const categoryId = this.selectedCategoryId();
      const query = this.searchQuery();
      this.loadAllListings(categoryId, query);
    });
    this.loadMyTrades();
    this.loadRecentTrades();
  }

  loadAllListings(categoryId?: number | null, query?: string) {
    this.isLoading.set(true);
    this.api.getAllListings({
      limit: 100,
      category_id: categoryId ?? undefined,
      q: query?.trim() || undefined,
    }).subscribe({
      next: (response) => {
        if (response.items.length > 0) {
          const items: SwapItem[] = response.items.map((listing) => ({
            ...listing,
            postedBy: 'User',
            postedDate: formatRelativeShort(listing.created_at),
          }));
          this.swapItems.set(items);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  loadMyTrades() {
    this.isTradesLoading.set(true);
    this.tradesError.set(null);
    this.api.getMyTrades().pipe(
      switchMap(trades => {
        const itemIds = new Set<string>();
        for (const trade of trades) {
          for (const item of trade.items) {
            if (item.to_item_id) itemIds.add(item.to_item_id);
            if (item.from_item_id) itemIds.add(item.from_item_id);
          }
        }
        if (itemIds.size === 0) return of({ trades, titleMap: new Map<string, string>() });
        return forkJoin(
          [...itemIds].map(id =>
            this.api.getListing(id).pipe(
              map(listing => [id, listing.title] as [string, string]),
              catchError(() => of([id, id.slice(0, 8) + '…'] as [string, string])),
            ),
          ),
        ).pipe(map(entries => ({ trades, titleMap: new Map(entries) })));
      }),
    ).subscribe({
      next: ({ trades, titleMap }) => {
        this.myTrades.set(trades);
        this.itemTitleMap.set(titleMap);
        this.isTradesLoading.set(false);
      },
      error: () => {
        this.tradesError.set('load_failed');
        this.isTradesLoading.set(false);
      },
    });
  }

  onTradeVote(payload: { chainId: string; accept: boolean }) {
    const currentVotingIds = this.votingChainIds();
    if (currentVotingIds.includes(payload.chainId)) return;

    this.votingChainIds.set([...currentVotingIds, payload.chainId]);

    this.api
      .voteOnTrade(payload.chainId, { accept: payload.accept })
      .pipe(finalize(() => this.votingChainIds.set(this.votingChainIds().filter((id) => id !== payload.chainId))))
      .subscribe({
        next: () => {
          this.loadMyTrades();
        },
        error: () => {
          this.tradesError.set('vote_failed');
        },
      });
  }


  onSearch(query: string) {
    this.searchQuery.set(query);
  }

  onPostItem() {
    this.router.navigate(['/swap/create']);
  }

  private loadRecentTrades() {
    this.isRecentTradesLoading.set(true);

    this.api.getRecentTrades(10).pipe(
      switchMap(trades => {
        const itemIds = new Set<string>();
        for (const t of trades) {
          for (const item of t.items) {
            if (item.from_item_id) itemIds.add(item.from_item_id);
            if (item.to_item_id) itemIds.add(item.to_item_id);
          }
        }
        if (itemIds.size === 0) return of({ trades, listingMap: new Map<string, { title: string; photo: string }>() });
        return forkJoin(
          [...itemIds].map(id =>
            this.api.getListing(id).pipe(
              map(l => [id, {
                title: l.title,
                photo: normalizeSwapPhotos(l.photos)[0] ?? SWAP_PHOTO_PLACEHOLDER,
              }] as [string, { title: string; photo: string }]),
              catchError(() => of([id, {
                title: id.slice(0, 8) + '…',
                photo: SWAP_PHOTO_PLACEHOLDER,
              }] as [string, { title: string; photo: string }])),
            ),
          ),
        ).pipe(map(entries => ({ trades, listingMap: new Map(entries) })));
      }),
      catchError(() => of({ trades: [] as TradeChain[], listingMap: new Map<string, { title: string; photo: string }>() })),
    ).subscribe(({ trades, listingMap }) => {
      const tradeCards: RecentTrade[] = trades
        .filter(t => t.items.length >= 1)
        .map(t => {
          const id1 = t.items[0].from_item_id;
          const id2 = t.items.length >= 2 ? t.items[1].from_item_id : t.items[0].to_item_id;
          const a = listingMap.get(id1);
          const b = listingMap.get(id2);
          return {
            item1: a?.title ?? '', image1: a?.photo ?? SWAP_PHOTO_PLACEHOLDER,
            item2: b?.title ?? '', image2: b?.photo ?? SWAP_PHOTO_PLACEHOLDER,
            time: formatRelativeShort(t.created_at),
          };
        });

      if (tradeCards.length > 0) {
        this.recentTrades.set(tradeCards);
      } else {
        this.buildFallbackCards();
      }
      this.isRecentTradesLoading.set(false);
    });
  }

  private buildFallbackCards() {
    const items = this.swapItems();
    if (items.length < 2) return;

    const cards: RecentTrade[] = [];
    for (let i = 0; i + 1 < items.length && cards.length < 4; i += 2) {
      const a = items[i];
      const b = items[i + 1];
      cards.push({
        item1: a.title,
        image1: normalizeSwapPhotos(a.photos)[0] ?? SWAP_PHOTO_PLACEHOLDER,
        item2: b.title,
        image2: normalizeSwapPhotos(b.photos)[0] ?? SWAP_PHOTO_PLACEHOLDER,
        time: formatRelativeShort(a.created_at),
      });
    }
    this.recentTrades.set(cards);
  }
}
