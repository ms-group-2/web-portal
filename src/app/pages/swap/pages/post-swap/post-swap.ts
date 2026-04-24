import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  ElementRef,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { SwapItemsService } from 'lib/services/swap';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { Footer } from "lib/components/footer/footer";
import { Header } from "lib/components/header/header";
import { NgClass } from '@angular/common';

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
  imports: [MatIconModule, NgClass, Header, TranslatePipe],
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
  private translation = inject(TranslationService);

  private readonly STORAGE_KEY = 'post-swap-draft';

  readonly categories = SWAP_CATEGORIES;
  readonly totalSteps = 6;
  readonly stepNumbers = [1, 2, 3, 4, 5, 6];

  title = signal('');
  category = signal('');
  description = signal('');
  wantInReturn = signal('');
  price = signal<number | null>(null);
  location = signal('');
  selectedFiles = signal<File[]>([]);
  previewUrls = signal<string[]>([]);

  step = signal(1);
  isSubmitting = signal(false);
  showErrors = signal(false);
  userName = signal(localStorage.getItem('vipo_user_firstName') || 'You');

  constructor() {
    this.restoreDraft();

    effect(() => {
      const draft = {
        title: this.title(),
        category: this.category(),
        description: this.description(),
        wantInReturn: this.wantInReturn(),
        price: this.price(),
        location: this.location(),
        previewUrls: this.previewUrls(),
        step: this.step(),
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(draft));
    });
  }

  private restoreDraft() {
    const saved = sessionStorage.getItem(this.STORAGE_KEY);
    if (!saved) return;

    try {
      const draft = JSON.parse(saved);
      if (draft.title) this.title.set(draft.title);
      if (draft.category) this.category.set(draft.category);
      if (draft.description) this.description.set(draft.description);
      if (draft.wantInReturn) this.wantInReturn.set(draft.wantInReturn);
      if (draft.price != null) this.price.set(draft.price);
      if (draft.location) this.location.set(draft.location);
      if (draft.previewUrls?.length) {
        this.previewUrls.set(draft.previewUrls);
        this.restoreFilesFromUrls(draft.previewUrls);
      }
      if (draft.step) this.step.set(draft.step);
    } catch {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private restoreFilesFromUrls(urls: string[]) {
    const files: File[] = [];
    for (const url of urls) {
      const [header, base64] = url.split(',');
      if (!header || !base64) continue;
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      const bytes = atob(base64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      files.push(new File([arr], `restored-${files.length}.${mime.split('/')[1]}`, { type: mime }));
    }
    this.selectedFiles.set(files);
  }

  private clearDraft() {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  canProceed = computed(() => {
    switch (this.step()) {
      case 1: return this.title().trim().length > 0;
      case 2: return this.category().length > 0;
      case 3: return this.selectedFiles().length > 0 || this.previewUrls().length > 0;
      case 4: return this.description().trim().length > 0;
      case 5:
        return this.wantInReturn().trim().length > 0
          && this.price() !== null && this.price()! > 0
          && this.location().trim().length > 0;
      case 6: return true;
      default: return false;
    }
  });

  nextStep() {
    if (!this.canProceed()) {
      this.showErrors.set(true);
      return;
    }
    this.showErrors.set(false);
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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const newFiles = Array.from(input.files)
      .filter(f => allowedTypes.includes(f.type))
      .slice(0, remaining);

    if (newFiles.length === 0 && input.files.length > 0) {
      this.snackbar.error(this.translation.translate('swap.postForm.step3InvalidFormat'));
      input.value = '';
      return;
    }

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

  onPriceKeydown(event: KeyboardEvent) {
    if (['e', 'E', '+', '-', '.', ','].includes(event.key)) {
      event.preventDefault();
      return;
    }
    const input = event.target as HTMLInputElement;
    const isDigit = event.key >= '0' && event.key <= '9';
    if (isDigit && input.value.length >= 6 && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }

  onPriceInput(value: number) {
    if (isNaN(value)) {
      this.price.set(null);
    } else {
      this.price.set(Math.min(Math.max(0, value), 999999));
    }
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
      price: this.price() ?? 0,
      images: this.selectedFiles(),
    });

    if (!result) {
      this.isSubmitting.set(false);
      return;
    }

    result.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.clearDraft();
        this.snackbar.success(this.translation.translate('swap.postForm.submitSuccess'));
        this.router.navigate(['/swap']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.snackbar.error(this.translation.translate('swap.postForm.submitError'));
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
