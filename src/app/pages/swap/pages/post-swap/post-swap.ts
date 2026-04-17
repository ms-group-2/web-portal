import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { SwapItemsService } from 'lib/services/swap';
import { SnackbarService } from 'lib/services/snackbar.service';

interface SwapCategory {
  name: string;
  icon: string;
}

const SWAP_CATEGORIES: SwapCategory[] = [
  { name: 'Electronics', icon: 'devices' },
  { name: 'Fashion', icon: 'checkroom' },
  { name: 'Books', icon: 'menu_book' },
  { name: 'Sports', icon: 'sports_soccer' },
  { name: 'Music', icon: 'headphones' },
  { name: 'Art', icon: 'palette' },
  { name: 'Home', icon: 'home' },
  { name: 'Games', icon: 'sports_esports' },
  { name: 'Other', icon: 'more_horiz' },
];

@Component({
  selector: 'app-post-swap',
  imports: [MatIconModule],
  templateUrl: './post-swap.html',
  styleUrl: './post-swap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostSwap {
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private swapItems = inject(SwapItemsService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  readonly categories = SWAP_CATEGORIES;
  readonly totalSteps = 6;
  readonly stepNumbers = [1, 2, 3, 4, 5, 6];

  // Form state
  title = signal('');
  category = signal('');
  description = signal('');
  wantInReturn = signal('');
  location = signal('');
  selectedFiles = signal<File[]>([]);
  previewUrls = signal<string[]>([]);

  // UI state
  step = signal(1);
  isSubmitting = signal(false);

  canProceed = computed(() => {
    switch (this.step()) {
      case 1: return this.title().length > 0;
      case 2: return this.category().length > 0;
      case 3: return true;
      case 4: return this.description().length > 0;
      case 5: return this.wantInReturn().length > 0;
      case 6: return this.location().length > 0;
      default: return false;
    }
  });

  nextStep() {
    if (!this.canProceed()) return;
    if (this.step() === this.totalSteps) {
      this.submit();
    } else {
      this.step.update(s => s + 1);
      this.focusStepInput();
    }
  }

  prevStep() {
    this.step.update(s => Math.max(1, s - 1));
    this.focusStepInput();
  }

  selectCategory(name: string) {
    this.category.set(name);
    setTimeout(() => this.nextStep(), 300);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const maxPhotos = 5;
    const remaining = maxPhotos - this.selectedFiles().length;
    if (remaining <= 0) return;

    const newFiles = Array.from(input.files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, remaining);

    this.selectedFiles.update(files => [...files, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        this.previewUrls.update(urls => [...urls, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removePhoto(index: number) {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    this.previewUrls.update(urls => urls.filter((_, i) => i !== index));
  }

  close() {
    this.router.navigate(['/swap']);
  }

  private submit() {
    this.isSubmitting.set(true);

    const result = this.swapItems.addItem({
      title: this.title(),
      description: this.description(),
      wantedItem: this.wantInReturn(),
      images: this.selectedFiles(),
    });

    if (!result) {
      this.isSubmitting.set(false);
      return;
    }

    result.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackbar.success('Swap item posted successfully!');
        this.router.navigate(['/swap']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.snackbar.error('Failed to post swap item. Please try again.');
      },
    });
  }

  private focusStepInput() {
    setTimeout(() => {
      const input = this.elementRef.nativeElement.querySelector('.step-input');
      input?.focus();
    });
  }
}
