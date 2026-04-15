import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MatSlider, MatSliderRangeThumb } from '@angular/material/slider';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-price-range-filter',
  imports: [MatSlider, MatSliderRangeThumb, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-black text-gray-900 uppercase tracking-wide">
        {{ 'shop.filters.priceRange' | translate }}
      </span>
    </div>

    <div class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
      @if (showSlider()) {
        <div class="flex items-center justify-between text-xs font-bold text-gray-400 uppercase mb-2">
          <span>Min</span>
          <span>Max</span>
        </div>

        <mat-slider
          class="price-slider w-full"
          [min]="0"
          [max]="maxLimit()"
          [step]="resolvedStep()">
          <input
            matSliderStartThumb
            [value]="min()"
            (valueChange)="minChange.emit($event)" />
          <input
            matSliderEndThumb
            [value]="max()"
            (valueChange)="maxChange.emit($event)" />
        </mat-slider>

        <div class="flex items-center justify-between text-xs text-gray-500 font-medium mt-1 mb-4 px-1">
          <span>₾0</span>
          <span>₾{{ maxLimit() }}</span>
        </div>
      }

      <div class="grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold uppercase text-gray-400 mb-1">
            {{ 'shop.filters.from' | translate }}
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">₾</span>
            <input
              type="number"
              [value]="min()"
              (change)="onMinInput($event)"
              min="0"
              placeholder="0"
              class="w-full h-11 pl-8 pr-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-market/20 focus:border-market transition-all"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase text-gray-400 mb-1">
            {{ 'shop.filters.to' | translate }}
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">₾</span>
            <input
              type="number"
              [value]="displayMax()"
              (change)="onMaxInput($event)"
              min="0"
              [placeholder]="maxLimit()"
              class="w-full h-11 pl-8 pr-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-market/20 focus:border-market transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PriceRangeFilter {
  readonly min = input<number>(0);
  readonly max = input<number>(10000);
  readonly maxLimit = input<number>(10000);
  readonly step = input<number | undefined>(undefined);
  readonly showSlider = input<boolean>(true);

  readonly minChange = output<number>();
  readonly maxChange = output<number>();

  /** Empty string when max equals maxLimit (no user filter) → input shows placeholder instead. */
  readonly displayMax = computed(() => {
    const m = this.max();
    return m >= this.maxLimit() ? '' : m;
  });

  readonly resolvedStep = computed(() => {
    const override = this.step();
    if (override !== undefined) return override;
    const limit = this.maxLimit();
    if (limit <= 100) return 5;
    if (limit <= 500) return 10;
    if (limit <= 1000) return 25;
    if (limit <= 5000) return 50;
    return 100;
  });

  onMinInput(event: Event): void {
    this.minChange.emit(this.parseMin((event.target as HTMLInputElement).value));
  }

  onMaxInput(event: Event): void {
    this.maxChange.emit(this.parseMax((event.target as HTMLInputElement).value));
  }

  private parseMin(raw: string): number {
    const trimmed = raw.trim();
    if (trimmed === '') return 0;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, this.maxLimit());
  }

  /** Empty or invalid → maxLimit (no filter). */
  private parseMax(raw: string): number {
    const limit = this.maxLimit();
    const trimmed = raw.trim();
    if (trimmed === '') return limit;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n <= 0) return limit;
    return n;
  }
}
