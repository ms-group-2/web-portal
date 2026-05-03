import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of, map, switchMap, catchError } from 'rxjs';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import {
  SwapListingApiService,
  ProposalResponse,
  SwapOfferResponse,
  TradeChain,
} from 'lib/services/swap';
import { AuthService } from 'lib/services/identity/auth.service';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslationService } from 'lib/services/translation.service';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';
import { formatRelativeShort } from 'lib/utils/relative-time';

type NotifTab = 'all' | 'proposals' | 'offers' | 'chains';

interface TabConfig {
  id: NotifTab;
  labelKey: string;
  badge: number;
}

interface ProposalCard {
  kind: 'proposal';
  id: string;
  targetListingId: string;
  targetListingTitle: string;
  status: string;
  createdLabel: string;
  message: string;
  items: { id: string; title: string; image_url: string; condition: string }[];
  sortDate: number;
}

interface OfferCard {
  kind: 'offer';
  id: string;
  receiverItemId: string;
  senderItemId: string;
  direction: 'sent' | 'received';
  status: string;
  createdLabel: string;
  sortDate: number;
}

interface ChainCard {
  kind: 'chain';
  id: string;
  status: string;
  createdLabel: string;
  expiresLabel: string;
  participantCount: number;
  items: { fromItemId: string; toItemId: string; status: string }[];
  isPending: boolean;
  sortDate: number;
}

type NotificationCard = ProposalCard | OfferCard | ChainCard;

interface ItemInfo {
  title: string;
  photo: string;
}

@Component({
  selector: 'app-swap-notifications',
  imports: [MatIconModule, Header, Footer, TranslatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapNotifications {
  private router = inject(Router);
  private auth = inject(AuthService);
  private api = inject(SwapListingApiService);
  private snackbar = inject(SnackbarService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  activeTab = signal<NotifTab>('all');
  isLoading = signal(true);
  error = signal<string | null>(null);

  proposals = signal<ProposalCard[]>([]);
  offers = signal<OfferCard[]>([]);
  chains = signal<ChainCard[]>([]);
  expandedIds = signal<Set<string>>(new Set());
  respondingIds = signal<Set<string>>(new Set());
  itemInfoMap = signal<Map<string, ItemInfo>>(new Map());

  allCards = computed<NotificationCard[]>(() => {
    const all: NotificationCard[] = [
      ...this.proposals(),
      ...this.offers(),
      ...this.chains(),
    ];
    return all.sort((a, b) => b.sortDate - a.sortDate);
  });

  filteredCards = computed(() => {
    const tab = this.activeTab();
    if (tab === 'all') return this.allCards();
    if (tab === 'proposals') return this.proposals() as NotificationCard[];
    if (tab === 'offers') return this.offers() as NotificationCard[];
    return this.chains() as NotificationCard[];
  });

  pendingCount = computed(() =>
    this.allCards().filter(c => c.status.toLowerCase() === 'pending').length,
  );

  proposalPendingCount = computed(() =>
    this.proposals().filter(p => p.status.toLowerCase() === 'pending').length,
  );

  offerPendingCount = computed(() =>
    this.offers().filter(o => o.status.toLowerCase() === 'pending').length,
  );

  chainPendingCount = computed(() =>
    this.chains().filter(c => c.isPending).length,
  );

  tabs = computed<TabConfig[]>(() => [
    { id: 'all', labelKey: 'swap.notifications.tabAll', badge: this.pendingCount() },
    { id: 'proposals', labelKey: 'swap.notifications.tabProposals', badge: this.proposalPendingCount() },
    { id: 'offers', labelKey: 'swap.notifications.tabOffers', badge: this.offerPendingCount() },
    { id: 'chains', labelKey: 'swap.notifications.tabChains', badge: this.chainPendingCount() },
  ]);

  asProposal = (card: NotificationCard) => card as ProposalCard;
  asOffer = (card: NotificationCard) => card as OfferCard;
  asChain = (card: NotificationCard) => card as ChainCard;

  constructor() {
    this.loadAll();
  }

  setTab(tab: NotifTab) {
    this.activeTab.set(tab);
  }

  toggleExpanded(id: string) {
    this.expandedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  isResponding(id: string): boolean {
    return this.respondingIds().has(id);
  }

  goBack() {
    this.router.navigate(['/swap']);
  }

  viewListing(listingId: string) {
    this.router.navigate(['/swap', listingId]);
  }

  viewTradeDetail(chainId: string) {
    this.router.navigate(['/swap/trade', chainId]);
  }

  getItemTitle(id: string): string {
    return this.itemInfoMap().get(id)?.title ?? id.slice(0, 8) + '…';
  }

  getItemPhoto(id: string): string {
    return this.itemInfoMap().get(id)?.photo ?? SWAP_PHOTO_PLACEHOLDER;
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

  respondToOffer(offerId: string, accept: boolean) {
    this.respondingIds.update(s => new Set([...s, offerId]));
    this.api.respondToSwapOffer(offerId, { accept })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.respondingIds.update(s => { const n = new Set(s); n.delete(offerId); return n; });
          this.offers.update(list =>
            list.map(o => o.id === offerId ? { ...o, status: accept ? 'accepted' : 'rejected' } : o),
          );
          this.snackbar.success(
            this.translation.translate(accept ? 'swap.notifications.accepted' : 'swap.notifications.declined'),
          );
        },
        error: () => {
          this.respondingIds.update(s => { const n = new Set(s); n.delete(offerId); return n; });
          this.snackbar.error(this.translation.translate('swap.notifications.respondError'));
        },
      });
  }

  voteOnChain(chainId: string, accept: boolean) {
    this.respondingIds.update(s => new Set([...s, chainId]));
    this.api.voteOnTrade(chainId, { accept })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.respondingIds.update(s => { const n = new Set(s); n.delete(chainId); return n; });
          this.loadAll();
          this.snackbar.success(
            this.translation.translate(accept ? 'swap.notifications.accepted' : 'swap.notifications.declined'),
          );
        },
        error: () => {
          this.respondingIds.update(s => { const n = new Set(s); n.delete(chainId); return n; });
          this.snackbar.error(this.translation.translate('swap.notifications.respondError'));
        },
      });
  }

  private loadAll() {
    this.isLoading.set(true);
    this.error.set(null);

    const userId = this.auth.user()?.id;
    const userListings$ = userId
      ? this.api.getListingsByProfile(userId).pipe(map(r => r.items))
      : of([]);

    userListings$.pipe(
      switchMap(userListings => {
        const listingIds = userListings.map(l => l.id);

        return forkJoin({
          sentOffers: this.api.getMySentSwapOffers(),
          trades: this.api.getMyTrades(),
          receivedProposals: listingIds.length > 0
            ? forkJoin(listingIds.map(id => this.api.getProposalsForListing(id)))
            : of([] as ProposalResponse[][]),
          receivedOffers: listingIds.length > 0
            ? forkJoin(listingIds.map(id => this.api.getSwapOffersForItem(id)))
            : of([] as SwapOfferResponse[][]),
        }).pipe(map(data => ({ ...data, userListings })));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ userListings, sentOffers, receivedProposals, receivedOffers, trades }) => {
        const titleMap = new Map(userListings.map(l => [l.id, l.title]));
        const sentOfferIdSet = new Set(sentOffers.map(o => o.id));

        const allReceivedProposals = receivedProposals.flat();
        const uniqueProposals = this.dedupeById(allReceivedProposals);
        this.proposals.set(uniqueProposals.map(p => ({
          kind: 'proposal',
          id: p.id,
          targetListingId: p.target_listing_id,
          targetListingTitle: titleMap.get(p.target_listing_id) ?? '',
          status: p.status,
          createdLabel: formatRelativeShort(p.created_at),
          message: p.message,
          items: p.items.map(i => ({
            id: i.id,
            title: i.title,
            image_url: normalizeSwapPhotos(i.image_url)[0] ?? '',
            condition: i.condition,
          })),
          sortDate: new Date(p.created_at).getTime(),
        })));

        const allReceivedOffers = receivedOffers.flat();
        const allOffers = this.dedupeById([...sentOffers, ...allReceivedOffers]);
        this.offers.set(allOffers.map(o => ({
          kind: 'offer',
          id: o.id,
          receiverItemId: o.receiver_item_id,
          senderItemId: o.sender_item_id,
          direction: sentOfferIdSet.has(o.id) ? 'sent' as const : 'received' as const,
          status: o.status,
          createdLabel: formatRelativeShort(o.created_at),
          sortDate: new Date(o.created_at).getTime(),
        })));

        this.chains.set(trades.map(t => ({
          kind: 'chain',
          id: t.id,
          status: t.status,
          createdLabel: formatRelativeShort(t.created_at),
          expiresLabel: formatRelativeShort(t.expires_at),
          participantCount: t.items.length,
          items: t.items.map(i => ({
            fromItemId: i.from_item_id,
            toItemId: i.to_item_id,
            status: i.status,
          })),
          isPending: t.status.toLowerCase() === 'pending',
          sortDate: new Date(t.created_at).getTime(),
        })));

        this.isLoading.set(false);
        this.resolveItemInfo(allOffers, trades);
      },
      error: () => {
        this.error.set('load_failed');
        this.isLoading.set(false);
      },
    });
  }

  private resolveItemInfo(offers: SwapOfferResponse[], trades: TradeChain[]) {
    const ids = new Set<string>();
    for (const o of offers) {
      if (o.sender_item_id) ids.add(o.sender_item_id);
      if (o.receiver_item_id) ids.add(o.receiver_item_id);
    }
    for (const t of trades) {
      for (const i of t.items) {
        if (i.from_item_id) ids.add(i.from_item_id);
        if (i.to_item_id) ids.add(i.to_item_id);
      }
    }
    if (ids.size === 0) { this.itemInfoMap.set(new Map()); return; }

    forkJoin(
      [...ids].map(id =>
        this.api.getListing(id).pipe(
          map(l => [id, {
            title: l.title,
            photo: normalizeSwapPhotos(l.photos)[0] ?? SWAP_PHOTO_PLACEHOLDER,
          }] as [string, ItemInfo]),
          catchError(() => of([id, {
            title: id.slice(0, 8) + '…',
            photo: SWAP_PHOTO_PLACEHOLDER,
          }] as [string, ItemInfo])),
        ),
      ),
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(entries => {
      this.itemInfoMap.set(new Map(entries));
    });
  }

  private dedupeById<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter(i => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });
  }
}
