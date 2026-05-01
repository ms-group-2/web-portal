import { Injectable, signal, inject } from '@angular/core';
import { Observable, of, concat, defer, switchMap, map, catchError, toArray } from 'rxjs';
import { AuthService } from '../identity/auth.service';
import { ApplyBoostRequest, PostedSwapItem, SwapListingApiService, SwapListing } from './';
import { SnackbarService } from '../snackbar.service';
import { TranslationService } from '../translation.service';
import { parseBackendDate } from '../../utils/relative-time';

@Injectable({
  providedIn: 'root',
})
export class SwapItemsService {
  private auth = inject(AuthService);
  private api = inject(SwapListingApiService);
  private snackbar = inject(SnackbarService);
  private translation = inject(TranslationService);

  private _postedItems = signal<PostedSwapItem[]>([]);
  private _isLoading = signal(false);

  postedItems = this._postedItems.asReadonly();
  isLoading = this._isLoading.asReadonly();

  constructor() {
    this.loadUserListings();
  }

  loadUserListings() {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this._isLoading.set(true);
    this.api.getListingsByProfile(userId).subscribe({
      next: (response) => {
        const items = response.items.map(this.mapToPostedItem);
        this._postedItems.set(items);
        this._isLoading.set(false);
      },
      error: () => {
        this._isLoading.set(false);
      },
    });
  }

  addItem(item: {
    title: string;
    description: string;
    wantedItem: string;
    price: number;
    location?: string;
    categoryId?: number;
    desiredCategoryIds?: number[];
    condition?: string;
    images: File[];
    boost?: ApplyBoostRequest;
  }): Observable<SwapListing> | undefined {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.snackbar.error('განცხადების ატვირთვა მხოლოდ ავტორიზებულ პროფილებს შეუძლიათ');
      return undefined;
    }

    this._isLoading.set(true);
    return this.api
      .createListing(userId, {
        title: item.title.trim(),
        swap_item_title: item.wantedItem.trim(),
        description: item.description.trim(),
        price: item.price,
        ...(item.location ? { location: item.location.trim() } : {}),
        ...(item.categoryId != null ? { category_id: item.categoryId } : {}),
        ...(item.condition ? { condition: item.condition } : {}),
        ...(item.desiredCategoryIds?.length
          ? { desired_category_ids: item.desiredCategoryIds }
          : {}),
      })
      .pipe(
        switchMap((listing) => this.uploadPhotosSequentially(listing, item.images)),
        switchMap((listing) => {
          if (
            !item.boost ||
            (!item.boost.boost_tier &&
              !item.boost.auto_update_days &&
              !(item.boost.stickers?.length))
          ) {
            return of(listing);
          }
          return this.api.applyBoost(listing.id, item.boost).pipe(
            map(() => listing),
            catchError(() => {
              this.snackbar.error(this.translation.translate('swap.postForm.boostApplyFailedAfterCreate'));
              return of(listing);
            }),
          );
        }),
      );
  }

  private uploadPhotosSequentially(listing: SwapListing, images: File[]): Observable<SwapListing> {
    if (!images.length) return of(listing);

    // Sequential uploads behave more predictably against MinIO / ngrok than
    // parallel forkJoin, and they let us surface the *first* real error.
    const uploads$ = concat(
      ...images.map((file, index) =>
        defer(() =>
          this.api.uploadPhoto(listing.id, file).pipe(
            map(() => true as const),
            catchError((err: unknown) => {
              // eslint-disable-next-line no-console
              console.error('[swap-photo] upload failed', { index, fileName: file.name, err });
              return of(false as const);
            }),
          ),
        ),
      ),
    );

    return uploads$.pipe(
      toArray(),
      map((results) => {
        const failed = results.filter((ok) => !ok).length;
        if (failed > 0) {
          this.snackbar.error(this.translation.translate('swap.postForm.photoUploadPartialError'));
        }
        return listing;
      }),
    );
  }

  updateItem(id: string, updates: { title?: string; description?: string; wantedItem?: string }): Observable<SwapListing> {
    this._isLoading.set(true);
    return this.api
      .updateListing(id, {
        title: updates.title,
        swap_item_title: updates.wantedItem,
        description: updates.description,
      });
  }

  deleteItem(id: string) {
    this._isLoading.set(true);
    this.api.deleteListing(id).subscribe({
      next: () => {
        this._postedItems.update((items) => items.filter((item) => item.id !== id));
        this._isLoading.set(false);
      },
      error: () => {
        this._isLoading.set(false);
      },
    });
  }

  private mapToPostedItem(listing: SwapListing): PostedSwapItem {
    return {
      id: listing.id,
      owner_id: listing.owner_id,
      title: listing.title,
      description: listing.description,
      wantedItem: listing.swap_item_title,
      photos: listing.photos,
      status: listing.status,
      createdAt: parseBackendDate(listing.created_at).toLocaleDateString('ka-GE'),
      location: listing.location,
      condition: listing.condition,
    };
  }
}
