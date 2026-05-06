import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import {
  ApplyBoostRequest,
  BoostPackage,
  MonetizationInfoResponse,
  StickerInfo,
  SwapListingApiService,
} from 'lib/services/swap';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';

interface SwapBoostDialogData {
  listingId: string;
  title?: string;
}

@Component({
  selector: 'app-swap-boost-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule, UpperCasePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-2xl rounded-2xl bg-white p-6">
      <div class="mb-4 flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-gray-900">{{ 'swap.boost.title' | translate }}</h2>
          <p class="text-sm text-gray-600">{{ 'swap.boost.subtitle' | translate }}</p>
        </div>
        <button type="button" (click)="dialogRef.close(false)" class="text-gray-500 hover:text-gray-700">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      @if (isLoading()) {
        <div class="py-10 text-center text-gray-600">{{ 'swap.boost.loadingOptions' | translate }}</div>
      } @else {
        <div class="space-y-5">
          <div>
            <h3 class="mb-2 text-sm font-bold uppercase text-gray-500">{{ 'swap.boost.package' | translate }}</h3>
            <div class="grid gap-2 sm:grid-cols-2">
              @for (pkg of packages(); track $index) {
                <button
                  type="button"
                  (click)="selectPackage(pkg)"
                  class="rounded-xl border p-3 text-left transition"
                  [class.border-swap]="selectedPackageIndex() === $index"
                  [class.bg-purple-50]="selectedPackageIndex() === $index"
                >
                  <p class="font-bold text-gray-900">{{ pkg.tier | uppercase }} - {{ pkg.days }} {{ 'swap.boost.days' | translate }}</p>
                  <p class="text-sm text-gray-600">{{ pkg.price }} GEL</p>
                </button>
              }
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-bold uppercase text-gray-500">{{ 'swap.boost.autoUpdateDays' | translate }}</h3>
            <input
              type="number"
              min="0"
              [ngModel]="autoUpdateDays()"
              (ngModelChange)="setAutoUpdateDays($event)"
              class="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <h3 class="mb-2 text-sm font-bold uppercase text-gray-500">{{ 'swap.boost.stickers' | translate }}</h3>
            <div class="grid gap-2 sm:grid-cols-2">
              @for (sticker of stickers(); track sticker.code) {
                <label class="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3">
                  <div>
                    <p class="font-semibold text-gray-900">{{ sticker.label || sticker.code }}</p>
                    <p class="text-xs text-gray-600">{{ sticker.price }} GEL</p>
                  </div>
                  <input
                    type="checkbox"
                    [checked]="selectedStickers().has(sticker.code)"
                    (change)="toggleSticker(sticker.code)"
                  />
                </label>
              }
            </div>
          </div>

          <div class="rounded-xl bg-gray-50 p-4">
            <p class="text-sm text-gray-600">{{ 'swap.boost.total' | translate }}</p>
            <p class="text-2xl font-black text-gray-900">{{ totalPrice() }} GEL</p>
          </div>
        </div>
      }

      <div class="mt-6 flex justify-end gap-3">
        <button mat-stroked-button type="button" (click)="dialogRef.close(false)" [disabled]="isSubmitting()">
          {{ 'swap.boost.cancel' | translate }}
        </button>
        <button mat-flat-button type="button" (click)="applyBoost()" [disabled]="isSubmitting() || isLoading()">
          {{ isSubmitting() ? ('swap.boost.applying' | translate) : ('swap.boost.apply' | translate) }}
        </button>
      </div>
    </div>
  `,
})
export class SwapBoostDialog {
  dialogRef = inject(MatDialogRef<SwapBoostDialog>);
  data = inject<SwapBoostDialogData>(MAT_DIALOG_DATA);
  private api = inject(SwapListingApiService);
  private snackbar = inject(SnackbarService);
  private translation = inject(TranslationService);

  isLoading = signal(true);
  isSubmitting = signal(false);
  monetization = signal<MonetizationInfoResponse | null>(null);
  selectedPackageIndex = signal<number>(0);
  autoUpdateDays = signal<number>(0);
  selectedStickers = signal<Set<string>>(new Set());

  packages = computed(() => this.monetization()?.boost_packages ?? []);
  stickers = computed(() => this.monetization()?.stickers ?? []);
  selectedPackage = computed<BoostPackage | null>(() => this.packages()[this.selectedPackageIndex()] ?? null);

  totalPrice = computed(() => {
    const selected = this.selectedPackage();
    const stickerCost = this.stickers()
      .filter((s) => this.selectedStickers().has(s.code))
      .reduce((sum, s) => sum + s.price, 0);
    const autoCost = this.autoUpdateDays() * (this.monetization()?.auto_update_daily_price ?? 0);
    return (selected?.price ?? 0) + stickerCost + autoCost;
  });

  constructor() {
    this.api
      .getMonetizationInfo()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.monetization.set(res),
        error: () => this.snackbar.error(this.translation.translate('swap.boost.loadError')),
      });
  }

  selectPackage(pkg: BoostPackage) {
    const index = this.packages().indexOf(pkg);
    if (index >= 0) this.selectedPackageIndex.set(index);
  }

  setAutoUpdateDays(value: number) {
    const normalized = Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
    this.autoUpdateDays.set(normalized);
  }

  toggleSticker(code: string) {
    this.selectedStickers.update((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  applyBoost() {
    const selected = this.selectedPackage();
    const payload: ApplyBoostRequest = {
      boost_tier: selected?.tier,
      boost_days: selected?.days,
      auto_update_days: this.autoUpdateDays(),
      stickers: Array.from(this.selectedStickers()),
    };

    this.isSubmitting.set(true);
    this.api
      .applyBoost(this.data.listingId, payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.success(this.translation.translate('swap.boost.applySuccess'));
          this.dialogRef.close(true);
        },
        error: () => this.snackbar.error(this.translation.translate('swap.boost.applyError')),
      });
  }
}
