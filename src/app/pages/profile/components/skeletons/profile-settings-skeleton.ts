import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-profile-settings-skeleton',
  template: `
    <div class="animate-pulse">
      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div class="h-8 bg-gray-200 rounded w-64"></div>
        <div class="w-full sm:w-auto h-11 bg-gray-200 rounded-lg" style="width: 120px;"></div>
      </div>

      <!-- Avatar and Name Section -->
      <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8 py-4 px-4 sm:pl-4 border border-gray-200 rounded-xl">
        <div class="w-24 h-24 bg-gray-200 rounded-full flex-shrink-0"></div>

        <div class="flex flex-col sm:flex-row items-center sm:justify-between flex-1 gap-4 w-full">
          <div class="text-center sm:text-left min-w-0 flex-1 w-full">
            <div class="h-7 bg-gray-200 rounded w-48 mb-2 mx-auto sm:mx-0"></div>
            <div class="h-4 bg-gray-200 rounded w-32 mx-auto sm:mx-0"></div>
          </div>
          <div class="w-full sm:w-auto h-11 bg-gray-200 rounded-lg" style="width: 180px;"></div>
        </div>
      </div>

      <!-- Form Fields Grid -->
      <div class="space-y-6">
        @for (row of fieldRows; track row) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            @for (field of [1, 2]; track field) {
              <div>
                <div class="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div class="h-12 bg-gray-200 rounded"></div>
              </div>
            }
          </div>
        }

        <!-- About Me -->
        <div>
          <div class="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div class="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t-2 border-gray-200">
        @for (stat of stats; track stat) {
          <div class="bg-white rounded-xl p-4 border border-gray-300">
            <div class="h-9 bg-gray-200 rounded w-16 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSettingsSkeletonComponent {
  fieldRows = [1, 2, 3]; // 3 rows of 2 fields each
  stats = [1, 2, 3]; // 3 stat cards
}
