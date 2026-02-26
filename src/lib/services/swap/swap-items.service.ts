import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from '../identity/auth.service';
import { SwapListingApiService, SwapListing } from './';
import { SnackbarService } from '../snackbar.service';

export interface PostedSwapItem {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  wantedItem: string; 
  photos: string[]; 
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;

  location?: string;
  valueRange?: string;
  condition?: string;
}

@Injectable({
  providedIn: 'root'
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
        const items = response.listings.map(this.mapToPostedItem);
        this._postedItems.set(items);
        this._isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load user listings', error);
        this._isLoading.set(false);
      }
    });
  }

  addItem(item: { title: string; description: string; wantedItem: string; images: File[] }) {
    const userId = this.auth.user()?.id;
    if (!userId) {
      console.error('User not authenticated - cannot create listing');
      this.snackbar.error('განცხადების ატვირთვა მხოლოდ ავტორიზებულ პროფილებს შეუძლიათ');
      return;
    }

    console.log('Creating listing for user:', userId, 'with data:', {
      title: item.title,
      wantedItem: item.wantedItem,
      imageCount: item.images.length
    });

    this._isLoading.set(true);
    return this.api.createListing(userId, {
      title: item.title,
      swap_item_title: item.wantedItem,
      description: item.description,
      files: item.images
    });
  }

  updateItem(id: string, updates: { title?: string; description?: string; wantedItem?: string; photos_to_delete?: string[]; new_files?: File[] }) {
    const userId = this.auth.user()?.id;
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    this._isLoading.set(true);
    this.api.updateListing(id, userId, {
      title: updates.title,
      swap_item_title: updates.wantedItem,
      description: updates.description,
      photos_to_delete: updates.photos_to_delete,
      new_files: updates.new_files
    }).subscribe({
      next: () => {
        this.loadUserListings();
      },
      error: (error) => {
        console.error('Failed to update listing', error);
        this._isLoading.set(false);
      }
    });
  }

  deleteItem(id: string) {
    const userId = this.auth.user()?.id;
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    this._isLoading.set(true);
    this.api.deleteListing(id, userId).subscribe({
      next: () => {
        this._postedItems.update(items => items.filter(item => item.id !== id));
        this._isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to delete listing', error);
        this._isLoading.set(false);
      }
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
      status: 'active', // Backend doesn't have status yet, default to active
      createdAt: new Date(listing.created_at).toLocaleDateString('ka-GE')
    };
  }
}
