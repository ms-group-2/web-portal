import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-product-card-skeleton',
  template: `
    <div class="bg-white rounded-2xl overflow-hidden w-[272px] h-[325px] flex flex-col animate-pulse">
      <div class="relative h-[180px] bg-gray-200 flex-shrink-0"></div>

      <div class="px-4 pb-4 flex flex-col flex-grow pt-4">
        <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>

        <div class="flex items-center gap-2 mb-5">
          <div class="h-6 bg-gray-200 rounded w-20"></div>
          <div class="h-4 bg-gray-200 rounded w-16"></div>
        </div>

        <div class="w-full h-10 bg-gray-200 rounded-xl mt-auto"></div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardSkeletonComponent {}
