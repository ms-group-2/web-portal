import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

type ProductFilter = 'all' | 'rejected' | 'draft' | 'pendingApproval';

@Component({
  selector: 'app-products-section',
  imports: [TranslatePipe],
  templateUrl: './products-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsSection {
  products = input<any[]>([]);
  loading = input<boolean>(false);
  onAddProduct = output<void>();
  onEditProduct = output<string | number>();
  onDeleteProduct = output<string | number>();

  selectedFilter = signal<ProductFilter>('all');

  draftProducts = computed(() => this.products().filter(product => this.isDraftProduct(product)));
  pendingApprovalProducts = computed(() => this.products().filter(product => this.isPendingApprovalProduct(product)));
  activeProducts = computed(() => this.products().filter(product => this.isApprovedProduct(product)));
  rejectedProducts = computed(() => this.products().filter(product => this.isRejectedProduct(product)));
  filteredProducts = computed(() => {
    const filter = this.selectedFilter();
    if (filter === 'draft') return this.draftProducts();
    if (filter === 'pendingApproval') return this.pendingApprovalProducts();
    if (filter === 'rejected') return this.rejectedProducts();
    return this.activeProducts();
  });

  setFilter(filter: ProductFilter): void {
    this.selectedFilter.set(filter);
  }

  isDraft(product: any): boolean {
    return this.isDraftProduct(product);
  }

  isPendingApproval(product: any): boolean {
    return this.isPendingApprovalProduct(product);
  }

  canEdit(product: any): boolean {
    return !this.isPendingApprovalProduct(product);
  }

  isRejected(product: any): boolean {
    return this.isRejectedProduct(product);
  }

  private isDraftProduct(product: any): boolean {
    if (product?.source === 'live') {
      return false;
    }

    if (this.isPendingApprovalProduct(product) || this.isApprovedProduct(product) || this.isRejectedProduct(product)) {
      return false;
    }

    const statuses = this.getNormalizedStatuses(product);
    return !!product?.isDraft || statuses.some((status) => status === 'draft' || status.includes('draft'));
  }

  private isPendingApprovalProduct(product: any): boolean {
    if (product?.source === 'live') {
      return false;
    }

    const statuses = this.getNormalizedStatuses(product);
    if (!statuses.length) {
      return false;
    }

    // Approved/live states must win over stale pending-like status fields.
    if (statuses.some((status) => this.isApprovedStatus(status))) {
      return false;
    }

    return statuses.some((status) =>
      status === 'pending' ||
      status === 'pending_approval' ||
      status === 'awaiting_approval' ||
      status === 'in_review' ||
      status === 'under_review' ||
      status === 'review' ||
      status === 'submitted' ||
      status === 'queued' ||
      status === 'failed'
    );
  }

  private isRejectedProduct(product: any): boolean {
    const statuses = this.getNormalizedStatuses(product);
    if (!statuses.length) {
      return false;
    }

    return statuses.some((status) =>
      status === 'rejected' ||
      status === 'declined' ||
      status === 'denied' ||
      status === 'refused' ||
      status.includes('rejected') ||
      status.includes('declined') ||
      status.includes('denied') ||
      status.includes('refused')
    );
  }

  private isApprovedProduct(product: any): boolean {
    if (product?.source === 'live' && !this.isRejectedProduct(product)) {
      return true;
    }

    if (this.isRejectedProduct(product)) {
      return false;
    }

    const statuses = this.getNormalizedStatuses(product);
    return statuses.some((status) => this.isApprovedStatus(status));
  }

  private getNormalizedStatuses(product: any): string[] {
    const candidates = [
      product?.status,
      product?.upload_status,
      product?.review_status,
      product?.moderation_status,
      product?.task_status,
      product?.state,
    ];

    return candidates
      .map((value) => String(value ?? '').trim().toLowerCase())
      .filter((value) => !!value)
      .map((value) => value.replace(/[\s-]+/g, '_'));
  }

  private isApprovedStatus(normalizedStatus: string): boolean {
    return (
      normalizedStatus === 'approved' ||
      normalizedStatus === 'active' ||
      normalizedStatus === 'published' ||
      normalizedStatus === 'live' ||
      normalizedStatus.includes('approved') ||
      normalizedStatus.includes('active') ||
      normalizedStatus.includes('published') ||
      normalizedStatus.includes('live')
    );
  }
}
