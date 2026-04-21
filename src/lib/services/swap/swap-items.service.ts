import { Injectable, signal, inject } from '@angular/core';
import { Observable, of, forkJoin, switchMap, map } from 'rxjs';
import { AuthService } from '../identity/auth.service';
import { PostedSwapItem, SwapListingApiService, SwapListing } from './';
import { SnackbarService } from '../snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class SwapItemsService {
  private auth = inject(AuthService);
  private api = inject(SwapListingApiService);
  private snackbar = inject(SnackbarService);

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
    images: File[];
  }): Observable<SwapListing> | undefined {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.snackbar.error('განცხადების ატვირთვა მხოლოდ ავტორიზებულ პროფილებს შეუძლიათ');
      return undefined;
    }

    this._isLoading.set(true);
    return this.api
      .createListing(userId, {
        title: item.title,
        swap_item_title: item.wantedItem,
        description: item.description,
        price: item.price,
      })
      .pipe(
        switchMap((listing) => {
          if (item.images.length === 0) return of(listing);
          const uploads = item.images.map((file) =>
            this.api.getPhotoUploadUrl(listing.id, file.name).pipe(
              switchMap(({ upload_url, object_path }) =>
                this.api.uploadToPresignedUrl(upload_url, file).pipe(
                  switchMap(() => this.api.confirmPhoto(listing.id, object_path))
                )
              )
            )
          );
          return forkJoin(uploads).pipe(map(() => listing));
        })
      );
  }

  updateItem(id: string, updates: { title?: string; description?: string; wantedItem?: string }) {
    this._isLoading.set(true);
    this.api
      .updateListing(id, {
        title: updates.title,
        swap_item_title: updates.wantedItem,
        description: updates.description,
      })
      .subscribe({
        next: () => {
          this.loadUserListings();
        },
        error: () => {
          this._isLoading.set(false);
        },
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
      profile_id: listing.profile_id,
      title: listing.title,
      description: listing.description,
      wantedItem: listing.swap_item_title,
      photos: listing.photos,
      status: listing.is_locked ? 'inactive' : 'active',
      createdAt: new Date(listing.created_at).toLocaleDateString('ka-GE'),
    };
  }
}
