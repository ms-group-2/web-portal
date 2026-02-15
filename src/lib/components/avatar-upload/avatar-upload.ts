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

  private snackbar = inject(SnackbarService);
  private confirmDialog = inject(ConfirmationDialogService);

  avatarUrl = input<string | null>(null);
  size = input<'sm' | 'md' | 'lg'>('md');
  editable = input<boolean>(true);

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
    if (!this.editable()) return;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.snackbar.error('გთხოვთ აირჩიოთ სურათის ფაილი');
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

  clearPreview() {
    this.previewUrl.set(null);
  }

  requestDelete() {
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
