import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FilterField } from 'src/app/pages/shop/shop.models';

@Component({
  selector: 'app-spec-filter-list',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (field of fields(); track field.field_id) {
      <div class="mb-2">
        <button
          type="button"
          (click)="toggleField(field.field_id)"
          class="w-full flex items-center justify-between py-2.5 px-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
          <span class="text-sm font-black text-gray-900">{{ field.field_name }}</span>
          <span class="text-gray-400 text-lg font-bold">{{ isFieldExpanded(field.field_id) ? '−' : '+' }}</span>
        </button>

        @if (isFieldExpanded(field.field_id)) {
          <div class="mt-1 space-y-0.5 max-h-40 overflow-y-auto pr-1 ml-2">
            @for (option of field.options; track option.option_id) {
              <label
                class="flex items-center gap-2 px-1 py-1 rounded text-xs"
                [ngClass]="option.product_count > 0 ? 'cursor-pointer hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'">
                <input
                  type="checkbox"
                  [disabled]="option.product_count === 0"
                  [checked]="isOptionSelected(field.field_id, option.option_id)"
                  (change)="filterToggled.emit({ fieldId: field.field_id, optionId: option.option_id })"
                  class="w-3.5 h-3.5 text-market bg-gray-100 border-gray-300 rounded focus:ring-market flex-shrink-0"
                />
                <span
                  class="leading-tight"
                  [ngClass]="option.product_count > 0 ? 'text-gray-700' : 'text-gray-400'">
                  {{ option.option_value }}
                  <span class="text-gray-400 ml-1">({{ option.product_count }})</span>
                </span>
              </label>
            }
          </div>
        }
      </div>
    }
  `,
})
export class SpecFilterList {
  readonly fields = input.required<FilterField[]>();
  readonly selectedFilters = input<Record<number, number[]>>({});

  readonly filterToggled = output<{ fieldId: number; optionId: number }>();

  private expandedFields = signal<Set<number>>(new Set());

  toggleField(fieldId: number): void {
    this.expandedFields.update(current => {
      const next = new Set(current);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  }

  isFieldExpanded(fieldId: number): boolean {
    return this.expandedFields().has(fieldId);
  }

  isOptionSelected(fieldId: number, optionId: number): boolean {
    const selected = this.selectedFilters()[fieldId];
    return selected ? selected.includes(optionId) : false;
  }
}
