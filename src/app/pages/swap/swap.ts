import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { SwapItem } from './swap.models';
import { PostSwapDialogComponent } from './components/post-swap-dialog/post-swap-dialog';
import { SwapItemsService, SwapListingApiService } from 'lib/services/swap';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslationService } from 'lib/services/translation.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';



@Component({
  selector: 'app-swap',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    Header,
    Footer,
    TranslatePipe
  ],
  templateUrl: './swap.html',
  styleUrl: './swap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Swap {
  private dialog = inject(MatDialog);
  private swapItemsService = inject(SwapItemsService);
  private api = inject(SwapListingApiService);
  private snackbar = inject(SnackbarService);
  private translationService = inject(TranslationService);

  swapItems = signal<SwapItem[]>([]);
  suggestedSwaps = signal<SwapItem[]>([]);
  isLoading = signal(false);
  currentPhotoIndexMap = new Map<string, number>();

  private dummySuggestedSwaps: SwapItem[] = [
    {
      id: 'suggested-1',
      profile_id: 'dummy',
      title: 'ვინტაჯური ფოტოაპარატი Canon AE-1',
      description: 'კლასიკური ფილმური კამერა შესანიშნავ მდგომარეობაში. იდეალურია ფოტოგრაფიის მოყვარულებისთვის.',
      swap_item_title: 'ფოტოგრაფიის აქსესუარები',
      photos: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: 'თბილისი',
      distance: '2 კმ',
      userRating: 4.8,
      verified: true
    },
    {
      id: 'suggested-2',
      profile_id: 'dummy',
      title: 'Nintendo Switch გეიმპედი',
      description: 'ორიგინალური Joy-Con კონტროლერები, ნაკლებად გამოყენებული. სრულყოფილ მუშა მდგომარეობაში.',
      swap_item_title: 'ვიდეო თამაშები',
      photos: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: 'თბილისი',
      distance: '5 კმ',
      userRating: 4.9,
      verified: false
    },
    {
      id: 'suggested-3',
      profile_id: 'dummy',
      title: 'დიზაინერის სამუშაო მაგიდა IKEA',
      description: 'თანამედროვე სტილის ხის მაგიდა, ძალიან კარგ მდგომარეობაში. შესაფერისია სახლის ოფისისთვის.',
      swap_item_title: 'ავეჯი ან დეკორაცია',
      photos: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: 'თბილისი',
      distance: '3 კმ',
      userRating: 5.0,
      verified: true
    }
  ];

  constructor() {
    this.translationService.loadModule('swap').subscribe();

    this.loadAllListings();
    this.suggestedSwaps.set(this.dummySuggestedSwaps);
  }

  loadAllListings() {
    this.isLoading.set(true);
    this.api.getAllListings().subscribe({
      next: (response) => {
        const items = response.items.map(listing => ({
          ...listing,
          location: 'თბილისი',
          distance: '0 კმ',
          userRating: 5.0,
          verified: false
        }));
        this.swapItems.set(items);
        if (items.length >= 3) {
          this.suggestedSwaps.set(items.slice(0, 3));
        } else if (items.length > 0) {
          const suggested = [...items, ...this.dummySuggestedSwaps.slice(0, 3 - items.length)];
          this.suggestedSwaps.set(suggested);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.swapItems.set([]);
      }
    });
  }

  searchQuery = signal('');
  selectedCategory = signal('');
  selectedDistance = signal('');
  sortBy = signal('');

  openPostDialog() {
    const dialogRef = this.dialog.open(PostSwapDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      panelClass: 'post-swap-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const createResult = this.swapItemsService.addItem({
          title: result.title,
          description: result.description,
          wantedItem: result.wantedItem,
          images: result.images
        });

        if (createResult) {
          createResult.subscribe({
            next: () => {
              this.snackbar.swap('განცხადება წარმატებით განთავსდა!');
              this.loadAllListings();
            },
            error: () => {
              this.snackbar.error('განცხადების დამატება ვერ მოხერხდა');
            }
          });
        }
      }
    });
  }

  proposeSwap(_item: SwapItem) {
    // TODO: implement swap proposal
  }

  getItemPhoto(item: SwapItem, index: number = 0): string {
    if (item.photos && item.photos.length > 0) {
      const photoIndex = Math.min(index, item.photos.length - 1);
      const photo = item.photos[photoIndex];
      if (photo.startsWith('http://') || photo.startsWith('https://')) {
        return photo;
      }
      return photo;
    }
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="18" fill="%239ca3af"%3Eფოტო არ არის%3C/text%3E%3C/svg%3E';
  }

  getCurrentPhotoIndex(itemId: string): number {
    return this.currentPhotoIndexMap.get(itemId) ?? 0;
  }

  setPhotoIndex(itemId: string, index: number): void {
    this.currentPhotoIndexMap.set(itemId, index);
  }

  resetPhotoIndex(itemId: string): void {
    this.currentPhotoIndexMap.set(itemId, 0);
  }
}
