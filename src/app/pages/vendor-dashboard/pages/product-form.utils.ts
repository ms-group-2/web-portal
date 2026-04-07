import { NonNullableFormBuilder, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { FilterField, FilterGroup } from 'src/app/pages/shop/shop.models';

export type OptionItem = { option_id: number; option_value: string };
export type SpecificationPayload = { field_id: number; option_id: number };
export type ProductTaskResponse = { task_id?: string | number; taskId?: string | number; id?: string | number; product_id?: string | number };

export type ProductForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  sku: FormControl<string>;
  category_id: FormControl<string>;
  brand_id: FormControl<string>;
  price: FormControl<string>;
  quantity: FormControl<number>;
  field_options: FormArray<FormControl<number>>;
}>;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_ADDITIONAL_IMAGES = 5;

export function createProductForm(fb: NonNullableFormBuilder): ProductForm {
  return fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    sku: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
    category_id: ['', [Validators.required, Validators.min(1)]],
    brand_id: [''],
    price: ['', [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(0)]],
    field_options: fb.array<FormControl<number>>([]),
  });
}

export function toFilterGroups(filters: FilterField[]): FilterGroup[] {
  if (!filters?.length) return [];
  return [{ group_id: 0, group_name: 'Filters', fields: filters }];
}

export function isBrandField(fieldName: string): boolean {
  const value = fieldName.toLowerCase();
  return value.includes('brand') || value.includes('ბრენდ');
}

export function getBrandOptions(filterGroups: FilterGroup[]): OptionItem[] {
  for (const group of filterGroups) {
    for (const field of group.fields) {
      if (isBrandField(field.field_name)) return field.options;
    }
  }
  return [];
}

export function getNonBrandFilterGroups(filterGroups: FilterGroup[]): FilterGroup[] {
  return filterGroups
    .map(group => ({
      ...group,
      fields: group.fields.filter(field => !isBrandField(field.field_name)),
    }))
    .filter(group => group.fields.length > 0);
}

export function getAllSpecFields(filterGroups: FilterGroup[]): FilterField[] {
  const fields: FilterField[] = [];
  for (const group of getNonBrandFilterGroups(filterGroups)) {
    fields.push(...group.fields);
  }
  return fields;
}

export function mapSelectedOptionsToSpecifications(
  selectedOptions: readonly unknown[],
  filterGroups: FilterGroup[],
  fallbackSpecifications: readonly unknown[] = [],
): SpecificationPayload[] {
  const selectedIds = selectedOptions
    .filter(opt => opt !== '' && opt !== null && opt !== undefined)
    .map(opt => (typeof opt === 'number' ? opt : Number(opt)))
    .filter(opt => Number.isInteger(opt) && opt > 0);

  const optionToField = new Map<number, number>();
  for (const group of filterGroups) {
    for (const field of group.fields) {
      for (const option of field.options) {
        optionToField.set(option.option_id, field.field_id);
      }
    }
  }

  if (optionToField.size === 0 && Array.isArray(fallbackSpecifications)) {
    for (const spec of fallbackSpecifications) {
      const fieldId = Number((spec as { field_id?: unknown })?.field_id);
      const optionId = Number((spec as { option_id?: unknown })?.option_id);
      if (Number.isInteger(fieldId) && fieldId > 0 && Number.isInteger(optionId) && optionId > 0) {
        optionToField.set(optionId, fieldId);
      }
    }
  }

  return selectedIds
    .map(optionId => {
      const fieldId = optionToField.get(optionId);
      return fieldId ? { field_id: fieldId, option_id: optionId } : null;
    })
    .filter((spec): spec is SpecificationPayload => !!spec);
}

export function toInt(value: string, min = 0): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= min ? parsed : min;
}

export function toFloat(value: string, min = 0): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= min ? parsed : min;
}

export function buildSku(inputSku: string, isDraft: boolean): string {
  const sku = inputSku.trim().toUpperCase();
  if (sku) return sku;
  return isDraft ? `DRAFT-${Date.now()}` : sku;
}

export function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE_BYTES;
}

export function isUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
