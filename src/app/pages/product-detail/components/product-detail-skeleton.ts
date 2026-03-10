import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-product-detail-skeleton',
  template: `
    <div class="max-w-7xl mx-auto px-6 py-8">

      <div class="mb-8">
        <div class="mb-6 flex items-center gap-2">
          <div class="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>

        <div class="flex items-center gap-2">
          <div class="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          @for (item of breadcrumbItems; track $index) {
            <div class="h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
            <div class="h-4 bg-gray-200 rounded" [class.w-24]="$index < breadcrumbItems.length - 1" [class.w-32]="$index === breadcrumbItems.length - 1" class="animate-pulse"></div>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

        <div class="space-y-4">
          <div class="aspect-square bg-gray-200 rounded-3xl animate-pulse"></div>

          <div class="flex gap-4">
            @for (thumb of thumbnailItems; track thumb) {
              <div class="w-20 h-20 bg-gray-200 rounded-xl animate-pulse"></div>
            }
          </div>
        </div>

        <div class="space-y-6 lg:pl-4">
          <div>
            <div class="h-10 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>

            <div class="flex flex-wrap items-center gap-3 mb-4">
              @for (badge of badgeItems; track badge) {
                <div class="h-8 bg-gray-200 rounded-full w-24 animate-pulse"></div>
              }
            </div>

            <div class="flex items-end gap-4 mb-6">
              <div class="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div class="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>

            <div class="space-y-2 mb-6">
              @for (line of descriptionLines; track line) {
                <div class="h-4 bg-gray-200 rounded animate-pulse" [class.w-full]="line < 3" [class.w-2/3]="line === 3"></div>
              }
            </div>
          </div>

          <div class="bg-white/80 rounded-3xl border border-gray-200/70 shadow-sm p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div class="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div class="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>

            <div class="flex gap-4">
              <div class="flex-1 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
              <div class="w-14 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>

          <div class="pt-6 border-t-2 border-dashed border-gray-200">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              @for (meta of metadataItems; track meta) {
                <div class="space-y-2">
                  <div class="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div class="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <div class="mb-16">
        <div class="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
        <div class="bg-gray-50 rounded-2xl p-8 space-y-6">
          @for (group of specificationGroups; track group) {
            <div>
              <div class="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
              <div class="space-y-2">
                @for (spec of specificationItems; track spec) {
                  <div class="flex justify-between py-2 border-b border-gray-200">
                    <div class="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div class="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailSkeletonComponent {
  breadcrumbItems = [1, 2, 3];
  thumbnailItems = [1, 2, 3, 4];
  badgeItems = [1, 2, 3];
  descriptionLines = [1, 2, 3];
  metadataItems = [1, 2, 3];
  specificationGroups = [1, 2];
  specificationItems = [1, 2, 3, 4, 5];
}
