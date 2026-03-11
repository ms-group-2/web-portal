import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { VendorProductCreate } from 'lib/models/vendor.models';
import { DynamicArrayInput } from '../../components/dynamic-array-input/dynamic-array-input';

@Component({
  selector: 'app-add-product',
  imports: [ReactiveFormsModule, TranslatePipe, DynamicArrayInput],
  templateUrl: './add-product.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProduct implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  translation = inject(TranslationService);
  private vendorService = inject(VendorService);
  private destroyRef = inject(DestroyRef);

  vendorProfile = this.vendorService.vendorProfile;
  isSubmitting = signal<boolean>(false);

  productForm!: FormGroup;

  ngOnInit() {
    this.translation.loadModule('vendor').subscribe();
    this.initForm();
  }

  initForm() {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      sku: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      category_id: ['', [Validators.required, Validators.min(1)]],
      brand_id: ['', [Validators.required, Validators.min(1)]],
      price: ['', [Validators.required, Validators.min(1)]],
      cover_image_url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      images: this.fb.array([this.fb.control('', [Validators.pattern(/^https?:\/\/.+/)])]),
      field_options: this.fb.array([this.fb.control('', [Validators.min(1)])]),
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
    if (!profile) {
      console.error('Vendor profile not found');
      return;
    }

    const formValue = this.productForm.value;
    const productData: VendorProductCreate = {
      category_id: parseInt(formValue.category_id),
      brand_id: parseInt(formValue.brand_id),
      title: formValue.title,
      description: formValue.description,
      price: parseFloat(formValue.price),
      sku: formValue.sku.toUpperCase(),
      cover_image_url: formValue.cover_image_url,
      images: formValue.images.filter((img: string) => img.trim() !== ''),
      field_options: formValue.field_options
        .filter((opt: string) => opt.trim() !== '')
        .map((opt: string) => parseInt(opt)),
    };

    this.isSubmitting.set(true);

    this.vendorService
      .createProduct(profile.supplier_id, productData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/business/dashboard'], { queryParams: { tab: 'products' } });
        },
        error: (error) => {
          console.error('Failed to create product:', error);
          this.isSubmitting.set(false);
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
}
