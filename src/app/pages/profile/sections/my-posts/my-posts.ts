import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SwapItemsService } from 'lib/services/swap/swap-items.service';
import { ConfirmationDialogService } from 'lib/components/confirmation-dialog/confirmation-dialog.service';
import { SwapListingApiService } from 'lib/services/swap/swap-listing-api.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';

interface PostItem {
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

@Component({
  selector: 'app-my-posts',
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './my-posts.html',
  styleUrl: './my-posts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyPostsComponent {
  private swapItemsService = inject(SwapItemsService);
  private confirmDialog = inject(ConfirmationDialogService);
  private api = inject(SwapListingApiService);
  private translation = inject(TranslationService);

  postedItems = this.swapItemsService.postedItems;

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return this.translation.translate('profile.postStatus.active');
      case 'inactive': return this.translation.translate('profile.postStatus.inactive');
      case 'completed': return this.translation.translate('profile.postStatus.completed');
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'px-3 py-1 bg-market/20 text-market rounded-lg text-xs font-black uppercase';
      case 'inactive': return 'px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-black uppercase';
      case 'completed': return 'px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black uppercase';
      default: return 'px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-black uppercase';
    }
  }

  editPost(post: PostItem) {
    console.log('Edit post:', post);
  }

  deletePost(post: PostItem) {
    this.confirmDialog.confirm({
      title: this.translation.translate('profile.deletePostDialog.title'),
      message: this.translation.translate('profile.deletePostDialog.message'),
      confirmText: this.translation.translate('profile.deletePostDialog.confirm'),
      cancelText: this.translation.translate('profile.deletePostDialog.cancel'),
      confirmColor: 'warn',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.swapItemsService.deleteItem(post.id);
      }
    });
  }

  getItemPhoto(item: PostItem): string {
    if (item.photos && item.photos.length > 0) {
      const photo = item.photos[0];
      if (photo.startsWith('http://') || photo.startsWith('https://')) {
        return photo;
      }
      return this.api.getListingPhoto(photo);
    }
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="18" fill="%239ca3af"%3Eფოტო არ არის%3C/text%3E%3C/svg%3E';
  }
}
