import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-card-skeleton',
  imports: [CommonModule],
  template: `
    <div class="category-button relative rounded-lg overflow-hidden bg-gray-200 animate-pulse flex items-start justify-start pt-6 px-4" style="width: 142px; height: 172px;">
      <div class="h-4 bg-gray-300 rounded w-20 mb-2"></div>
      <div class="absolute bottom-0 right-0 w-20 h-20 bg-gray-300 rounded-tl-lg"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryCardSkeletonComponent {}
