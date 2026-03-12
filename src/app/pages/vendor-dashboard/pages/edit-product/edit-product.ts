import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { ShopService } from 'lib/services/shop/shop.service';
import { Category, FilterGroup } from 'src/app/pages/shop/shop.models';
import { VendorProductUpdate } from 'lib/models/vendor.models';
import { DeleteConfirmationDialog } from '../../components/delete-confirmation-dialog/delete-confirmation-dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-edit-product',
  imports: [ReactiveFormsModule, TranslatePipe, DeleteConfirmationDialog, MatFormFieldModule, MatSelectModule, MatIconModule, MatInputModule],
  templateUrl: './edit-product.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProduct implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  translation = inject(TranslationService);
  private vendorService = inject(VendorService);
  private shopService = inject(ShopService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  vendorProfile = this.vendorService.vendorProfile;
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  isDeleting = signal<boolean>(false);
  productId = signal<string | null>(null);
  showDeleteDialog = signal<boolean>(false);
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
  additionalFiles: File[] = [];
  additionalPreviews = signal<string[]>([]);
  // Track existing images from server (URLs)
  existingCoverUrl = signal<string | null>(null);
  existingImageUrls = signal<string[]>([]);

  productForm!: FormGroup;

  ngOnInit() {
    this.translation.loadModule('vendor').subscribe();

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
    this.productForm.patchValue({ category_id: id, brand_id: '' });
    this.filtersLoading.set(true);
    this.shopService.getFilterOptions(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: filters => { this.filterGroups.set(filters); this.filtersLoading.set(false); },
        error: () => { this.filterGroups.set([]); this.filtersLoading.set(false); }
      });
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
    const fieldOptions = this.getOptionsForField(fieldId);
    const fieldOptionIds = fieldOptions.map(o => o.option_id);

    for (let i = this.fieldOptionsArray.length - 1; i >= 0; i--) {
      if (fieldOptionIds.includes(this.fieldOptionsArray.at(i).value)) {
        this.fieldOptionsArray.removeAt(i);
      }
    }

    const wasSelected = (this.fieldOptionsArray.value as number[]).includes(optionId);
    if (!wasSelected) {
      this.fieldOptionsArray.push(this.fb.control(optionId));
      this.selectedSpecFieldId.set(null);
    }
    this.cdr.markForCheck();
  }

  isFieldOptionSelected(optionId: number): boolean {
    return (this.fieldOptionsArray.value as number[]).includes(optionId);
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

  initForm() {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category_id: ['', [Validators.required, Validators.min(1)]],
      brand_id: [''],
      price: ['', [Validators.required, Validators.min(1)]],
      field_options: this.fb.array([]),
    });
  }

  get fieldOptionsArray(): FormArray {
    return this.productForm.get('field_options') as FormArray;
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
          console.log('Loaded product for editing:', product);
          this.currentProduct.set(product);

          this.productForm.patchValue({
            title: product.title ?? '',
            description: product.description ?? '',
            category_id: product.category_id ?? '',
            brand_id: product.brand_id ?? '',
            price: product.price ?? '',
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

          // Load field options
          this.fieldOptionsArray.clear();
          if (product.field_options?.length > 0) {
            product.field_options.forEach((opt: number) => {
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
                next: filters => {
                  this.filterGroups.set(filters);
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
        error: (error) => {
          console.error('Failed to load product:', error);
          this.isLoading.set(false);
          this.router.navigate(['/business/dashboard']);
        }
      });
  }

  // Cover image upload
  onCoverImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;

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
    this.coverImageFile = null;
    this.existingCoverUrl.set(null);
    this.coverImagePreview.set(null);
  }

  // Additional images upload
  onAdditionalImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const totalCurrent = this.existingImageUrls().length + this.additionalFiles.length;
    const newFiles = Array.from(input.files).filter(
      f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024
    );
    const remaining = 5 - totalCurrent;
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

  handleSubmit() {
    if (this.productForm.invalid) {
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const profile = this.vendorProfile();
    const productId = this.productId();

    if (!profile || !productId) {
      console.error('Vendor profile or product ID not found');
      return;
    }

    const formValue = this.productForm.value;
    const productData: VendorProductUpdate = {
      category_id: parseInt(formValue.category_id),
      brand_id: parseInt(formValue.brand_id) || 0,
      title: formValue.title,
      description: formValue.description,
      price: parseFloat(formValue.price),
      cover_image_url: this.existingCoverUrl() || undefined,
      images: this.existingImageUrls().length > 0 ? this.existingImageUrls() : undefined,
      field_options: (formValue.field_options || [])
        .filter((opt: any) => opt !== '' && opt !== null && opt !== undefined)
        .map((opt: any) => typeof opt === 'number' ? opt : parseInt(opt)),
    };

    this.isSubmitting.set(true);

    this.vendorService
      .updateProduct(profile.supplier_id, productId, productData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
        },
        error: (error) => {
          console.error('Failed to update product:', error);
          this.isSubmitting.set(false);
        },
      });
  }

  confirmDelete() {
    this.showDeleteDialog.set(true);
  }

  cancelDelete() {
    this.showDeleteDialog.set(false);
  }

  handleDelete() {
    const profile = this.vendorProfile();
    const productId = this.productId();

    if (!profile || !productId) return;

    this.isDeleting.set(true);

    this.vendorService.deleteProduct(profile.supplier_id, productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
        },
        error: (error) => {
          console.error('Failed to delete product:', error);
          this.isDeleting.set(false);
          this.showDeleteDialog.set(false);
        }
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
}
