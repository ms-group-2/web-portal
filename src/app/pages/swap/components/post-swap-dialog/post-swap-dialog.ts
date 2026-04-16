import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { SwapFormData } from '../../swap.models';

@Component({
  selector: 'app-post-swap-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslatePipe
  ],
  templateUrl: './post-swap-dialog.html',
  styleUrl: './post-swap-dialog.scss',
})
export class PostSwapDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PostSwapDialogComponent>);

  swapForm: FormGroup;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  currentImageIndex = 0;

  constructor() {
    this.swapForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      wantedItem: ['', [Validators.minLength(3)]]
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const filesArray = Array.from(input.files);
      this.selectedFiles = filesArray;

      this.previewUrls = [];
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrls.push(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);

    if (this.currentImageIndex >= this.previewUrls.length && this.previewUrls.length > 0) {
      this.currentImageIndex = this.previewUrls.length - 1;
    } else if (this.previewUrls.length === 0) {
      this.currentImageIndex = 0;
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.previewUrls.length - 1;
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.previewUrls.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
  }

  onSubmit() {
    if (this.swapForm.valid && this.selectedFiles.length > 0) {
      const formData: SwapFormData = {
        ...this.swapForm.value,
        images: this.selectedFiles
      };
      this.dialogRef.close(formData);
    } else if (this.selectedFiles.length === 0) {
      this.swapForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
