import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-mobile-filter-bar',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between lg:hidden">
      <button
        (click)="filterClick.emit()"
        class="relative w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200 active:scale-95 transition-transform">
        <mat-icon fontSet="material-icons-outlined" class="!text-lg !w-5 !h-5 text-gray-700">tune</mat-icon>
        @if (filterCount() > 0) {
          <span class="absolute -top-1.5 -right-1.5 min-w-lg h-5 flex items-center justify-center rounded-full bg-market text-white text-xs font-bold px-1">
            {{ filterCount() }}
          </span>
        }
      </button>

      <p class="text-gray-600 text-sm font-medium">
        @if (!loading()) {
          {{ productCount() }} {{ productLabel() }}
        }
      </p>

      <div class="flex items-center gap-2">
        @if (categoryCount() > 0) {
          <button
            (click)="categoryClick.emit()"
            class="relative w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200 active:scale-95 transition-transform">
            <mat-icon fontSet="material-icons-outlined" class="!text-lg !w-5 !h-5 text-gray-700">category</mat-icon>
            <span class="absolute -top-1.5 -right-1.5 min-w-lg h-5 flex items-center justify-center rounded-full bg-market text-white text-xs font-bold px-1">
              {{ categoryCount() }}
            </span>
          </button>
        }

        <button
          (click)="sortClick.emit()"
          class="relative w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200 active:scale-95 transition-transform">
          <mat-icon fontSet="material-icons-outlined" class="!text-lg !w-5 !h-5 text-gray-700">sort</mat-icon>
          @if (sortActive()) {
            <span class="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-market"></span>
          }
        </button>
      </div>
    </div>
  `,
})
export class MobileFilterBar {
  readonly filterCount = input<number>(0);
  readonly productCount = input<number>(0);
  readonly productLabel = input<string>('products');
  readonly loading = input<boolean>(false);
  readonly sortActive = input<boolean>(false);
  readonly categoryCount = input<number>(0);

  readonly filterClick = output<void>();
  readonly sortClick = output<void>();
  readonly categoryClick = output<void>();
}
