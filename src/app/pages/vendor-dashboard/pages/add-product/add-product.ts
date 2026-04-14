import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { NonNullableFormBuilder, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { ShopService } from 'lib/services/shop/shop.service';
import { Category, FilterField, FilterGroup } from 'src/app/pages/shop/shop.models';
import { VendorProductCreate, VendorProfile } from 'lib/models/vendor.models';
import { SnackbarService } from 'lib/services/snackbar.service';
import { SNACKBAR_MESSAGES } from 'lib/constants/enums/snackbar-messages.enum';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
import {
  OptionItem,
  ProductForm,
  ProductTaskResponse,
  MAX_ADDITIONAL_IMAGES,
  createProductForm,
  toFilterGroups,
  getBrandOptions,
  getNonBrandFilterGroups,
  getAllSpecFields,
  mapSelectedOptionsToSpecifications,
  toInt,
  toFloat,
  buildSku,
  isValidImageFile,
} from '../product-form.utils';

@Component({
  selector: 'app-add-product',
  imports: [ReactiveFormsModule, TranslatePipe, MatFormFieldModule, MatSelectModule, MatIconModule, MatInputModule],
  templateUrl: './add-product.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProduct implements OnInit {
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
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

  coverImageFile: File | null = null;
  coverImagePreview = signal<string | null>(null);
  coverImageTouched = signal<boolean>(false);
  additionalFiles: File[] = [];
  additionalPreviews = signal<string[]>([]);

  productForm!: ProductForm;

  ngOnInit() {
    this.translation.loadModule('vendor')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
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
    this.productForm.patchValue({ category_id: String(id), brand_id: '' });
    this.filtersLoading.set(true);
    this.shopService.getFilterOptions(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => { this.filterGroups.set(toFilterGroups(response.filters)); this.filtersLoading.set(false); },
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

  getBrandOptions(): OptionItem[] {
    return getBrandOptions(this.filterGroups());
  }

  getNonBrandFilterGroups(): FilterGroup[] {
    return getNonBrandFilterGroups(this.filterGroups());
  }

  getAllSpecFields(): FilterField[] {
    return getAllSpecFields(this.filterGroups());
  }

  getAvailableSpecFields(): FilterField[] {
    return this.getAllSpecFields().filter(f => !this.getSelectedOptionForField(f.field_id));
  }

  getSelectedSpecField(): FilterField | null {
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
    const wasSelected = this.fieldOptionsArray.getRawValue().includes(optionId);
    if (!wasSelected) {
      this.fieldOptionsArray.push(this.fb.control(optionId));
      // Clear dropdown so it resets for next spec
      this.selectedSpecFieldId.set(null);
    }
    this.cdr.markForCheck();
  }

  isFieldOptionSelected(optionId: number): boolean {
    return this.fieldOptionsArray.getRawValue().includes(optionId);
  }
  getSelectedOptionForField(fieldId: number): OptionItem | null {
    const fieldOptions = this.getOptionsForField(fieldId);
    const fieldOptionIds = fieldOptions.map(o => o.option_id);
    const selectedId = this.fieldOptionsArray.getRawValue().find(id => fieldOptionIds.includes(id));
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
    if (currentSelected !== null && currentSelected !== fieldId) {
      const preserved = currentSelected;
      this.selectedSpecFieldId.set(null);
      setTimeout(() => this.selectedSpecFieldId.set(preserved));
    }
  }

  private getOptionsForField(fieldId: number): OptionItem[] {
    for (const group of this.filterGroups()) {
      for (const field of group.fields) {
        if (field.field_id === fieldId) return field.options;
      }
    }
    return [];
  }

  initForm(): void {
    this.productForm = createProductForm(this.fb);
  }

  get fieldOptionsArray(): FormArray<FormControl<number>> {
    return this.productForm.controls.field_options;
  }

  // Cover image upload
  onCoverImageSelected(event: Event) {
    this.coverImageTouched.set(true);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.snackbar.error(this.translation.translate('vendor.errors.invalidImageFile'));
      return;
    }
    if (!isValidImageFile(file)) {
      this.snackbar.error(this.translation.translate('vendor.errors.imageSizeLimit'));
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

    const newFiles = Array.from(input.files).filter(file => isValidImageFile(file));
    const remaining = MAX_ADDITIONAL_IMAGES - this.additionalFiles.length;
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
    this.runProductFlow(true);
  }

  handleSubmit() {
    if (this.productForm.invalid || !this.coverImageFile) {
      this.coverImageTouched.set(true);
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });

      if (!this.coverImageFile) {
        this.snackbar.error(this.translation.translate('vendor.errors.coverImageRequired'));
      } else {
        this.snackbar.error(this.translation.translate('vendor.errors.fillRequiredFields'));
      }
      return;
    }

    this.runProductFlow(false);
  }

  getErrorMessage(controlName: string): string {
    const control = this.productForm.get(controlName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return this.translation.translate('validation.required');
    if (control.hasError('minlength')) return this.translation.translate('validation.minlength', { n: control.getError('minlength').requiredLength });
    if (control.hasError('min')) return this.translation.translate('validation.min', { n: control.getError('min').min });
    if (control.hasError('pattern')) return this.translation.translate('validation.pattern');

    return '';
  }

  private extractTaskId(response: ProductTaskResponse): string | null {
    const candidate = response?.task_id ?? response?.taskId ?? response?.id ?? null;
    return candidate ? String(candidate) : null;
  }

  private getApiErrorMessage(error: unknown): string {
    const apiError = error as {
      status?: number;
      error?: { message?: string; error_code?: string; detail?: Array<{ msg?: string }> };
    };
    const message = apiError?.error?.message || apiError?.error?.detail?.[0]?.msg;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (apiError?.status === 404 && apiError?.error?.error_code === 'SELLER_NOT_FOUND') {
      return this.translation.translate('vendor.errors.sellerNotFound');
    }

    return SNACKBAR_MESSAGES.ERROR_GENERIC;
  }

  private runProductFlow(isDraft: boolean): void {
    const profile = this.getValidProfile();
    if (!profile) return;

    const productData = this.buildProductPayload(isDraft);
    this.setLoadingState(isDraft, true);

    this.vendorService
      .createProductDraft(profile.supplier_id, productData)
      .pipe(
        switchMap((createResponse: ProductTaskResponse) => {
          const taskId = this.extractTaskId(createResponse);
          if (!taskId) {
            throw new Error('Task ID was not returned from create draft endpoint');
          }

          return this.uploadImagesIfNeeded(profile.supplier_id, taskId).pipe(
            switchMap(() => (
              isDraft
                ? of(null)
                : this.vendorService.submitTaskProduct(profile.supplier_id, taskId)
            ))
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.setLoadingState(isDraft, false);
          this.snackbar.success(this.translation.translate(isDraft ? 'vendor.errors.draftSuccess' : 'vendor.errors.publishSuccess'));
          this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
        },
        error: (error: unknown) => {
          this.setLoadingState(isDraft, false);
          this.snackbar.error(this.getApiErrorMessage(error));
        },
      });
  }

  private getValidProfile(): VendorProfile | null {
    const profile = this.vendorProfile();
    if (!profile) {
      this.snackbar.error(this.translation.translate('vendor.errors.vendorNotFound'));
      return null;
    }

    if ((profile.status || '').toLowerCase() === 'pending') {
      this.snackbar.error(this.translation.translate('vendor.errors.sellerPending'));
      return null;
    }

    return profile;
  }

  private buildProductPayload(isDraft: boolean): VendorProductCreate {
    const value = this.productForm.getRawValue();

    return {
      category_id: isDraft ? toInt(value.category_id) : toInt(value.category_id, 1),
      brand_id: toInt(value.brand_id),
      title: isDraft ? value.title || 'Untitled Draft' : value.title,
      description: isDraft ? value.description || '' : value.description,
      price: isDraft ? toFloat(value.price) : toFloat(value.price, 1),
      quantity: value.quantity,
      sku: buildSku(value.sku, isDraft),
      specifications: mapSelectedOptionsToSpecifications(value.field_options || [], this.filterGroups()),
    };
  }

  private uploadImagesIfNeeded(supplierId: number, taskId: string): Observable<unknown> {
    const filesToUpload = this.collectUploadFiles();
    return filesToUpload.length
      ? this.vendorService.uploadTaskImages(supplierId, taskId, filesToUpload)
      : of(null);
  }

  private collectUploadFiles(): File[] {
    return [
      ...(this.coverImageFile ? [this.coverImageFile] : []),
      ...this.additionalFiles,
    ];
  }

  private setLoadingState(isDraft: boolean, value: boolean): void {
    if (isDraft) {
      this.isSavingDraft.set(value);
      return;
    }
    this.isSubmitting.set(value);
  }

}
