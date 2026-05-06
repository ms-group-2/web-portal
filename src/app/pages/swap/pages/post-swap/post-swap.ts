import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import {
  BoostPackage,
  MonetizationInfoResponse,
  StickerInfo,
  SwapItemsService,
  SwapListingApiService,
} from 'lib/services/swap';
import { AuthService } from 'lib/services/identity/auth.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { Footer } from "lib/components/footer/footer";
import { Header } from "lib/components/header/header";
import { NgClass } from '@angular/common';
import { PostSwapDraftPhotosService } from 'lib/services/swap/post-swap-draft-photos.service';
import { ShopService } from 'lib/services/shop/shop.service';
import { Category } from 'src/app/pages/shop/shop.models';

@Component({
  selector: 'app-post-swap',
  imports: [MatIconModule, NgClass, Header, TranslatePipe],
  templateUrl: './post-swap.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostSwap {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private elementRef = inject(ElementRef);
  private swapItems = inject(SwapItemsService);
  private api = inject(SwapListingApiService);
  private auth = inject(AuthService);
  private profileApi = inject(ProfileApiService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);
  private draftPhotos = inject(PostSwapDraftPhotosService);
  private shopService = inject(ShopService);

  private readonly STORAGE_KEY = 'post-swap-draft';

  readonly categories = signal<Category[]>([]);
  readonly totalSteps = 8;
  readonly stepNumbers = [1, 2, 3, 4, 5, 6, 7, 8];

  title = signal('');
  category = signal('');
  categoryId = signal<number | null>(null);
  description = signal('');
  wantInReturn = signal('');
  desiredCategoryId = signal<number | null>(null);
  price = signal<number | null>(null);
  location = signal('');
  locationPrefilled = signal(false);
  selectedFiles = signal<File[]>([]);
  previewUrls = signal<string[]>([]);
  monetization = signal<MonetizationInfoResponse | null>(null);
  selectedBoostIndex = signal<number>(-1);
  selectedStickers = signal<Set<string>>(new Set());
  autoUpdateDays = signal<number>(0);

  step = signal(1);
  isSubmitting = signal(false);
  showErrors = signal(false);
  limitReached = signal(false);
  userName = signal(localStorage.getItem('vipo_user_firstName') || 'You');

  constructor() {
    this.restoreDraft();
    void this.restoreDraftPhotos();
    this.prefillLocation();
    // TEMP: disable monthly listing quota guard in UI
    // this.checkQuota();
    this.loadMonetization();
    this.loadCategories();

    effect(() => {
      const draft = {
        title: this.title(),
        category: this.category(),
        categoryId: this.categoryId(),
        description: this.description(),
        wantInReturn: this.wantInReturn(),
        desiredCategoryId: this.desiredCategoryId(),
        price: this.price(),
        location: this.location(),
        selectedBoostIndex: this.selectedBoostIndex(),
        selectedStickers: Array.from(this.selectedStickers()),
        autoUpdateDays: this.autoUpdateDays(),
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
      if (typeof draft.categoryId === 'number') this.categoryId.set(draft.categoryId);
      if (draft.description) this.description.set(draft.description);
      if (draft.wantInReturn) this.wantInReturn.set(draft.wantInReturn);
      if (typeof draft.desiredCategoryId === 'number') this.desiredCategoryId.set(draft.desiredCategoryId);
      if (draft.price != null) this.price.set(draft.price);
      if (draft.location) this.location.set(draft.location);
      if (typeof draft.selectedBoostIndex === 'number') this.selectedBoostIndex.set(draft.selectedBoostIndex);
      if (Array.isArray(draft.selectedStickers)) this.selectedStickers.set(new Set(draft.selectedStickers));
      if (typeof draft.autoUpdateDays === 'number') this.autoUpdateDays.set(draft.autoUpdateDays);
      if (draft.step) this.step.set(draft.step);
    } catch {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private checkQuota() {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    this.api.checkCanCreateListing(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ canCreate }) => {
        if (!canCreate) {
          this.limitReached.set(true);
          this.snackbar.error(this.translation.translate('swap.postForm.monthlyLimitReached'));
        }
      });
  }

  private prefillLocation() {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    this.profileApi.getProfile(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          if (profile.location) {
            this.location.set(profile.location);
            this.locationPrefilled.set(true);
          }
        },
      });
  }

  private clearDraft() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    void this.draftPhotos.clear();
  }

  private loadMonetization() {
    this.api.getMonetizationInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.monetization.set(res),
      });
  }

  private loadCategories() {
    this.shopService
      .getMainCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
      });
  }

  boostPackages = computed<BoostPackage[]>(() => this.monetization()?.boost_packages ?? []);
  stickers = computed<StickerInfo[]>(() => this.monetization()?.stickers ?? []);
  selectedBoostPackage = computed<BoostPackage | null>(() => {
    const index = this.selectedBoostIndex();
    if (index < 0) return null;
    return this.boostPackages()[index] ?? null;
  });
  boostEstimatedTotal = computed(() => {
    const boostCost = this.getBoostPackagePrice(this.selectedBoostPackage());
    const stickerCost = this.stickers()
      .filter((sticker) => this.selectedStickers().has(sticker.code))
      .reduce((sum, sticker) => sum + sticker.price, 0);
    const autoCost = this.autoUpdateDays() * (this.monetization()?.auto_update_daily_price ?? 0);
    return boostCost + stickerCost + autoCost;
  });
  selectedDesiredCategoryName = computed(() => {
    const selectedId = this.desiredCategoryId();
    if (selectedId == null) return '';
    return this.categories().find((c) => Number(c.id) === selectedId)?.name ?? '';
  });

  canProceed = computed(() => {
    switch (this.step()) {
      case 1: return this.title().trim().length > 0;
      case 2: return this.category().length > 0;
      case 3: return this.selectedFiles().length > 0;
      case 4: return this.description().trim().length > 0;
      case 5:
        return this.price() !== null && this.price()! > 0
          && this.location().trim().length > 0;
      case 6: return this.wantInReturn().trim().length > 0 || this.desiredCategoryId() !== null;
      case 7: return true;
      case 8: return true;
      default: return false;
    }
  });

  nextStep() {
    if (this.limitReached()) return;
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

  onEnterNextStep() {
    if (this.canProceed()) {
      this.nextStep();
    }
  }

  prevStep() {
    this.step.update(s => Math.max(1, s - 1));
    this.focusStepInput();
  }

  selectCategory(category: Category) {
    this.category.set(category.name);
    this.categoryId.set(Number(category.id));
    setTimeout(() => this.nextStep(), 300);
  }

  selectDesiredCategory(categoryId: number) {
    this.desiredCategoryId.update((current) => (current === categoryId ? null : categoryId));
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const maxPhotos = 5;
    const maxFileSizeBytes = 5 * 1024 * 1024;
    const remaining = maxPhotos - this.selectedFiles().length;
    if (remaining <= 0) {
      this.snackbar.error(this.translation.translate('swap.postForm.step3MaxPhotos'));
      input.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const typeValidFiles = Array.from(input.files).filter(f => allowedTypes.includes(f.type));
    const validFiles = typeValidFiles.filter((f) => f.size <= maxFileSizeBytes);

    if (typeValidFiles.length !== input.files.length) {
      this.snackbar.error(this.translation.translate('swap.postForm.step3InvalidFormat'));
    }

    if (validFiles.length !== typeValidFiles.length) {
      this.snackbar.error(this.translation.translate('swap.postForm.step3MaxSize'));
    }

    if (validFiles.length === 0 && input.files.length > 0) {
      input.value = '';
      return;
    }

    const newFiles = validFiles.slice(0, remaining);

    if (validFiles.length > remaining) {
      this.snackbar.error(
        this.translation.translate('swap.postForm.step3MaxPhotos')
      );
    }

    this.selectedFiles.update(files => [...files, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        this.previewUrls.update(urls => [...urls, e.target?.result as string]);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
    void this.draftPhotos.persist(this.selectedFiles());
  }

  removePhoto(index: number) {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    this.previewUrls.update(urls => urls.filter((_, i) => i !== index));
    void this.draftPhotos.persist(this.selectedFiles());
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

  selectBoost(index: number) {
    if (this.selectedBoostIndex() === index) {
      this.selectedBoostIndex.set(-1);
      return;
    }
    this.selectedBoostIndex.set(index);
  }

  getBoostPackageDays(pkg: BoostPackage | null | undefined): number | null {
    if (!pkg) return null;
    const candidate = (pkg as unknown as { days?: number; boost_days?: number; duration_days?: number });
    const rawDays = candidate.days ?? candidate.boost_days ?? candidate.duration_days;
    if (rawDays == null || Number.isNaN(Number(rawDays))) return null;
    return Number(rawDays);
  }

  getBoostPackagePrice(pkg: BoostPackage | null | undefined): number {
    if (!pkg) return 0;
    const candidate = (pkg as unknown as { price?: number; amount?: number });
    const rawPrice = candidate.price ?? candidate.amount;
    if (rawPrice == null || Number.isNaN(Number(rawPrice))) return 0;
    return Number(rawPrice);
  }

  getBoostTierIcon(tier: string | null | undefined): string {
    const value = (tier ?? '').toLowerCase();
    if (value.includes('super')) return 'workspace_premium';
    if (value.includes('plus')) return 'stars';
    if (value.includes('vip')) return 'local_fire_department';
    return 'local_offer';
  }

  getStickerCode(sticker: StickerInfo, index: number): string {
    const candidate = sticker as unknown as {
      code?: string;
      sticker_code?: string;
      id?: string | number;
      label?: string;
      name?: string;
    };
    const raw =
      candidate.code ??
      candidate.sticker_code ??
      candidate.id ??
      candidate.name ??
      candidate.label ??
      `sticker_${index}`;
    return String(raw);
  }

  getStickerLabel(sticker: StickerInfo, index: number): string {
    const candidate = sticker as unknown as { label?: string; name?: string };
    return candidate.label || candidate.name || this.getStickerCode(sticker, index);
  }

  getStickerPrice(sticker: StickerInfo): number {
    const candidate = sticker as unknown as { price?: number; amount?: number };
    const raw = candidate.price ?? candidate.amount;
    return raw == null || Number.isNaN(Number(raw)) ? 0 : Number(raw);
  }

  getStickerIcon(code: string): string {
    const value = code.toLowerCase();
    if (value.includes('gold') || value.includes('premium')) return 'workspace_premium';
    if (value.includes('hot') || value.includes('fire')) return 'local_fire_department';
    if (value.includes('new')) return 'new_releases';
    return 'style';
  }

  toggleSticker(code: string) {
    this.selectedStickers.update((current) => {
      const next = new Set(current);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  setAutoUpdateDays(value: number) {
    if (!Number.isFinite(value)) {
      this.autoUpdateDays.set(0);
      return;
    }
    this.autoUpdateDays.set(Math.max(0, Math.floor(value)));
  }

  close() {
    this.router.navigate(['/swap']);
  }

  private submit() {
    this.isSubmitting.set(true);
    const selectedCategoryId = this.categoryId();
    const selectedDesiredCategoryId = this.desiredCategoryId();
    const wantedItemText = this.wantInReturn().trim() || this.selectedDesiredCategoryName();

    const result = this.swapItems.addItem({
      title: this.title(),
      description: this.description(),
      wantedItem: wantedItemText,
      price: this.price() ?? 0,
      location: this.location(),
      categoryId: selectedCategoryId ?? undefined,
      desiredCategoryIds: selectedDesiredCategoryId != null ? [selectedDesiredCategoryId] : undefined,
      images: this.selectedFiles(),
      boost: this.selectedBoostPackage()
        ? {
            boost_tier: this.selectedBoostPackage()?.tier,
            boost_days: this.getBoostPackageDays(this.selectedBoostPackage()) ?? undefined,
            auto_update_days: this.autoUpdateDays(),
            stickers: Array.from(this.selectedStickers()),
          }
        : this.autoUpdateDays() > 0 || this.selectedStickers().size > 0
          ? {
              auto_update_days: this.autoUpdateDays(),
              stickers: Array.from(this.selectedStickers()),
            }
          : undefined,
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
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.snackbar.error(this.formatSubmitError(err));
      },
    });
  }

  private formatSubmitError(err: unknown): string {
    const fallback = this.translation.translate('swap.postForm.submitError');
    if (!err || typeof err !== 'object') return fallback;

    const e = err as {
      status?: number;
      error?: { message?: string; error_code?: string; detail?: unknown };
      message?: string;
    };

    const detail = e.error?.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string; loc?: unknown[] };
      if (first?.msg) {
        const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : '';
        return field ? `${field}: ${first.msg}` : first.msg;
      }
    }

    return e.error?.message || e.message || fallback;
  }

  private focusStepInput() {
    setTimeout(() => {
      const input = this.elementRef.nativeElement.querySelector('.step-input');
      input?.focus();
    });
  }

  private async restoreDraftPhotos(): Promise<void> {
    const { files, previews } = await this.draftPhotos.restore();
    if (!files.length) {
      return;
    }
    
      this.selectedFiles.set(files);
      this.previewUrls.set(previews);
      this.cdr.markForCheck();
  }
}
