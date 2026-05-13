import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { SnackbarService } from 'lib/services/snackbar.service';
import { ImportService } from 'lib/services/vendor/import.service';
import {
  ImportResponse,
  ConfirmResponse,
  ProductResult,
  ReferenceCategory,
  ReferenceBrand,
} from 'lib/services/vendor/models/import.models';

type ImportStep = 'upload' | 'review' | 'result';

interface ReviewProduct extends ProductResult {
  selected: boolean;
  status: 'ready' | 'incomplete' | 'error';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.docx', '.pdf'];
const ACCEPTED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
];

@Component({
  selector: 'app-import-section',
  imports: [
    DecimalPipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './import-section.html',
  styleUrl: './import-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportSection {
  private importService = inject(ImportService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  onImportComplete = output<void>();

  step = signal<ImportStep>('upload');
  uploading = signal(false);
  confirming = signal(false);
  dragOver = signal(false);

  importResponse = signal<ImportResponse | null>(null);
  confirmResult = signal<ConfirmResponse | null>(null);
  reviewProducts = signal<ReviewProduct[]>([]);
  categories = signal<ReferenceCategory[]>([]);
  brands = signal<ReferenceBrand[]>([]);

  selectedCount = computed(() => this.reviewProducts().filter(p => p.selected).length);
  allSelected = computed(() => {
    const products = this.reviewProducts().filter(p => p.status !== 'error');
    return products.length > 0 && products.every(p => p.selected);
  });

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  toggleSelectAll(): void {
    const newValue = !this.allSelected();
    this.reviewProducts.update(products =>
      products.map(p => p.status === 'error' ? p : { ...p, selected: newValue }),
    );
  }

  toggleProduct(index: number): void {
    this.reviewProducts.update(products =>
      products.map((p, i) => i === index ? { ...p, selected: !p.selected } : p),
    );
  }

  updateProductField(index: number, field: keyof ProductResult, value: unknown): void {
    this.reviewProducts.update(products =>
      products.map((p, i) => {
        if (i !== index) return p;
        const updated = { ...p, [field]: value };
        updated.missing_fields = updated.missing_fields.filter(f => f !== field);
        return updated;
      }),
    );
  }

  confirmImport(): void {
    const response = this.importResponse();
    if (!response) return;

    const selectedProducts = this.reviewProducts()
      .filter(p => p.selected)
      .map(({ selected, status, ...product }) => product as ProductResult);

    if (selectedProducts.length === 0) return;

    this.confirming.set(true);
    this.importService
      .confirmImport(response.import_id, selectedProducts)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.confirmResult.set(result);
          this.confirming.set(false);
          this.step.set('result');
        },
        error: () => {
          this.snackbar.error('Import failed. Please try again.');
          this.confirming.set(false);
        },
      });
  }

  resetImport(): void {
    this.step.set('upload');
    this.importResponse.set(null);
    this.confirmResult.set(null);
    this.reviewProducts.set([]);
  }

  viewProducts(): void {
    this.onImportComplete.emit();
  }

  backToReview(): void {
    this.step.set('review');
  }

  isFieldMissing(product: ReviewProduct, field: string): boolean {
    return product.missing_fields.includes(field);
  }

  private processFile(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      this.snackbar.error('vendor.import.fileTooLarge');
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_MIME_TYPES.includes(file.type)) {
      this.snackbar.error('vendor.import.invalidFormat');
      return;
    }

    this.uploading.set(true);
    this.importService
      .uploadFile(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.importResponse.set(response);
          this.buildReviewList(response);
          this.loadReferenceData();
          this.uploading.set(false);
          this.step.set('review');
        },
        error: () => {
          this.snackbar.error('Upload failed. Please check the file and try again.');
          this.uploading.set(false);
        },
      });
  }

  private buildReviewList(response: ImportResponse): void {
    const ready: ReviewProduct[] = response.products_ready.map(p => ({
      ...p,
      selected: true,
      status: 'ready' as const,
    }));
    const incomplete: ReviewProduct[] = response.products_incomplete.map(p => ({
      ...p,
      selected: false,
      status: 'incomplete' as const,
    }));
    this.reviewProducts.set([...ready, ...incomplete]);
  }

  private loadReferenceData(): void {
    this.importService
      .getReferenceData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.categories.set(data.categories);
          this.brands.set(data.brands);
        },
        error: () => {},
      });
  }
}
