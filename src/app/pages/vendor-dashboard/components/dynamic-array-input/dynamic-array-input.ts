import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dynamic-array-input',
  imports: [ReactiveFormsModule],
  templateUrl: './dynamic-array-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicArrayInput {
  formArray = input.required<FormArray>();
  placeholder = input<string>('');
  inputType = input<'text' | 'number' | 'url'>('text');
  addButtonText = input<string>('Add');
  addButtonIcon = input<string>('ph-plus');
  removeButtonIcon = input<string>('ph-x');
  showRemoveButton = input<boolean>(true);

  onAdd = output<void>();
  onRemove = output<number>();

  handleAdd() {
    this.onAdd.emit();
  }

  handleRemove(index: number) {
    this.onRemove.emit(index);
  }
}
