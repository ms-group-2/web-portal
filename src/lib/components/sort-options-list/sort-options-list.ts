import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

export interface SortOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-sort-options-list',
  imports: [NgClass, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (variant()) {
      @case ('pills') {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          @for (option of options(); track option.value) {
            <button
              type="button"
              (click)="selected.emit(option.value)"
              [class]="currentValue() === option.value
                ? 'h-12 rounded-2xl border border-market/20 bg-market text-white px-4 text-sm font-semibold shadow-sm transition'
                : 'h-12 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 px-4 text-sm font-semibold text-gray-700 transition'">
              {{ option.label | translate }}
            </button>
          }
        </div>
      }
      @default {
        <div class="rounded-2xl border border-gray-200 bg-gray-50 p-2 space-y-1">
          @for (option of options(); track option.value) {
            <button
              type="button"
              (click)="selected.emit(option.value)"
              class="w-full flex items-center justify-between px-3 py-3 rounded-xl border"
              [ngClass]="currentValue() === option.value
                ? 'bg-white border-market/20 shadow-sm text-market'
                : 'text-gray-700 hover:bg-white hover:border-gray-200 border-transparent transition-all'">
              <span class="text-sm font-semibold">
                {{ option.label | translate }}
              </span>
            </button>
          }
        </div>
      }
    }
  `,
})
export class SortOptionsList {
  readonly options = input.required<SortOption[]>();
  readonly currentValue = input<string>('');
  readonly variant = input<'list' | 'pills'>('list');

  readonly selected = output<string>();
}
