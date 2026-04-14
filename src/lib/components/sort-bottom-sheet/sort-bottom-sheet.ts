import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { BottomSheet } from 'lib/components/bottom-sheet/bottom-sheet';
import { SortOptionsList, SortOption } from 'lib/components/sort-options-list/sort-options-list';

@Component({
  selector: 'app-sort-bottom-sheet',
  imports: [MatIcon, TranslatePipe, BottomSheet, SortOptionsList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-bottom-sheet [open]="open()" size="small" (closed)="closed.emit()">
      <div class="flex items-center justify-between px-5 pt-4 pb-3" header>
        <h3 class="text-lg font-black text-gray-900 uppercase">{{ 'shop.filters.sortBy' | translate }}</h3>
        <button (click)="closed.emit()" class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
          <mat-icon class="!text-[20px] !w-[20px] !h-[20px] text-gray-600">close</mat-icon>
        </button>
      </div>

      <div class="px-5 pb-6" body>
        <app-sort-options-list
          [options]="options()"
          [currentValue]="currentValue()"
          (selected)="onSelect($event)" />
      </div>
    </app-bottom-sheet>
  `,
})
export class SortBottomSheet {
  readonly open = input.required<boolean>();
  readonly options = input.required<SortOption[]>();
  readonly currentValue = input<string>('');

  readonly closed = output<void>();
  readonly sortSelected = output<string>();

  onSelect(value: string): void {
    this.sortSelected.emit(value);
    this.closed.emit();
  }
}
