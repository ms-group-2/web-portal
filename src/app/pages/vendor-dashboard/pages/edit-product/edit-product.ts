import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { VendorProductUpdate } from 'lib/models/vendor.models';
import { DynamicArrayInput } from '../../components/dynamic-array-input/dynamic-array-input';
import { DeleteConfirmationDialog } from '../../components/delete-confirmation-dialog/delete-confirmation-dialog';

@Component({
  selector: 'app-edit-product',
  imports: [ReactiveFormsModule, TranslatePipe, DynamicArrayInput, DeleteConfirmationDialog],
  templateUrl: './edit-product.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProduct implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  translation = inject(TranslationService);
  private vendorService = inject(VendorService);
  private destroyRef = inject(DestroyRef);

  vendorProfile = this.vendorService.vendorProfile;
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  isDeleting = signal<boolean>(false);
  productId = signal<string | null>(null);
  showDeleteDialog = signal<boolean>(false);
  currentProduct = signal<any>(null);

  productForm!: FormGroup;

  ngOnInit() {
    this.translation.loadModule('vendor').subscribe();

    const productId = this.route.snapshot.paramMap.get('productId');
    if (productId) {
      this.productId.set(productId);
      this.initForm();
      this.loadProductData();
    } else {
      this.router.navigate(['/business/dashboard']);
    }
  }

  initForm() {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category_id: ['', [Validators.required, Validators.min(1)]],
      brand_id: ['', [Validators.required, Validators.min(1)]],
      price: ['', [Validators.required, Validators.min(1)]],
      cover_image_url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      images: this.fb.array([this.fb.control('', [Validators.pattern(/^https?:\/\/.+/)])]),
      field_options: this.fb.array([this.fb.control('', [Validators.min(1)])]),
    });
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
          this.currentProduct.set(product);

          this.productForm.patchValue({
            title: product.title || '',
            description: product.description || '',
            category_id: product.category_id || '',
            brand_id: product.brand_id || '',
            price: product.price || '',
            cover_image_url: product.cover_image_url || '',
          });

          this.imagesArray.clear();
          if (product.images && product.images.length > 0) {
            product.images.forEach((img: string) => {
              this.imagesArray.push(this.fb.control(img, [Validators.pattern(/^https?:\/\/.+/)]));
            });
          } else {
            this.imagesArray.push(this.fb.control('', [Validators.pattern(/^https?:\/\/.+/)]));
          }

          this.fieldOptionsArray.clear();
          if (product.field_options && product.field_options.length > 0) {
            product.field_options.forEach((opt: number) => {
              this.fieldOptionsArray.push(this.fb.control(opt.toString(), [Validators.min(1)]));
            });
          } else {
            this.fieldOptionsArray.push(this.fb.control('', [Validators.min(1)]));
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

  get imagesArray(): FormArray {
    return this.productForm.get('images') as FormArray;
  }

  get fieldOptionsArray(): FormArray {
    return this.productForm.get('field_options') as FormArray;
  }

  addImage() {
    this.imagesArray.push(this.fb.control('', [Validators.pattern(/^https?:\/\/.+/)]));
  }

  removeImage(index: number) {
    if (this.imagesArray.length > 1) {
      this.imagesArray.removeAt(index);
    }
  }

  addFieldOption() {
    this.fieldOptionsArray.push(this.fb.control('', [Validators.min(1)]));
  }

  removeFieldOption(index: number) {
    if (this.fieldOptionsArray.length > 1) {
      this.fieldOptionsArray.removeAt(index);
    }
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
      brand_id: parseInt(formValue.brand_id),
      title: formValue.title,
      description: formValue.description,
      price: parseFloat(formValue.price),
      cover_image_url: formValue.cover_image_url,
      images: formValue.images.filter((img: string) => img.trim() !== ''),
      field_options: formValue.field_options
        .filter((opt: string) => opt.trim() !== '')
        .map((opt: string) => parseInt(opt)),
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
