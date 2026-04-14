import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NonNullableFormBuilder, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { ShopService } from 'lib/services/shop/shop.service';
import { Category, FilterField, FilterGroup } from 'src/app/pages/shop/shop.models';
import { VendorProductUpdate } from 'lib/models/vendor.models';
import { SnackbarService } from 'lib/services/snackbar.service';
import { DeleteConfirmationDialog } from '../../components/delete-confirmation-dialog/delete-confirmation-dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
  isValidImageFile,
  isUuid,
} from '../product-form.utils';

@Component({
  selector: 'app-edit-product',
  imports: [ReactiveFormsModule, TranslatePipe, MatFormFieldModule, MatSelectModule, MatIconModule, MatInputModule],
  templateUrl: './edit-product.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProduct implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(NonNullableFormBuilder);
  translation = inject(TranslationService);
  private vendorService = inject(VendorService);
  private shopService = inject(ShopService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  vendorProfile = this.vendorService.vendorProfile;
  isSubmitting = signal<boolean>(false);
  isSavingDraft = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  isDeleting = signal<boolean>(false);
  productId = signal<string | null>(null);
  currentProduct = signal<any>(null);

  mainCategories = signal<Category[]>([]);
  subcategories = signal<Category[]>([]);
  subSubcategories = signal<Category[]>([]);

  filterGroups = signal<FilterGroup[]>([]);
  filtersLoading = signal<boolean>(false);
  selectedSpecFieldId = signal<number | null>(null);

  // Image uploads
  coverImageFile: File | null = null;
  coverImagePreview = signal<string | null>(null);
  coverImageTouched = signal<boolean>(false);
  additionalFiles: File[] = [];
  additionalPreviews = signal<string[]>([]);
  // Track existing images from server (URLs)
  existingCoverUrl = signal<string | null>(null);
  existingImageUrls = signal<string[]>([]);
  removedImageUrls = signal<string[]>([]);

  productForm!: ProductForm;

  ngOnInit() {
    this.translation.loadModule('vendor')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    const productId = this.route.snapshot.paramMap.get('productId');
    if (productId) {
      this.productId.set(productId);
      this.initForm();
      this.loadCategories();
      this.loadProductData();
    } else {
      this.router.navigate(['/business/dashboard']);
    }
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

  getBrandOptions(): OptionItem[] {
    return getBrandOptions(this.filterGroups());
  }

  getNonBrandFilterGroups(): FilterGroup[] {
    return getNonBrandFilterGroups(this.filterGroups());
  }

  getAllSpecFields(): FilterField[] {
    return getAllSpecFields(this.filterGroups());
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
    const fieldOptions = this.getOptionsForField(fieldId);
    const fieldOptionIds = fieldOptions.map(o => o.option_id);

    for (let i = this.fieldOptionsArray.length - 1; i >= 0; i--) {
      if (fieldOptionIds.includes(this.fieldOptionsArray.at(i).value)) {
        this.fieldOptionsArray.removeAt(i);
      }
    }

    const wasSelected = this.fieldOptionsArray.getRawValue().includes(optionId);
    if (!wasSelected) {
      this.fieldOptionsArray.push(this.fb.control(optionId));
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

  initForm() {
    this.productForm = createProductForm(this.fb);
  }

  get fieldOptionsArray(): FormArray<FormControl<number>> {
    return this.productForm.controls.field_options;
  }

  loadProductData() {
    const profile = this.vendorProfile();
    const productId = this.productId();

    if (!profile || !productId) {
      this.router.navigate(['/business/dashboard']);
      return;
    }

    this.vendorService.getProductById(profile.supplier_id, productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          if (this.isPendingApprovalProduct(product)) {
            this.isLoading.set(false);
            this.snackbar.error(this.translation.translate('vendor.errors.pendingCannotEdit'));
            this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
            return;
          }

          this.currentProduct.set(product);

          this.productForm.patchValue({
            title: product.title ?? '',
            description: product.description ?? '',
            sku: product.sku ?? '',
            category_id: product.category_id ?? '',
            brand_id: product.brand_id ?? '',
            price: product.price ?? '',
            quantity: product.quantity ?? 1,
          });

          // Load existing images as previews
          if (product.cover_image_url) {
            this.existingCoverUrl.set(product.cover_image_url);
            this.coverImagePreview.set(product.cover_image_url);
          }
          if (product.images?.length > 0) {
            this.existingImageUrls.set(product.images);
            this.additionalPreviews.set([...product.images]);
          }
          this.removedImageUrls.set([]);

          // Load field options
          this.fieldOptionsArray.clear();
          const selectedOptions: number[] = Array.isArray(product.field_options)
            ? product.field_options
            : (Array.isArray(product.specifications)
                ? product.specifications
                    .map((spec: any) => Number(spec?.option_id))
                    .filter((id: number) => Number.isInteger(id) && id > 0)
                : []);

          if (selectedOptions.length > 0) {
            selectedOptions.forEach((opt: number) => {
              this.fieldOptionsArray.push(this.fb.control(opt));
            });
          }

          // Load filters for the product's category (without resetting brand_id)
          if (product.category_id) {
            const savedBrandId = product.brand_id;
            this.filtersLoading.set(true);
            this.productForm.patchValue({ category_id: product.category_id });
            this.shopService.getFilterOptions(product.category_id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: response => {
                  this.filterGroups.set(toFilterGroups(response.filters));
                  this.filtersLoading.set(false);
                  // Restore brand_id after filters load
                  if (savedBrandId) {
                    this.productForm.patchValue({ brand_id: savedBrandId });
                  }
                },
                error: () => {
                  this.filterGroups.set([]);
                  this.filtersLoading.set(false);
                }
              });
          }

          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.router.navigate(['/business/dashboard']);
        }
      });
  }

  // Cover image upload
  onCoverImageSelected(event: Event) {
    this.coverImageTouched.set(true);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file)) return;

    this.coverImageFile = file;
    this.existingCoverUrl.set(null);
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
    const cover = this.existingCoverUrl();
    if (cover) {
      this.removedImageUrls.update(urls => (urls.includes(cover) ? urls : [...urls, cover]));
    }
    this.existingCoverUrl.set(null);
    this.coverImagePreview.set(null);
  }

  // Additional images upload
  onAdditionalImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const totalCurrent = this.existingImageUrls().length + this.additionalFiles.length;
    const newFiles = Array.from(input.files).filter(file => isValidImageFile(file));
    const remaining = MAX_ADDITIONAL_IMAGES - totalCurrent;
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
    const existingCount = this.existingImageUrls().length;
    if (index < existingCount) {
      // Removing an existing server image
      const toRemove = this.existingImageUrls()[index];
      if (toRemove) {
        this.removedImageUrls.update(urls => (urls.includes(toRemove) ? urls : [...urls, toRemove]));
      }
      this.existingImageUrls.update(urls => urls.filter((_, i) => i !== index));
    } else {
      // Removing a newly added file
      const fileIndex = index - existingCount;
      this.additionalFiles.splice(fileIndex, 1);
    }
    this.additionalPreviews.update(prev => prev.filter((_, i) => i !== index));
  }

  handleCancel() {
    this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
  }

  isDraft(): boolean {
    const current = this.currentProduct();
    const routeProductId = this.productId();
    return !!current?.isDraft || !!this.extractTaskId(current) || isUuid(routeProductId);
  }

  handleSaveDraft() {
    const profile = this.vendorProfile();
    const productId = this.productId();
    if (!profile || !productId) return;

    const current = this.currentProduct();
    const taskId = this.extractTaskId(current) ?? (isUuid(productId) ? productId : null);
    if (!taskId) {
      this.snackbar.error(this.translation.translate('vendor.errors.onlyDraftCanSave'));
      return;
    }

    const formValue = this.productForm.getRawValue();
    const mappedSpecifications = mapSelectedOptionsToSpecifications(
      formValue.field_options || [],
      this.filterGroups(),
      this.currentProduct()?.specifications,
    );
    const fallbackSpecifications = Array.isArray(this.currentProduct()?.specifications)
      ? this.currentProduct().specifications
      : [];
    const productData: VendorProductUpdate = {
      category_id: toInt(formValue.category_id) || undefined,
      brand_id: toInt(formValue.brand_id),
      title: formValue.title,
      description: formValue.description,
      price: toFloat(formValue.price) || undefined,
      quantity: formValue.quantity,
      sku: (formValue.sku || '').toUpperCase() || undefined,
      specifications: mappedSpecifications.length ? mappedSpecifications : fallbackSpecifications,
    };

    this.isSavingDraft.set(true);

    const remove$ = this.removedImageUrls().length
      ? this.vendorService.deleteTaskImages(profile.supplier_id, taskId, this.removedImageUrls())
      : of(null);

    const filesToUpload: File[] = [];
    if (this.coverImageFile) filesToUpload.push(this.coverImageFile);
    if (this.additionalFiles.length) filesToUpload.push(...this.additionalFiles);

    const upload$ = filesToUpload.length
      ? this.vendorService.uploadTaskImages(profile.supplier_id, taskId, filesToUpload)
      : of(null);

    this.vendorService
      .updateDraft(profile.supplier_id, taskId, productData)
      .pipe(
        switchMap(() => remove$),
        switchMap(() => upload$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isSavingDraft.set(false);
          this.snackbar.success(this.translation.translate('vendor.errors.draftSuccess'));
          this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
        },
        error: () => {
          this.isSavingDraft.set(false);
          this.snackbar.error(this.translation.translate('vendor.errors.saveDraftFailed'));
        },
      });
  }

  handleSubmit() {
    if (this.productForm.invalid || !this.coverImagePreview()) {
      this.coverImageTouched.set(true);
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const profile = this.vendorProfile();
    const productId = this.productId();

    if (!profile || !productId) return;

    const formValue = this.productForm.getRawValue();
    const mappedSpecifications = mapSelectedOptionsToSpecifications(
      formValue.field_options || [],
      this.filterGroups(),
      this.currentProduct()?.specifications,
    );
    const fallbackSpecifications = Array.isArray(this.currentProduct()?.specifications)
      ? this.currentProduct().specifications
      : [];
    const productData: VendorProductUpdate = {
      category_id: toInt(formValue.category_id, 1),
      brand_id: toInt(formValue.brand_id),
      title: formValue.title,
      description: formValue.description,
      price: toFloat(formValue.price, 1),
      quantity: formValue.quantity,
      sku: formValue.sku.toUpperCase(),
      specifications: mappedSpecifications.length ? mappedSpecifications : fallbackSpecifications,
    };

    this.isSubmitting.set(true);

    const current = this.currentProduct();
    const currentTaskId = this.extractTaskId(current) ?? (isUuid(productId) ? productId : null);

    const submitWithTask = (taskId: string) => {
      const remove$ = this.removedImageUrls().length
        ? this.vendorService.deleteTaskImages(profile.supplier_id, taskId, this.removedImageUrls())
        : of(null);

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

      return remove$.pipe(
        switchMap(() => upload$),
        switchMap(() => this.vendorService.submitTaskProduct(profile.supplier_id, taskId))
      );
    };

    const request$ = currentTaskId
      ? this.vendorService
          .updateDraft(profile.supplier_id, currentTaskId, productData)
          .pipe(switchMap(() => submitWithTask(currentTaskId)))
      : this.vendorService
          .updateProduct(profile.supplier_id, productId, productData)
          .pipe(
            switchMap((response: ProductTaskResponse) => {
              const taskId = this.extractTaskId(response);
              if (!taskId) return of(response);
              return this.vendorService
                .updateDraft(profile.supplier_id, taskId, productData)
                .pipe(switchMap(() => submitWithTask(taskId)));
            }),
            catchError((error: any) => {
              const isDraftAlreadyExists = error?.status === 409 && error?.error?.error_code === 'DRAFT_ALREADY_EXISTS';
              if (!isDraftAlreadyExists) {
                return throwError(() => error);
              }

              return this.vendorService.getMyProducts(profile.supplier_id).pipe(
                switchMap((products) => {
                  const existingDraft = products.find((item: any) => {
                    if (!item?.isDraft) return false;
                    return String(item?.product_id ?? '') === String(productId);
                  });

                  const existingTaskId = this.extractTaskId(existingDraft);
                  if (!existingTaskId) {
                    return throwError(() => error);
                  }

                  return this.vendorService
                    .updateDraft(profile.supplier_id, existingTaskId, productData)
                    .pipe(switchMap(() => submitWithTask(existingTaskId)));
                })
              );
            }),
          );

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          if (currentTaskId) {
            this.snackbar.success(this.translation.translate('vendor.errors.publishSuccess'));
          } else {
            this.snackbar.success(this.translation.translate('vendor.errors.updateSuccess'));
          }
          this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
        },
        error: () => {
          this.isSubmitting.set(false);
          this.snackbar.error(this.translation.translate('vendor.errors.updateFailed'));
        },
      });
  }

  confirmDelete() {
    const dialogRef = this.dialog.open(DeleteConfirmationDialog, {
      width: '420px',
      panelClass: 'delete-confirmation-dialog',
      data: {
        title: 'vendor.confirmDeleteTitle',
        message: 'vendor.confirmDelete',
        confirmText: 'vendor.deleteProduct',
        cancelText: 'vendor.cancel',
      },
      disableClose: false,
      hasBackdrop: true,
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.handleDelete();
        }
      });
  }

  handleDelete() {
    const profile = this.vendorProfile();
    const productId = this.productId();
    const current = this.currentProduct();
    const taskId = this.extractTaskId(current) ?? (isUuid(productId) ? productId : null);

    if (!profile || !productId) return;

    this.isDeleting.set(true);

    const delete$ = taskId
      ? this.vendorService.deleteDraft(profile.supplier_id, taskId)
      : this.vendorService.deleteProduct(profile.supplier_id, productId);

    delete$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          if (taskId) {
            this.snackbar.success(this.translation.translate('vendor.errors.draftDeleteSuccess'));
          } else {
            this.snackbar.success(this.translation.translate('vendor.errors.productDeleteSuccess'));
          }
          this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
        },
        error: () => {
          this.isDeleting.set(false);
          this.snackbar.error(this.translation.translate('vendor.errors.deleteFailed'));
        }
      });
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
    const candidate =
      response?.task_id ??
      response?.taskId ??
      (isUuid(response?.id) ? response.id : null) ??
      (isUuid(response?.product_id) ? response.product_id : null) ??
      null;
    return candidate ? String(candidate) : null;
  }

  private isPendingApprovalProduct(product: any): boolean {
    const statuses = [
      product?.status,
      product?.upload_status,
      product?.review_status,
      product?.moderation_status,
      product?.task_status,
      product?.state,
    ]
      .map((value) => String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_'))
      .filter((value) => !!value);

    return statuses.some((status) =>
      status === 'pending' ||
      status === 'pending_approval' ||
      status === 'awaiting_approval' ||
      status === 'in_review' ||
      status === 'under_review' ||
      status === 'review' ||
      status === 'submitted' ||
      status === 'queued'
    );
  }
}
