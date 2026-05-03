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
import { NgClass } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import {
  SwapListingApiService,
  SwapListing,
  SwapItemsService,
  PostedSwapItem,
  ProposalItemDraft,
  ProposalSessionResponse,
} from 'lib/services/swap';
import { ProposalSseService, SseItemEvent } from 'lib/services/swap/proposal-sse.service';
import { SnackbarService } from 'lib/services/snackbar.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { Header } from 'lib/components/header/header';
import { normalizeSwapPhotos } from 'lib/utils/swap-photos';
import { environment } from '../../../../../environments/environment';

type ItemSource = 'listings' | 'computer' | 'qr';

@Component({
  selector: 'app-propose-swap',
  imports: [NgClass, MatIconModule, Header, TranslatePipe],
  templateUrl: './propose-swap.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposeSwap {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private elementRef = inject(ElementRef);
  private api = inject(SwapListingApiService);
  private sse = inject(ProposalSseService);
  private swapItems = inject(SwapItemsService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);

  readonly totalSteps = 5;
  readonly stepNumbers = [1, 2, 3, 4, 5];

  listingId = signal('');
  targetListing = signal<SwapListing | null>(null);
  targetPhotos = computed(() => normalizeSwapPhotos(this.targetListing()?.photos));
  isLoadingListing = signal(true);

  session = signal<ProposalSessionResponse | null>(null);
  isLoadingSession = signal(false);
  private sessionCreated = false;

  activeSource = signal<ItemSource>('listings');
  itemDrafts = signal<ProposalItemDraft[]>([]);
  message = signal('');
  isUploading = signal(false);

  step = signal(1);
  isSubmitting = signal(false);
  showErrors = signal(false);

  sseItems = this.sse.items;
  sseConnected = this.sse.connected;
  sseError = this.sse.error;

  userListings = this.swapItems.postedItems;

  selectedListingIds = computed(() =>
    new Set(this.itemDrafts().filter(d => d.fromListing).map(d => d.listingId!)),
  );

  offerMode = computed<'listings' | 'upload' | null>(() => {
    const drafts = this.itemDrafts();
    if (drafts.length === 0) return null;
    return drafts.every(d => d.fromListing) ? 'listings' : 'upload';
  });

  canProceed = computed(() => {
    switch (this.step()) {
      case 1: return this.targetListing() !== null;
      case 2: return this.itemDrafts().length > 0;
      case 3:
        return this.itemDrafts().length > 0
          && this.itemDrafts().every(d => d.title.trim().length > 0);
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('listingId');
        if (id) {
          this.listingId.set(id);
          this.loadTargetListing(id);
        }
      });

    effect(() => {
      const sseItems: SseItemEvent[] = this.sse.items();
      const existing = this.itemDrafts();
      const existingPaths = new Set(existing.map(d => d.temp_path));
      const newDrafts = sseItems
        .filter(item => !existingPaths.has(item.temp_path))
        .map(item => ({ temp_path: item.temp_path, title: '' }));
      if (newDrafts.length > 0) {
        this.itemDrafts.update(drafts => [...drafts, ...newDrafts]);
      }
    });

    this.destroyRef.onDestroy(() => this.sse.reset());
  }

  private loadTargetListing(id: string) {
    this.isLoadingListing.set(true);
    this.api.getListing(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: listing => {
          this.targetListing.set(listing);
          this.isLoadingListing.set(false);
        },
        error: () => {
          this.isLoadingListing.set(false);
          this.snackbar.error(this.translation.translate('swap.proposeForm.sessionError'));
        },
      });
  }

  private ensureSession() {
    if (this.sessionCreated) return;
    this.sessionCreated = true;
    this.isLoadingSession.set(true);
    this.api.createProposalSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: session => {
          this.session.set(session);
          this.isLoadingSession.set(false);
          this.sse.connect(session.session_id);
        },
        error: () => {
          this.sessionCreated = false;
          this.isLoadingSession.set(false);
          this.snackbar.error(this.translation.translate('swap.proposeForm.sessionError'));
        },
      });
  }

  setSource(source: ItemSource) {
    const mode = this.offerMode();
    if (mode === 'listings' && source !== 'listings') {
      this.snackbar.error(this.translation.translate('swap.proposeForm.mixingNotAllowed'));
      return;
    }
    if (mode === 'upload' && source === 'listings') {
      this.snackbar.error(this.translation.translate('swap.proposeForm.mixingNotAllowed'));
      return;
    }

    this.activeSource.set(source);
    if (source === 'qr' || source === 'computer') {
      this.ensureSession();
    }
  }

  selectListing(listing: PostedSwapItem) {
    if (this.offerMode() === 'upload') {
      this.snackbar.error(this.translation.translate('swap.proposeForm.mixingNotAllowed'));
      return;
    }

    if (this.selectedListingIds().has(listing.id)) {
      this.itemDrafts.update(drafts => drafts.filter(d => d.listingId !== listing.id));
      return;
    }

    const photos = normalizeSwapPhotos(listing.photos);
    this.itemDrafts.update(drafts => [
      ...drafts,
      {
        temp_path: listing.id,
        title: listing.title,
        previewUrl: photos[0],
        fromListing: true,
        listingId: listing.id,
      },
    ]);
  }

  onComputerFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const session = this.session();
    if (!session) {
      this.snackbar.error(this.translation.translate('swap.proposeForm.sessionError'));
      input.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const files = Array.from(input.files).filter(f => allowedTypes.includes(f.type));
    if (files.length === 0) {
      this.snackbar.error(this.translation.translate('swap.postForm.step3InvalidFormat'));
      input.value = '';
      return;
    }

    this.isUploading.set(true);
    let remaining = files.length;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        this.uploadFile(file, dataUrl, session.session_id, () => {
          remaining--;
          if (remaining === 0) this.isUploading.set(false);
        });
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  private uploadFile(file: File, previewUrl: string, sessionId: string, onDone: () => void) {
    this.api.getProposalUploadUrl({ session_id: sessionId, filename: file.name })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ upload_url, object_path }) => {
          const resolvedUploadUrl = this.resolveProposalUploadUrl(upload_url);
          fetch(resolvedUploadUrl, {
            method: 'PUT',
            body: file,
            mode: 'cors',
            credentials: 'omit',
          })
            .then(async res => {
              if (!res.ok) {
                const body = await res.text().catch(() => '');
                throw new Error(`PUT upload failed (${res.status} ${res.statusText})${body ? `: ${body.slice(0, 300)}` : ''}`);
              }
              this.api.addItemToSession(sessionId, { temp_path: object_path })
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                  next: () => {
                    this.itemDrafts.update(drafts => [
                      ...drafts,
                      { temp_path: object_path, title: '', previewUrl },
                    ]);
                    onDone();
                  },
                  error: (err) => {
                    // eslint-disable-next-line no-console
                    console.error('[proposal] add-item failed', err);
                    this.snackbar.error(this.formatError(err, 'swap.proposeForm.step2UploadError'));
                    onDone();
                  },
                });
            })
            .catch((err) => {
              // eslint-disable-next-line no-console
              console.error('[proposal] PUT upload failed', {
                upload_url,
                resolvedUploadUrl,
                err,
              });
              this.snackbar.error(this.formatError(err, 'swap.proposeForm.step2UploadError'));
              onDone();
            });
        },
        error: (err) => {
          // eslint-disable-next-line no-console
          console.error('[proposal] upload-url failed', err);
          this.snackbar.error(this.formatError(err, 'swap.proposeForm.step2UploadError'));
          onDone();
        },
      });
  }

  private resolveProposalUploadUrl(uploadUrl: string): string {
    if (!uploadUrl) {
      return uploadUrl;
    }

    // Backend can return a relative signed path (starting with /proposals/...).
    // It must be sent to the public storage gateway host.
    if (uploadUrl.startsWith('/')) {
      const apiOrigin = new URL(environment.apiBaseUrl).origin;
      const normalizedPath = uploadUrl.startsWith('/storage/')
        ? uploadUrl
        : `/storage${uploadUrl}`;
      return `${apiOrigin}${normalizedPath}`;
    }

    return uploadUrl;
  }

  nextStep() {
    if (this.step() === this.totalSteps) return;
    if (this.step() === 4) {
      this.submit();
      return;
    }
    if (!this.canProceed()) {
      this.showErrors.set(true);
      return;
    }
    this.showErrors.set(false);
    this.step.update(s => s + 1);
    this.focusStepInput();
  }

  prevStep() {
    if (this.step() <= 1) return;
    this.step.update(s => s - 1);
    this.focusStepInput();
  }

  updateItemTitle(index: number, title: string) {
    this.itemDrafts.update(drafts =>
      drafts.map((d, i) => i === index ? { ...d, title } : d),
    );
  }

  removeItem(index: number) {
    const draft = this.itemDrafts()[index];
    if (draft && !draft.fromListing) {
      this.sse.removeItem(draft.temp_path);
    }
    this.itemDrafts.update(drafts => drafts.filter((_, i) => i !== index));
  }

  close() {
    this.sse.reset();
    this.router.navigate(['/swap', this.listingId()]);
  }

  goToSwaps() {
    this.router.navigate(['/swap']);
  }

  private submit() {
    this.isSubmitting.set(true);

    if (this.offerMode() === 'listings') {
      this.submitSwapOffer();
      return;
    }

    if (!this.sessionCreated) {
      this.ensureSessionThenSubmit();
      return;
    }

    const session = this.session();
    if (!session) return;
    this.submitProposal(session.session_id);
  }

  private submitSwapOffer() {
    const senderIds = this.itemDrafts().map(d => d.listingId!);
    this.api.createSwapOffer({
      receiver_item_id: this.listingId(),
      sender_item_ids: senderIds,
      message: this.message(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.step.set(5);
          this.snackbar.success(this.translation.translate('swap.proposeForm.submitSuccess'));
        },
        error: (err) => {
          console.error('[swap-offer] create failed', err);
          this.isSubmitting.set(false);
          this.snackbar.error(this.formatError(err, 'swap.proposeForm.submitError'));
        },
      });
  }

  private ensureSessionThenSubmit() {
    this.isLoadingSession.set(true);
    this.api.createProposalSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: session => {
          this.session.set(session);
          this.sessionCreated = true;
          this.isLoadingSession.set(false);
          this.submitProposal(session.session_id);
        },
        error: () => {
          this.isLoadingSession.set(false);
          this.isSubmitting.set(false);
          this.snackbar.error(this.translation.translate('swap.proposeForm.sessionError'));
        },
      });
  }

  private submitProposal(sessionId: string) {
    this.api.createProposal({
      session_id: sessionId,
      target_listing_id: this.listingId(),
      message: this.message(),
      items: this.itemDrafts().map(d => ({
        title: d.title,
        temp_path: d.temp_path,
      })),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.sse.disconnect();
          this.step.set(5);
          this.snackbar.success(this.translation.translate('swap.proposeForm.submitSuccess'));
        },
        error: (err) => {
          console.error('[proposal] finalize failed', err);
          this.isSubmitting.set(false);
          this.snackbar.error(this.formatError(err, 'swap.proposeForm.submitError'));
        },
      });
  }

  private formatError(err: unknown, fallbackKey: string): string {
    const fallback = this.translation.translate(fallbackKey);
    if (!err || typeof err !== 'object') return fallback;
    const e = err as {
      message?: string;
      error?: { message?: string; detail?: Array<{ msg?: string; loc?: unknown[] }> };
    };
    const firstDetail = e.error?.detail?.[0];
    if (firstDetail?.msg) {
      const loc = Array.isArray(firstDetail.loc) ? firstDetail.loc[firstDetail.loc.length - 1] : '';
      return loc ? `${String(loc)}: ${firstDetail.msg}` : firstDetail.msg;
    }
    return e.error?.message || e.message || fallback;
  }

  private focusStepInput() {
    setTimeout(() => {
      const input = this.elementRef.nativeElement.querySelector('.step-input');
      input?.focus();
    });
  }
}
