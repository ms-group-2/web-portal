import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-category-page-skeleton',
  template: `
    <div class="pt-8 pb-8 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32">

      <nav class="mb-8 sticky top-15 bg-white z-10 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-12 md:px-12 lg:-mx-20 lg:px-20 xl:-mx-32 xl:px-32">
        <div class="flex items-center gap-2">
          <div class="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          @for (item of breadcrumbItems; track $index) {
            <div class="h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
            <div class="h-4 bg-gray-200 rounded animate-pulse" [class.w-24]="$index < breadcrumbItems.length - 1" [class.w-32]="$index === breadcrumbItems.length - 1"></div>
          }
        </div>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <aside class="lg:col-span-3">
          <div class="bg-white rounded-lg border-2 border-gray-200 p-4 sticky top-24">
            <div class="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>

            <div class="space-y-2">
              @for (item of sidebarItems; track item) {
                <div class="w-full h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              }
            </div>
          </div>
        </aside>

        <main class="lg:col-span-9">
          <div class="mb-8">
            <div class="h-10 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div class="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            @for (item of productItems; track item) {
              <div class="bg-white rounded-2xl overflow-hidden w-full h-[325px] flex flex-col animate-pulse">
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
            }
          </div>
        </main>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryPageSkeletonComponent {
  breadcrumbItems = [1, 2, 3]; 
  sidebarItems = [1, 2, 3, 4, 5]; 
  productItems = [1, 2, 3, 4, 5, 6, 7, 8]; 
}
