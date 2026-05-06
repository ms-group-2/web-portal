import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from 'lib/services/identity/auth.service';
import { SwapListingApiService } from './swap-listing-api.service';
import { SwapOfferResponse } from './models/swap-offer.model';

@Injectable({ providedIn: 'root' })
export class ExchangedItemsService {
  private api = inject(SwapListingApiService);
  private auth = inject(AuthService);

  private _ids = signal<Set<string>>(new Set());
  readonly ids = this._ids.asReadonly();
  readonly hasAny = computed(() => this._ids().size > 0);

  private loaded = false;
  private loading = false;

  load(force = false): void {
    if ((this.loaded && !force) || this.loading) return;
    if (!this.auth.isAuthenticated()) return;

    this.loading = true;

    const sent$ = this.api.getMySentSwapOffers().pipe(
      catchError(() => of([] as SwapOfferResponse[])),
    );

    const history$ = this.api.getSwapHistory({ limit: 100 }).pipe(
      catchError(() => of({ items: [], total: 0, page: 1, limit: 100, total_pages: 1 })),
    );

    forkJoin([sent$, history$]).subscribe(([sent, history]) => {
      const ids = new Set<string>();
      for (const offer of sent) {
        if (offer.status?.toLowerCase() === 'accepted') {
          if (offer.sender_item_id) ids.add(offer.sender_item_id);
          if (offer.receiver_item_id) ids.add(offer.receiver_item_id);
        }
      }
      for (const record of history.items) {
        if (record.given_item_id) ids.add(record.given_item_id);
        if (record.received_item_id) ids.add(record.received_item_id);
      }
      this._ids.set(ids);
      this.loaded = true;
      this.loading = false;
    });
  }

  isExchanged(itemId: string): boolean {
    return this._ids().has(itemId);
  }

  invalidate(): void {
    this.loaded = false;
  }
}
