import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { ScrollTopFab } from 'lib/components/scroll-top-fab/scroll-top-fab';
import { SwapListingApiService, TradeChain, SwapRecord, ExchangedItemsService } from 'lib/services/swap';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { AuthService } from 'lib/services/identity/auth.service';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';
import { SwapItem, RecentTrade, LiveActivity } from './swap.models';
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
} from './swap.mock-data';
import { formatRelativeShort } from 'lib/utils/relative-time';
import { Observable, finalize, switchMap, forkJoin, of, map, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

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
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private api = inject(SwapListingApiService);
  private profileApi = inject(ProfileApiService);
  private auth = inject(AuthService);
  private exchangedService = inject(ExchangedItemsService);

  // State
  swapItems = signal<SwapItem[]>(MOCK_SWAP_ITEMS);
  isLoading = signal(false);
  isTradesLoading = signal(false);
  tradesError = signal<string | null>(null);
  myTrades = signal<TradeChain[]>([]);
  itemMetaMap = signal<Map<string, { title: string; photo: string }>>(new Map());
  votingChainIds = signal<string[]>([]);
  selectedCategoryId = signal<number | null>(null);
  searchQuery = signal('');
  onlineUsers = signal(847);


  recentTrades = signal<RecentTrade[]>([]);
  exchangedItemIds = this.exchangedService.ids;
  isRecentTradesLoading = signal(false);
  isRecentTradesLoadingMore = signal(false);
  hasMoreRecentTrades = signal(false);
  private recentTradesPage = 1;
  private recentTradesTotalPages = 1;

  // Mock data
  aiMatches = AI_MATCHES;
  liveActivities = signal<LiveActivity[]>([]);

  private readonly FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

  newlyAddedItems = computed(() => {
    const exchanged = this.exchangedItemIds();
    return this.swapItems().filter(
      (item) => !exchanged.has(item.id) && Date.now() - new Date(item.created_at).getTime() <= this.FOUR_DAYS_MS
    );
  });

  private static readonly BOOST_RANK: Record<string, number> = {
    super_vip: 3,
    vip_plus: 2,
    vip: 1,
  };

  filteredItems = computed(() => {
    const exchanged = this.exchangedItemIds();
    const now = Date.now();
    return this.swapItems()
      .filter(item => !exchanged.has(item.id))
      .sort((a, b) => {
        const aActive = a.boost_tier && a.boost_expires_at && new Date(a.boost_expires_at).getTime() > now;
        const bActive = b.boost_tier && b.boost_expires_at && new Date(b.boost_expires_at).getTime() > now;
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        if (aActive && bActive) {
          return (Swap.BOOST_RANK[b.boost_tier!] ?? 0) - (Swap.BOOST_RANK[a.boost_tier!] ?? 0);
        }
        return 0;
      });
  });

  myTradeCards = computed<SwapMyTradeCard[]>(() => {
    const meta = this.itemMetaMap();
    return this.myTrades()
      .filter((trade) => {
        const status = trade.status.toLowerCase();
        return status !== 'rejected' && status !== 'cancelled';
      })
      .map((trade) => ({
      id: trade.id,
      status: trade.status,
      createdLabel: formatRelativeShort(trade.created_at),
      expiresLabel: formatRelativeShort(trade.expires_at),
      participantItems: [
        ...new Set(
          trade.items
            .flatMap((item) => [item.from_item_id, item.to_item_id])
            .map((id) => meta.get(id)?.title ?? id.slice(0, 8) + '…')
            .filter(Boolean),
        ),
      ],
      steps: trade.items.map((item) => ({
        fromTitle: meta.get(item.from_item_id)?.title ?? item.from_item_id.slice(0, 8) + '…',
        toTitle: meta.get(item.to_item_id)?.title ?? item.to_item_id.slice(0, 8) + '…',
        fromPhoto: meta.get(item.from_item_id)?.photo ?? SWAP_PHOTO_PLACEHOLDER,
        toPhoto: meta.get(item.to_item_id)?.photo ?? SWAP_PHOTO_PLACEHOLDER,
        status: item.status,
      })),
      isPending: trade.status.toLowerCase() === 'pending',
    }));
  });

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.searchQuery.set((params.get('q') ?? '').trim());
      });

    effect(() => {
      const categoryId = this.selectedCategoryId();
      const query = this.searchQuery();
      this.loadAllListings(categoryId, query);
    });
    this.loadMyTrades();
    this.loadRecentTrades();
    this.exchangedService.load();
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
        this.refreshLiveActivities();
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
        if (itemIds.size === 0) {
          return of({ trades, itemMap: new Map<string, { title: string; photo: string }>() });
        }
        return forkJoin(
          [...itemIds].map(id =>
            this.api.getListing(id).pipe(
              map(listing => [id, {
                title: listing.title,
                photo: normalizeSwapPhotos(listing.photos)[0] ?? SWAP_PHOTO_PLACEHOLDER,
              }] as [string, { title: string; photo: string }]),
              catchError(() => of([id, {
                title: id.slice(0, 8) + '…',
                photo: SWAP_PHOTO_PLACEHOLDER,
              }] as [string, { title: string; photo: string }])),
            ),
          ),
        ).pipe(map(entries => ({ trades, itemMap: new Map(entries) })));
      }),
    ).subscribe({
      next: ({ trades, itemMap }) => {
        this.myTrades.set(trades);
        this.itemMetaMap.set(itemMap);
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
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    this.router.navigate(['/swap/search'], { queryParams: { q: trimmed } });
  }

  onPostItem() {
    this.router.navigate(['/swap/create']);
  }

  private loadRecentTrades() {
    this.isRecentTradesLoading.set(true);
    this.recentTradesPage = 1;

    const swapHistory$ = this.auth.isAuthenticated()
      ? this.api.getSwapHistory({ page: 1, limit: 6 }).pipe(
          switchMap(res => {
            this.recentTradesTotalPages = res.total_pages;
            this.hasMoreRecentTrades.set(res.page < res.total_pages);
            return this.resolveSwapHistoryCards(res.items);
          }),
          catchError(() => of([] as RecentTrade[])),
        )
      : of([] as RecentTrade[]);

    swapHistory$.pipe(
      switchMap((cards): Observable<RecentTrade[]> => {
        if (cards.length > 0) return of(cards);
        return this.api.getRecentTrades(10).pipe(
          switchMap(trades => {
            return this.resolveListingsAndProfiles(trades);
          }),
          catchError(() => of([] as RecentTrade[])),
        );
      }),
    ).subscribe(cards => {
      if (cards.length > 0) {
        this.recentTrades.set(cards);
        this.isRecentTradesLoading.set(false);
        this.refreshLiveActivities();
      } else {
        this.buildFallbackCards();
      }
    });
  }

  loadMoreRecentTrades() {
    if (this.isRecentTradesLoadingMore() || !this.hasMoreRecentTrades()) return;

    this.recentTradesPage++;
    this.isRecentTradesLoadingMore.set(true);

    this.api.getSwapHistory({ page: this.recentTradesPage, limit: 6 }).pipe(
      switchMap(res => {
        this.recentTradesTotalPages = res.total_pages;
        this.hasMoreRecentTrades.set(res.page < res.total_pages);
        return this.resolveSwapHistoryCards(res.items);
      }),
      catchError(() => {
        this.recentTradesPage--;
        return of([] as RecentTrade[]);
      }),
    ).subscribe(cards => {
      if (cards.length > 0) {
        this.recentTrades.update(existing => [...existing, ...cards]);
      }
      this.isRecentTradesLoadingMore.set(false);
    });
  }

  private resolveListingsAndProfiles(trades: TradeChain[]) {
    const itemIds = new Set<string>();
    for (const t of trades) {
      for (const item of t.items) {
        if (item.from_item_id) itemIds.add(item.from_item_id);
        if (item.to_item_id) itemIds.add(item.to_item_id);
      }
    }
    if (itemIds.size === 0) return of([] as RecentTrade[]);

    type ListingInfo = { title: string; photo: string; ownerId: string };
    type ProfileInfo = { name: string; avatar: string };

    return forkJoin(
      [...itemIds].map(id =>
        this.api.getListing(id).pipe(
          map(l => [id, {
            title: l.title,
            photo: normalizeSwapPhotos(l.photos)[0] ?? SWAP_PHOTO_PLACEHOLDER,
            ownerId: l.owner_id,
          }] as [string, ListingInfo]),
          catchError(() => of([id, {
            title: id.slice(0, 8) + '…',
            photo: SWAP_PHOTO_PLACEHOLDER,
            ownerId: '',
          }] as [string, ListingInfo])),
        ),
      ),
    ).pipe(
      switchMap(entries => {
        const listingMap = new Map(entries);
        const ownerIds = new Set<string>();
        for (const info of listingMap.values()) {
          if (info.ownerId) ownerIds.add(info.ownerId);
        }
        if (ownerIds.size === 0) return of({ listingMap, profileMap: new Map<string, ProfileInfo>() });
        return forkJoin(
          [...ownerIds].map(oid =>
            this.profileApi.getProfile(oid).pipe(
              map(p => [oid, {
                name: `${p.name} ${p.surname}`.trim() || oid.slice(0, 8),
                avatar: p.avatar_url || '',
              }] as [string, ProfileInfo]),
              catchError(() => of([oid, { name: oid.slice(0, 8), avatar: '' }] as [string, ProfileInfo])),
            ),
          ),
        ).pipe(map(pEntries => ({ listingMap, profileMap: new Map(pEntries) })));
      }),
      map(({ listingMap, profileMap }) =>
        trades
          .filter(t => t.items.length >= 1)
          .map(t => {
            const id1 = t.items[0].from_item_id;
            const id2 = t.items.length >= 2 ? t.items[1].from_item_id : t.items[0].to_item_id;
            const a = listingMap.get(id1);
            const b = listingMap.get(id2);
            const p1 = a ? profileMap.get(a.ownerId) : undefined;
            const p2 = b ? profileMap.get(b.ownerId) : undefined;
            return {
              user1: p1?.name ?? '', user1Avatar: p1?.avatar ?? '',
              item1: a?.title ?? '', image1: a?.photo ?? SWAP_PHOTO_PLACEHOLDER,
              user2: p2?.name ?? '', user2Avatar: p2?.avatar ?? '',
              item2: b?.title ?? '', image2: b?.photo ?? SWAP_PHOTO_PLACEHOLDER,
              time: formatRelativeShort(t.created_at),
            };
          }),
      ),
    );
  }

  private resolveSwapHistoryCards(records: SwapRecord[]): Observable<RecentTrade[]> {
    if (records.length === 0) return of([]);

    const itemIds = new Set<string>();
    const profileIds = new Set<string>();
    for (const r of records) {
      if (r.given_item_id) itemIds.add(r.given_item_id);
      if (r.received_item_id) itemIds.add(r.received_item_id);
      if (r.profile_id) profileIds.add(r.profile_id);
      if (r.partner_profile_id) profileIds.add(r.partner_profile_id);
    }

    type ListingInfo = { title: string; photo: string };
    type ProfileInfo = { name: string; avatar: string };

    const listings$ = itemIds.size > 0
      ? forkJoin(
          [...itemIds].map(id =>
            this.api.getListing(id).pipe(
              map(l => [id, {
                title: l.title,
                photo: normalizeSwapPhotos(l.photos)[0] ?? SWAP_PHOTO_PLACEHOLDER,
              }] as [string, ListingInfo]),
              catchError(() => of([id, { title: id.slice(0, 8) + '…', photo: SWAP_PHOTO_PLACEHOLDER }] as [string, ListingInfo])),
            ),
          ),
        ).pipe(map(entries => new Map(entries)))
      : of(new Map<string, ListingInfo>());

    const profiles$ = profileIds.size > 0
      ? forkJoin(
          [...profileIds].map(pid =>
            this.profileApi.getProfile(pid).pipe(
              map(p => [pid, {
                name: `${p.name} ${p.surname}`.trim() || pid.slice(0, 8),
                avatar: p.avatar_url || '',
              }] as [string, ProfileInfo]),
              catchError(() => of([pid, { name: pid.slice(0, 8), avatar: '' }] as [string, ProfileInfo])),
            ),
          ),
        ).pipe(map(entries => new Map(entries)))
      : of(new Map<string, ProfileInfo>());

    return forkJoin([listings$, profiles$]).pipe(
      map(([listingMap, profileMap]) =>
        records.map(r => {
          const given = listingMap.get(r.given_item_id);
          const received = listingMap.get(r.received_item_id);
          const user = profileMap.get(r.profile_id);
          const partner = profileMap.get(r.partner_profile_id);
          return {
            user1: user?.name ?? '', user1Avatar: user?.avatar ?? '',
            item1: given?.title ?? '', image1: given?.photo ?? SWAP_PHOTO_PLACEHOLDER,
            user2: partner?.name ?? '', user2Avatar: partner?.avatar ?? '',
            item2: received?.title ?? '', image2: received?.photo ?? SWAP_PHOTO_PLACEHOLDER,
            time: formatRelativeShort(r.completed_at),
          };
        }),
      ),
    );
  }

  private refreshLiveActivities() {
    const trades = this.recentTrades();
    const items = this.swapItems();
    const activities: LiveActivity[] = [];

    for (const trade of trades.slice(0, 3)) {
      activities.push({
        id: `swap-${activities.length}`,
        type: 'swap',
        user: trade.user1,
        item: `${trade.item1} → ${trade.item2}`,
        time: trade.time,
      });
    }

    const newest = [...items]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
    const ownerIds = [...new Set(newest.map(i => i.owner_id).filter(Boolean))];

    if (ownerIds.length === 0) {
      this.liveActivities.set(activities);
      return;
    }

    forkJoin(
      ownerIds.map(oid =>
        this.profileApi.getProfile(oid).pipe(
          map(p => [oid, `${p.name} ${p.surname}`.trim() || oid.slice(0, 8)] as [string, string]),
          catchError(() => of([oid, oid.slice(0, 8)] as [string, string])),
        ),
      ),
    ).subscribe(entries => {
      const nameMap = new Map(entries);
      for (const item of newest) {
        activities.push({
          id: `new-${item.id}`,
          type: 'new',
          user: nameMap.get(item.owner_id) ?? '',
          item: item.title,
          time: item.postedDate ?? formatRelativeShort(item.created_at),
        });
      }
      this.liveActivities.set(activities);
    });
  }

  private buildFallbackCards() {
    const items = this.swapItems();
    if (items.length < 2) {
      this.isRecentTradesLoading.set(false);
      return;
    }

    const pairs: { a: SwapItem; b: SwapItem }[] = [];
    for (let i = 0; i + 1 < items.length && pairs.length < 4; i += 2) {
      pairs.push({ a: items[i], b: items[i + 1] });
    }

    const ownerIds = new Set<string>();
    for (const { a, b } of pairs) {
      if (a.owner_id) ownerIds.add(a.owner_id);
      if (b.owner_id) ownerIds.add(b.owner_id);
    }

    type ProfileInfo = { name: string; avatar: string };

    const profiles$ = ownerIds.size > 0
      ? forkJoin(
          [...ownerIds].map(oid =>
            this.profileApi.getProfile(oid).pipe(
              map(p => [oid, {
                name: `${p.name} ${p.surname}`.trim() || oid.slice(0, 8),
                avatar: p.avatar_url || '',
              }] as [string, ProfileInfo]),
              catchError(() => of([oid, { name: oid.slice(0, 8), avatar: '' }] as [string, ProfileInfo])),
            ),
          ),
        ).pipe(map(entries => new Map(entries)))
      : of(new Map<string, ProfileInfo>());

    profiles$.subscribe(profileMap => {
      const cards: RecentTrade[] = pairs.map(({ a, b }) => {
        const p1 = profileMap.get(a.owner_id);
        const p2 = profileMap.get(b.owner_id);
        return {
          user1: p1?.name ?? '', user1Avatar: p1?.avatar ?? '',
          item1: a.title,
          image1: normalizeSwapPhotos(a.photos)[0] ?? SWAP_PHOTO_PLACEHOLDER,
          user2: p2?.name ?? '', user2Avatar: p2?.avatar ?? '',
          item2: b.title,
          image2: normalizeSwapPhotos(b.photos)[0] ?? SWAP_PHOTO_PLACEHOLDER,
          time: formatRelativeShort(a.created_at),
        };
      });
      this.recentTrades.set(cards);
      this.isRecentTradesLoading.set(false);
      this.refreshLiveActivities();
    });
  }
}
