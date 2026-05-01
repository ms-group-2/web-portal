import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { ScrollTopFab } from 'lib/components/scroll-top-fab/scroll-top-fab';
import { SwapListingApiService } from 'lib/services/swap';
import { SwapItem } from './swap.models';
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
  RECENT_TRADES,
  LIVE_ACTIVITIES,
} from './swap.mock-data';
import { formatRelativeShort } from 'lib/utils/relative-time';
import { TradeChain } from 'lib/services/swap';
import { finalize } from 'rxjs';

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
  votingChainIds = signal<string[]>([]);
  selectedCategoryId = signal<number | null>(null);
  searchQuery = signal('');
  onlineUsers = signal(847);

  // Mock data
  aiMatches = AI_MATCHES;
  recentTrades = RECENT_TRADES;
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

  myTradeCards = computed<SwapMyTradeCard[]>(() =>
    this.myTrades().map((trade) => ({
      id: trade.id,
      status: trade.status,
      createdLabel: formatRelativeShort(trade.created_at),
      expiresLabel: formatRelativeShort(trade.expires_at),
      participantItems: trade.items.map((item) => item.to_item_id).filter(Boolean),
      isPending: trade.status.toLowerCase() === 'pending',
    }))
  );

  constructor() {
    effect(() => {
      const categoryId = this.selectedCategoryId();
      const query = this.searchQuery();
      this.loadAllListings(categoryId, query);
    });
    this.loadMyTrades();
  }

  loadAllListings(categoryId?: number | null, query?: string) {
    this.isLoading.set(true);
    this.api.getAllListings({
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
    this.api.getMyTrades().subscribe({
      next: (trades) => {
        this.myTrades.set(trades);
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

}
