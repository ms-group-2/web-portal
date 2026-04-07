import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { ShopService } from 'lib/services/shop/shop.service';
import { Category, FilterField, FilterGroup } from 'src/app/pages/shop/shop.models';
import { VendorProductCreate } from 'lib/models/vendor.models';
import { SnackbarService } from 'lib/services/snackbar.service';
import { SNACKBAR_MESSAGES } from 'lib/constants/enums/snackbar-messages.enum';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-product',
  imports: [ReactiveFormsModule, TranslatePipe, MatFormFieldModule, MatSelectModule, MatIconModule, MatInputModule],
  templateUrl: './add-product.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProduct implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  translation = inject(TranslationService);
  private vendorService = inject(VendorService);
  private shopService = inject(ShopService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  vendorProfile = this.vendorService.vendorProfile;
  isSubmitting = signal<boolean>(false);
  isSavingDraft = signal<boolean>(false);

  mainCategories = signal<Category[]>([]);
  subcategories = signal<Category[]>([]);
  subSubcategories = signal<Category[]>([]);

  // Filter options loaded per category
  filterGroups = signal<FilterGroup[]>([]);
  filtersLoading = signal<boolean>(false);
  expandedFilterFields = signal<Set<number>>(new Set());
  selectedSpecFieldId = signal<number | null>(null);

  // Image uploads
  coverImageFile: File | null = null;
  coverImagePreview = signal<string | null>(null);
  coverImageTouched = signal<boolean>(false);
  additionalFiles: File[] = [];
  additionalPreviews = signal<string[]>([]);

  productForm!: FormGroup;

  ngOnInit() {
    this.translation.loadModule('vendor').subscribe();
    this.initForm();
    this.loadCategories();
    this.vendorService.ensureProfileLoaded()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private loadCategories() {
    this.shopService.getMainCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cats => this.mainCategories.set(cats));
  }

  onParentCategoryChange(id: number) {
    this.subcategories.set([]);
    this.subSubcategories.set([]);
    this.productForm.patchValue({ category_id: '', brand_id: '' });
    this.filterGroups.set([]);
    if (id) {
      this.shopService.getSubcategories(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(subs => {
          this.subcategories.set(subs);
          if (subs.length === 0) this.selectLeafCategory(id);
        });
    }
  }

  onSubCategoryChange(id: number) {
    this.subSubcategories.set([]);
    this.productForm.patchValue({ category_id: '', brand_id: '' });
    this.filterGroups.set([]);
    if (id) {
      const selected = this.subcategories().find(c => Number(c.id) === id);
      if (selected?.has_subcategories) {
        this.shopService.getSubcategories(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(subs => {
            this.subSubcategories.set(subs);
            if (subs.length === 0) this.selectLeafCategory(id);
          });
      } else {
        this.selectLeafCategory(id);
      }
    }
  }

  onSubSubCategoryChange(id: number) {
    if (id) this.selectLeafCategory(id);
  }

  private selectLeafCategory(id: number) {
    this.productForm.patchValue({ category_id: id, brand_id: '' });
    this.filtersLoading.set(true);
    this.shopService.getFilterOptions(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => { this.filterGroups.set(this.toFilterGroups(response.filters)); this.filtersLoading.set(false); },
        error: () => { this.filterGroups.set([]); this.filtersLoading.set(false); }
      });
  }

  private toFilterGroups(filters: FilterField[]): FilterGroup[] {
    if (!filters?.length) {
      return [];
    }

    return [{
      group_id: 0,
      group_name: 'Filters',
      fields: filters,
    }];
  }

  getBrandOptions(): { option_id: number; option_value: string }[] {
    for (const group of this.filterGroups()) {
      for (const field of group.fields) {
        if (field.field_name.toLowerCase().includes('brand') || field.field_name.toLowerCase().includes('ბრენდ')) {
          return field.options;
        }
      }
    }
    return [];
  }

  getNonBrandFilterGroups(): FilterGroup[] {
    return this.filterGroups().map(group => ({
      ...group,
      fields: group.fields.filter(f =>
        !f.field_name.toLowerCase().includes('brand') &&
        !f.field_name.toLowerCase().includes('ბრენდ')
      )
    })).filter(g => g.fields.length > 0);
  }

  getAllSpecFields(): { field_id: number; field_name: string; options: { option_id: number; option_value: string }[] }[] {
    const fields: any[] = [];
    for (const group of this.getNonBrandFilterGroups()) {
      fields.push(...group.fields);
    }
    return fields;
  }

  getAvailableSpecFields() {
    return this.getAllSpecFields().filter(f => !this.getSelectedOptionForField(f.field_id));
  }

  getSelectedSpecField() {
    const id = this.selectedSpecFieldId();
    if (!id) return null;
    return this.getAllSpecFields().find(f => f.field_id === id) || null;
  }

  onSpecFieldSelect(fieldId: number) {
    this.selectedSpecFieldId.set(fieldId);
  }

  toggleFieldOption(fieldId: number, optionId: number) {
    // Single select per field: find which options belong to this field, remove them, then add new one
    const fieldOptions = this.getOptionsForField(fieldId);
    const fieldOptionIds = fieldOptions.map(o => o.option_id);

    // Remove any existing selection from this field
    for (let i = this.fieldOptionsArray.length - 1; i >= 0; i--) {
      if (fieldOptionIds.includes(this.fieldOptionsArray.at(i).value)) {
        this.fieldOptionsArray.removeAt(i);
      }
    }

    // Add new selection (toggle off if same)
    const wasSelected = (this.fieldOptionsArray.value as number[]).includes(optionId);
    if (!wasSelected) {
      this.fieldOptionsArray.push(this.fb.control(optionId));
      // Clear dropdown so it resets for next spec
      this.selectedSpecFieldId.set(null);
    }
    this.cdr.markForCheck();
  }

  isFieldOptionSelected(optionId: number): boolean {
    return (this.fieldOptionsArray.value as number[]).includes(optionId);
  }

  toggleFilterField(fieldId: number) {
    this.expandedFilterFields.update(set => {
      const next = new Set(set);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  }

  isFilterFieldExpanded(fieldId: number): boolean {
    return this.expandedFilterFields().has(fieldId);
  }

  getSelectedCountForField(fieldId: number): number {
    const fieldOptions = this.getOptionsForField(fieldId);
    const fieldOptionIds = fieldOptions.map(o => o.option_id);
    return (this.fieldOptionsArray.value as number[]).filter(id => fieldOptionIds.includes(id)).length;
  }

  getSelectedOptionForField(fieldId: number): { option_id: number; option_value: string } | null {
    const fieldOptions = this.getOptionsForField(fieldId);
    const fieldOptionIds = fieldOptions.map(o => o.option_id);
    const selectedId = (this.fieldOptionsArray.value as number[]).find(id => fieldOptionIds.includes(id));
    if (selectedId === undefined) return null;
    return fieldOptions.find(o => o.option_id === selectedId) || null;
  }

  removeFieldSelection(fieldId: number) {
    const currentSelected = this.selectedSpecFieldId();
    const fieldOptions = this.getOptionsForField(fieldId);
    const fieldOptionIds = fieldOptions.map(o => o.option_id);
    for (let i = this.fieldOptionsArray.length - 1; i >= 0; i--) {
      if (fieldOptionIds.includes(this.fieldOptionsArray.at(i).value)) {
        this.fieldOptionsArray.removeAt(i);
      }
    }
    this.cdr.markForCheck();
    // Preserve dropdown selection after options list changes
    if (currentSelected !== null && currentSelected !== fieldId) {
      const preserved = currentSelected;
      this.selectedSpecFieldId.set(null);
      setTimeout(() => this.selectedSpecFieldId.set(preserved));
    }
  }

  private getOptionsForField(fieldId: number): { option_id: number; option_value: string }[] {
    for (const group of this.filterGroups()) {
      for (const field of group.fields) {
        if (field.field_id === fieldId) return field.options;
      }
    }
    return [];
  }

  private mapSelectedOptionsToSpecifications(selectedOptions: any[]): Array<{ field_id: number; option_id: number }> {
    const selectedIds = selectedOptions
      .filter((opt) => opt !== '' && opt !== null && opt !== undefined)
      .map((opt) => (typeof opt === 'number' ? opt : Number(opt)))
      .filter((opt) => Number.isInteger(opt) && opt > 0);

    const optionToField = new Map<number, number>();
    for (const group of this.filterGroups()) {
      for (const field of group.fields) {
        for (const option of field.options) {
          optionToField.set(option.option_id, field.field_id);
        }
      }
    }

    return selectedIds
      .map((optionId) => {
        const fieldId = optionToField.get(optionId);
        return fieldId ? { field_id: fieldId, option_id: optionId } : null;
      })
      .filter((spec): spec is { field_id: number; option_id: number } => !!spec);
  }

  initForm() {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      sku: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      category_id: ['', [Validators.required, Validators.min(1)]],
      brand_id: [''],
      price: ['', [Validators.required, Validators.min(1)]],
      quantity: [1, [Validators.required, Validators.min(0)]],
      field_options: this.fb.array([]),
    });
  }

  get fieldOptionsArray(): FormArray {
    return this.productForm.get('field_options') as FormArray;
  }

  // Cover image upload
  onCoverImageSelected(event: Event) {
    this.coverImageTouched.set(true);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.snackbar.error('Please upload a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.snackbar.error('Image size must be up to 5MB');
      return;
    }

    this.coverImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.coverImagePreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeCoverImage() {
    this.coverImageTouched.set(true);
    this.coverImageFile = null;
    this.coverImagePreview.set(null);
  }

  // Additional images upload
  onAdditionalImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const newFiles = Array.from(input.files).filter(
      f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024
    );
    const remaining = 5 - this.additionalFiles.length;
    const filesToAdd = newFiles.slice(0, remaining);

    filesToAdd.forEach(file => {
      this.additionalFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.additionalPreviews.update(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeAdditionalImage(index: number) {
    this.additionalFiles.splice(index, 1);
    this.additionalPreviews.update(prev => prev.filter((_, i) => i !== index));
  }

  handleCancel() {
    this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
  }

  handleSaveDraft() {
    // Draft saves don't require cover image or full validation
    const profile = this.vendorProfile();
    if (!profile) {
      this.snackbar.error('Vendor profile not found. Please refresh and try again.');
      return;
    }

    if ((profile.status || '').toLowerCase() === 'pending') {
      this.snackbar.error('Your seller profile is pending approval.');
      return;
    }

    const formValue = this.productForm.value;
    const productData: VendorProductCreate = {
      category_id: parseInt(formValue.category_id) || 0,
      brand_id: parseInt(formValue.brand_id) || 0,
      title: formValue.title || 'Untitled Draft',
      description: formValue.description || '',
      price: parseFloat(formValue.price) || 0,
      quantity: parseInt(formValue.quantity) || 0,
      sku: (formValue.sku || '').toUpperCase() || `DRAFT-${Date.now()}`,
      specifications: this.mapSelectedOptionsToSpecifications(formValue.field_options || []),
    };

    this.isSavingDraft.set(true);

    this.vendorService
      .createProductDraft(profile.supplier_id, productData)
      .pipe(
        switchMap((createResponse: any) => {
          const taskId = this.extractTaskId(createResponse);
          if (!taskId) {
            throw new Error('Task ID was not returned from create draft endpoint');
          }

          const filesToUpload: File[] = [];
          if (this.coverImageFile) filesToUpload.push(this.coverImageFile);
          if (this.additionalFiles.length) filesToUpload.push(...this.additionalFiles);

          return filesToUpload.length
            ? this.vendorService.uploadTaskImages(profile.supplier_id, taskId, filesToUpload)
            : of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isSavingDraft.set(false);
          this.snackbar.success('Draft saved successfully');
          this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
        },
        error: (error) => {
          console.error('Failed to save draft:', error);
          this.isSavingDraft.set(false);
          this.snackbar.error(this.getApiErrorMessage(error));
        },
      });
  }

  handleSubmit() {
    if (this.productForm.invalid || !this.coverImageFile) {
      this.coverImageTouched.set(true);
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        if (control?.invalid) {
          console.warn(`Field "${key}" is invalid:`, control.errors, 'Value:', control.value);
        }
        control?.markAsTouched();
      });

      if (!this.coverImageFile) {
        this.snackbar.error('Cover image is required');
      } else {
        this.snackbar.error('Please fill in all required fields correctly');
      }
      return;
    }

    const profile = this.vendorProfile();
    if (!profile) {
      console.error('Vendor profile not found');
      this.snackbar.error('Vendor profile not found. Please refresh and try again.');
      return;
    }

    if ((profile.status || '').toLowerCase() === 'pending') {
      console.error('Seller profile is pending approval. Product creation is disabled.');
      this.snackbar.error('Your seller profile is pending approval.');
      return;
    }

    const formValue = this.productForm.value;
    const productData: VendorProductCreate = {
      category_id: parseInt(formValue.category_id),
      brand_id: parseInt(formValue.brand_id) || 0,
      title: formValue.title,
      description: formValue.description,
      price: parseFloat(formValue.price),
      quantity: parseInt(formValue.quantity),
      sku: formValue.sku.toUpperCase(),
      specifications: this.mapSelectedOptionsToSpecifications(formValue.field_options || []),
    };

    this.isSubmitting.set(true);

    this.vendorService
      .createProductDraft(profile.supplier_id, productData)
      .pipe(
        switchMap((createResponse: any) => {
          const taskId = this.extractTaskId(createResponse);
          if (!taskId) {
            throw new Error('Task ID was not returned from create draft endpoint');
          }

          const filesToUpload: File[] = [];
          if (this.coverImageFile) {
            filesToUpload.push(this.coverImageFile);
          }
          if (this.additionalFiles.length) {
            filesToUpload.push(...this.additionalFiles);
          }

          const upload$ = filesToUpload.length
            ? this.vendorService.uploadTaskImages(profile.supplier_id, taskId, filesToUpload)
            : of(null);

          return upload$.pipe(
            switchMap(() => this.vendorService.submitTaskProduct(profile.supplier_id, taskId))
          );
        }),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackbar.success('Product submitted successfully');
          this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
        },
        error: (error) => {
          console.error('Failed to create product:', error);
          this.isSubmitting.set(false);
          this.snackbar.error(this.getApiErrorMessage(error));
        },
      });
  }

  getErrorMessage(controlName: string): string {
    const control = this.productForm.get(controlName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('minLength')) return `Minimum length is ${control.getError('minLength').requiredLength}`;
    if (control.hasError('min')) return `Minimum value is ${control.getError('min').min}`;
    if (control.hasError('pattern')) return 'Invalid format';

    return '';
  }

  private extractTaskId(response: any): string | null {
    const candidate = response?.task_id ?? response?.taskId ?? response?.id ?? null;
    return candidate ? String(candidate) : null;
  }

  private getApiErrorMessage(error: any): string {
    const message = error?.error?.message || error?.error?.detail?.[0]?.msg;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (error?.status === 404 && error?.error?.error_code === 'SELLER_NOT_FOUND') {
      return 'Seller profile not found. Please refresh the page and try again.';
    }

    return SNACKBAR_MESSAGES.ERROR_GENERIC;
  }
}
