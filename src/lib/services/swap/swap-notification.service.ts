import { Injectable, computed, effect, inject, signal, DestroyRef, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, map, switchMap, catchError, Subscription } from 'rxjs';
import { AuthService } from 'lib/services/identity/auth.service';
import { StorageService } from 'lib/services/storage/storage.service';
import { NotificationSoundService } from 'lib/services/notification-sound.service';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslationService } from 'lib/services/translation.service';
import { SnackbarType } from 'lib/constants/enums/snackbar-messages.enum';
import { SwapListingApiService } from './swap-listing-api.service';
import { ProposalResponse, SwapOfferResponse, TradeChain } from './';

const POLL_INTERVAL = 60_000;
const STORAGE_KEY_PREFIX = 'vipo_notif_count_';

export interface NotificationData {
  receivedProposals: ProposalResponse[];
  receivedOffers: SwapOfferResponse[];
  trades: TradeChain[];
  userListingIds: string[];
}

@Injectable({ providedIn: 'root' })
export class SwapNotificationService {
  private api = inject(SwapListingApiService);
  private auth = inject(AuthService);
  private storage = inject(StorageService);
  private sound = inject(NotificationSoundService);
  private snackbar = inject(SnackbarService);
  private translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);

  private _pendingCount = signal(0);
  readonly pendingCount = this._pendingCount.asReadonly();
  readonly hasPending = computed(() => this._pendingCount() > 0);

  private _data = signal<NotificationData | null>(null);
  readonly data = this._data.asReadonly();

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastUserId: string | null = null;
  private initialLoadDone = false;
  private inFlight: Subscription | null = null;
  private cachedListingIds: string[] | null = null;
  private refreshDebounce: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      const userId = user?.id ?? null;

      if (userId === this.lastUserId) return;
      this.lastUserId = userId;

      this.stopPolling();
      this.cancelPending();

      if (userId) {
        const stored = this.storage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
        if (stored) {
          this._pendingCount.set(Number(stored) || 0);
        }
        this.initialLoadDone = false;
        this.scheduleRefresh(0);
        this.startPolling();
      } else {
        this._pendingCount.set(0);
        this._data.set(null);
        this.initialLoadDone = false;
      }
    });

    this.destroyRef.onDestroy(() => {
      this.stopPolling();
      this.cancelPending();
    });
  }

  private cancelPending(): void {
    this.inFlight?.unsubscribe();
    this.inFlight = null;
    this.cachedListingIds = null;
    if (this.refreshDebounce) {
      clearTimeout(this.refreshDebounce);
      this.refreshDebounce = null;
    }
  }

  private scheduleRefresh(delay: number): void {
    if (this.refreshDebounce) clearTimeout(this.refreshDebounce);
    this.refreshDebounce = setTimeout(() => {
      this.refreshDebounce = null;
      this.refresh();
    }, delay);
  }

  refresh(): void {
    const userId = this.auth.user()?.id;
    if (!userId || this.inFlight) return;

    const listingIds$ = this.cachedListingIds
      ? of(this.cachedListingIds)
      : this.api.getListingsByProfile(userId).pipe(map(r => r.items.map(l => l.id)));

    this.inFlight = listingIds$.pipe(
      switchMap(listingIds => {
        this.cachedListingIds = listingIds;
        const listingIdSet = new Set(listingIds);

        return forkJoin({
          proposals: this.api.getMyProposals().pipe(catchError(() => of([] as ProposalResponse[]))),
          sentOffers: this.api.getMySentSwapOffers().pipe(catchError(() => of([] as SwapOfferResponse[]))),
          trades: this.api.getMyTrades().pipe(catchError(() => of([] as TradeChain[]))),
        }).pipe(map(data => ({
          receivedProposals: data.proposals.filter(p => p.target_listing_id && listingIdSet.has(p.target_listing_id)),
          receivedOffers: data.sentOffers,
          trades: data.trades,
          listingIds,
        })));
      }),
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(data => {
      this.inFlight = null;
      if (!data) return;

      const proposalPending = data.receivedProposals
        .filter(p => p.status?.toLowerCase() === 'pending').length;
      const offerPending = data.receivedOffers
        .filter(o => o.status?.toLowerCase() === 'pending').length;
      const chainPending = data.trades
        .filter(t => t.status?.toLowerCase() === 'pending').length;

      const total = proposalPending + offerPending + chainPending;
      const prev = this._pendingCount();

      this._pendingCount.set(total);
      this._data.set({
        receivedProposals: data.receivedProposals,
        receivedOffers: data.receivedOffers,
        trades: data.trades,
        userListingIds: data.listingIds,
      });
      this.storage.setItem(`${STORAGE_KEY_PREFIX}${this.lastUserId}`, String(total));

      if (this.initialLoadDone && total > prev) {
        this.sound.play();
        const msg = this.translation.translate('swap.notifications.newNotifications')
          || 'You have new notifications!';
        this.snackbar.show(msg, SnackbarType.SWAP, 'notifications', 'right', 'bottom');
      }
      this.initialLoadDone = true;
    });
  }

  invalidateListingCache(): void {
    this.cachedListingIds = null;
  }

  private startPolling(): void {
    this.zone.runOutsideAngular(() => {
      this.pollTimer = setInterval(() => {
        this.zone.run(() => this.refresh());
      }, POLL_INTERVAL);
    });
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
