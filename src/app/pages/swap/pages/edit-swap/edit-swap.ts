import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { SwapListingApiService, SwapItemsService } from 'lib/services/swap';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';

@Component({
  selector: 'app-edit-swap',
  imports: [MatIconModule, Header, Footer, TranslatePipe],
  templateUrl: './edit-swap.html',
  styleUrl: './edit-swap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSwap implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(SwapListingApiService);
  private swapItems = inject(SwapItemsService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);

  private listingId = '';

  title = signal('');
  description = signal('');
  wantInReturn = signal('');
  existingPhotos = signal<string[]>([]);
  photosToRemove = signal<string[]>([]);
  newFiles = signal<File[]>([]);
  newPreviewUrls = signal<string[]>([]);

  isLoading = signal(true);
  isSaving = signal(false);
  isLocked = signal(false);

  displayPhotos = computed(() => {
    const existing = this.existingPhotos().filter(
      (url) => !this.photosToRemove().includes(url)
    );
    return [
      ...existing.map((url) => ({ type: 'existing' as const, url })),
      ...this.newPreviewUrls().map((url) => ({ type: 'new' as const, url })),
    ];
  });

  totalPhotoCount = computed(
    () => this.displayPhotos().length
  );

  canSave = computed(
    () =>
      this.title().trim().length > 0 &&
      this.description().trim().length > 0 &&
      this.wantInReturn().trim().length > 0 &&
      !this.isLocked()
  );

  ngOnInit() {
    this.listingId = this.route.snapshot.paramMap.get('listingId') ?? '';
    if (!this.listingId) {
      this.router.navigate(['/swap']);
      return;
    }
    this.loadListing();
  }

  private loadListing() {
    this.isLoading.set(true);
    this.api
      .getListing(this.listingId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (listing) => {
          this.title.set(listing.title);
          this.description.set(listing.description);
          this.wantInReturn.set(listing.swap_item_title);
          this.existingPhotos.set(listing.photos ?? []);
          this.isLocked.set(listing.status === 'locked');
          this.isLoading.set(false);
        },
        error: () => {
          this.snackbar.error(this.translation.translate('swap.editForm.loadError'));
          this.router.navigate(['/swap']);
        },
      });
  }

  removeExistingPhoto(url: string) {
    this.photosToRemove.update((list) => [...list, url]);
  }

  removeNewPhoto(index: number) {
    this.newFiles.update((files) => files.filter((_, i) => i !== index));
    this.newPreviewUrls.update((urls) => urls.filter((_, i) => i !== index));
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const maxPhotos = 5;
    const remaining = maxPhotos - this.totalPhotoCount();
    if (remaining <= 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const files = Array.from(input.files)
      .filter((f) => allowedTypes.includes(f.type))
      .slice(0, remaining);

    if (files.length === 0 && input.files.length > 0) {
      this.snackbar.error(this.translation.translate('swap.postForm.step3InvalidFormat'));
      input.value = '';
      return;
    }

    this.newFiles.update((existing) => [...existing, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.newPreviewUrls.update((urls) => [...urls, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  save() {
    if (!this.canSave() || this.isSaving()) return;
    this.isSaving.set(true);

    const textUpdate$ = this.swapItems.updateItem(this.listingId, {
      title: this.title(),
      description: this.description(),
      wantedItem: this.wantInReturn(),
    });

    const deletions$ =
      this.photosToRemove().length > 0
        ? forkJoin(
            this.photosToRemove().map((url) =>
              this.api.deletePhoto(this.listingId, url)
            )
          )
        : of(null);

    const uploads$ =
      this.newFiles().length > 0
        ? forkJoin(
            this.newFiles().map((file) =>
              this.api.uploadPhoto(this.listingId, file)
            )
          )
        : of(null);

    forkJoin([textUpdate$, deletions$, uploads$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.swapItems.loadUserListings();
          this.snackbar.success(this.translation.translate('swap.editForm.saveSuccess'));
          this.router.navigate(['/swap']);
        },
        error: () => {
          this.isSaving.set(false);
          this.snackbar.error(this.translation.translate('swap.editForm.saveError'));
        },
      });
  }

  goBack() {
    this.router.navigate(['/swap']);
  }
}
