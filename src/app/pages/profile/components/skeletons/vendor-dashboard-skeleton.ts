import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-vendor-dashboard-skeleton',
  template: `
    <div class="px-4 pb-6 sm:px-6 sm:py-8 md:p-8 animate-pulse">
      <div class="max-w-6xl mx-auto">
        <!-- Title skeleton -->
        <div class="h-8 sm:h-10 md:h-12 bg-gray-200 rounded w-48 sm:w-64 mb-6 sm:mb-8 md:mb-10"></div>

        <!-- Main card skeleton -->
        <div class="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 mb-6 sm:mb-8 border border-gray-200">
          <!-- Header with icon and title -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div class="w-11 h-11 sm:w-14 sm:h-14 bg-gray-200 rounded-xl sm:rounded-2xl flex-shrink-0"></div>
            <div class="flex-1">
              <div class="h-7 sm:h-8 md:h-9 bg-gray-200 rounded w-48 sm:w-64 mb-2"></div>
              <div class="h-4 sm:h-5 bg-gray-200 rounded w-32 sm:w-40"></div>
            </div>
          </div>

          <!-- Description skeleton -->
          <div class="mb-6 sm:mb-8 space-y-2">
            <div class="h-4 md:h-5 bg-gray-200 rounded w-full max-w-3xl"></div>
            <div class="h-4 md:h-5 bg-gray-200 rounded w-4/5 max-w-3xl"></div>
          </div>

          <!-- Button skeleton -->
          <div class="h-11 sm:h-12 bg-gray-200 rounded-xl w-full sm:w-64"></div>
        </div>

        <!-- Feature cards skeleton (for landing view) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          @for (card of featureCards; track card) {
            <div class="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
              <div class="flex items-start gap-3 sm:gap-4">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg sm:rounded-xl flex-shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-5 sm:h-6 bg-gray-200 rounded w-32 sm:w-40"></div>
                  <div class="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
                  <div class="h-3 sm:h-4 bg-gray-200 rounded w-4/5"></div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDashboardSkeletonComponent {
  featureCards = [1, 2, 3, 4]; // 4 feature cards
}
