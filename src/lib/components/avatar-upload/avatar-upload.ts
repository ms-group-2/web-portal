import { Component, input, output, signal, computed, ViewChild, ElementRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from 'lib/services/snackbar.service';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-avatar-upload',
  imports: [MatIconModule],
  templateUrl: './avatar-upload.html',
  styleUrl: './avatar-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  private readonly allowedMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
  ]);
  private readonly allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic']);

  private snackbar = inject(SnackbarService);
  private confirmDialog = inject(ConfirmationDialogService);

  avatarUrl = input<string | null>(null);
  size = input<'sm' | 'md' | 'lg'>('md');
  editable = input<boolean>(true);
  loading = input<boolean>(false);

  fileSelected = output<File>();
  deleteRequested = output<void>();

  previewUrl = signal<string | null>(null);

  displayUrl = computed(() => {
    const preview = this.previewUrl();
    if (preview) return preview;

    const avatar = this.avatarUrl();
    if (avatar) return avatar;

    return null;
  });

  sizeClasses = computed(() => {
    const size = this.size();
    switch (size) {
      case 'sm':
        return { container: 'w-16 h-16', icon: 'w-8 h-8', button: 'w-6 h-6', buttonIcon: 'w-3 h-3' };
      case 'lg':
        return { container: 'w-32 h-32', icon: 'w-16 h-16', button: 'w-10 h-10', buttonIcon: 'w-5 h-5' };
      default: // md
        return { container: 'w-24 h-24', icon: 'w-12 h-12', button: 'w-8 h-8', buttonIcon: 'w-4 h-4' };
    }
  });

  openFileDialog() {
    if (!this.editable() || this.loading()) return;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!this.isAllowedAvatarType(file)) {
      this.snackbar.error('დაშვებულია მხოლოდ JPG, JPEG, PNG, WEBP ან HEIC ფორმატი');
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      this.snackbar.error('ავატარის ზომა აღემატება 5მბ- ს');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    this.fileSelected.emit(file);

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private isAllowedAvatarType(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = file.type.toLowerCase();

    return this.allowedMimeTypes.has(mimeType) || this.allowedExtensions.has(extension);
  }

  clearPreview() {
    this.previewUrl.set(null);
  }

  requestDelete() {
    if (this.loading()) return;

    this.confirmDialog.confirm({
      title: 'ავატარის წაშლა',
      message: 'ნამდვილად გსურთ ავატარის წაშლა?',
      confirmText: 'წაშლა',
      cancelText: 'გაუქმება',
      confirmColor: 'warn',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.previewUrl.set(null);
        this.deleteRequested.emit();
      }
    });
  }
}
