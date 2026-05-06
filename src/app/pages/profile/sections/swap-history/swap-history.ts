import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of, map, catchError } from 'rxjs';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import {
  SwapListingApiService,
  SwapOfferResponse,
  TradeChain,
} from 'lib/services/swap';
import { normalizeSwapPhotos, SWAP_PHOTO_PLACEHOLDER } from 'lib/utils/swap-photos';
import { formatRelativeShort } from 'lib/utils/relative-time';

interface OfferCard {
  kind: 'offer';
  id: string;
  senderItemId: string;
  receiverItemId: string;
  status: string;
  createdLabel: string;
  sortDate: number;
}

interface ChainCard {
  kind: 'chain';
  id: string;
  status: string;
  createdLabel: string;
  participantCount: number;
  items: { fromItemId: string; toItemId: string; status: string }[];
  sortDate: number;
}

type HistoryCard = OfferCard | ChainCard;

interface ItemInfo {
  title: string;
  photo: string;
}

@Component({
  selector: 'app-swap-history',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './swap-history.html',
  styleUrl: './swap-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapHistoryComponent {
  private router = inject(Router);
  private api = inject(SwapListingApiService);
  private destroyRef = inject(DestroyRef);

  cards = signal<HistoryCard[]>([]);
  itemInfoMap = signal<Map<string, ItemInfo>>(new Map());
  isLoading = signal(true);

  constructor() {
    this.loadHistory();
  }

  asOffer = (card: HistoryCard) => card as OfferCard;
  asChain = (card: HistoryCard) => card as ChainCard;

  private loadHistory(): void {
    this.isLoading.set(true);

    forkJoin({
      offers: this.api.getMySentSwapOffers().pipe(catchError(() => of([] as SwapOfferResponse[]))),
      trades: this.api.getMyTrades().pipe(catchError(() => of([] as TradeChain[]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ offers, trades }) => {
        const nonPendingOffers = offers.filter(o => o.status?.toLowerCase() !== 'pending');
        const nonPendingTrades = trades.filter(t => t.status?.toLowerCase() !== 'pending');

        const offerCards: OfferCard[] = nonPendingOffers.map(o => ({
          kind: 'offer',
          id: o.id,
          senderItemId: o.sender_item_id,
          receiverItemId: o.receiver_item_id,
          status: o.status,
          createdLabel: formatRelativeShort(o.created_at),
          sortDate: new Date(o.created_at).getTime(),
        }));

        const chainCards: ChainCard[] = nonPendingTrades.map(t => ({
          kind: 'chain',
          id: t.id,
          status: t.status,
          createdLabel: formatRelativeShort(t.created_at),
          participantCount: t.items.length,
          items: t.items.map(i => ({
            fromItemId: i.from_item_id,
            toItemId: i.to_item_id,
            status: i.status,
          })),
          sortDate: new Date(t.created_at).getTime(),
        }));

        const all = [...offerCards, ...chainCards].sort((a, b) => b.sortDate - a.sortDate);
        this.cards.set(all);
        this.isLoading.set(false);
        this.resolveItems(nonPendingOffers, nonPendingTrades);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private resolveItems(offers: SwapOfferResponse[], trades: TradeChain[]): void {
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
    if (ids.size === 0) return;

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

  getItemTitle(id: string): string {
    return this.itemInfoMap().get(id)?.title ?? '…';
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

  viewItem(itemId: string): void {
    this.router.navigate(['/swap', itemId]);
  }

  viewTradeDetail(chainId: string): void {
    this.router.navigate(['/swap/trade', chainId]);
  }
}
