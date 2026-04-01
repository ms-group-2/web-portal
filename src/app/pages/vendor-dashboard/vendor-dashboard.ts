import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { AuthService } from 'lib/services/identity/auth.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { Profile } from 'lib/services/profile/models/profile.model';
import { DashboardSection } from './sections/dashboard-section/dashboard-section';
import { ProductsSection } from './sections/products-section/products-section';
import { OrdersSection } from './sections/orders-section/orders-section';
import { SettingsSection } from './sections/settings-section/settings-section';
import { DeleteConfirmationDialog } from './components/delete-confirmation-dialog/delete-confirmation-dialog';
import { MAIN_NAVIGATION_TABS, SETTINGS_NAVIGATION_TABS } from './constants/navigation.constants';
import { TabType } from './models/navigation.models';

const VALID_TABS: readonly TabType[] = ['dashboard', 'products', 'orders', 'settings'];

function tabFromQueryParams(params: Params): TabType {
  const raw = params['tab'];
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s || typeof s !== 'string') {
    return 'dashboard';
  }
  return VALID_TABS.includes(s as TabType) ? (s as TabType) : 'dashboard';
}

@Component({
  selector: 'app-vendor-dashboard',
  imports: [
    NgClass,
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
    DashboardSection,
    ProductsSection,
    OrdersSection,
    SettingsSection,
  ],
  templateUrl: './vendor-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDashboard implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  translation = inject(TranslationService);
  private vendorService = inject(VendorService);
  private auth = inject(AuthService);
  private profileApi = inject(ProfileApiService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  vendorProfile = this.vendorService.vendorProfile;
  userProfile = signal<Profile | null>(null);

  /** Initialized from the URL snapshot so the first paint matches ?tab= (Observable can emit later). */
  activeTab = signal<TabType>(tabFromQueryParams(this.route.snapshot.queryParams));
  mainNavigationTabs = MAIN_NAVIGATION_TABS;
  settingsNavigationTabs = SETTINGS_NAVIGATION_TABS;
  allNavigationTabs = [...MAIN_NAVIGATION_TABS, ...SETTINGS_NAVIGATION_TABS];
  products = signal<any[]>([]);
  loading = signal<boolean>(false);
  productToDelete = signal<string | number | null>(null);
  sidebarOpen = signal<boolean>(false);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  ngOnInit() {
    this.translation.loadModule('vendor').subscribe();

    this.vendorService.ensureProfileLoaded()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    // Load user profile (ProfileApiService caches this internally)
    const userId = this.auth.user()?.id;
    if (userId && !this.userProfile()) {
      this.profileApi.getProfile(userId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(profile => this.userProfile.set(profile));
    }

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['tab']) {
        this.setActiveTab(tabFromQueryParams(params), { syncUrl: false });
      }
    });

    // Re-apply tab so loadProducts runs for ?tab=products when snapshot already matched the signal.
    this.setActiveTab(tabFromQueryParams(this.route.snapshot.queryParams), { syncUrl: false });
  }

  setActiveTab(tab: TabType, options?: { syncUrl?: boolean }) {
    this.activeTab.set(tab);

    const syncUrl = options?.syncUrl !== false;
    if (syncUrl) {
      const current = this.route.snapshot.queryParams['tab'];
      const currentStr = Array.isArray(current) ? current[0] : current;
      if (currentStr !== tab) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { tab },
          queryParamsHandling: 'merge',
        });
      }
    }

    if (tab === 'products' && this.vendorProfile()) {
      this.loadProducts();
    }
  }

  loadProducts() {
    const profile = this.vendorProfile();
    if (!profile) return;

    if ((profile.status || '').toLowerCase() === 'pending') {
      this.products.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.vendorService.getMyProducts(profile.supplier_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  openAddProductModal() {
    this.router.navigate(['/business/dashboard/add-product']);
  }

  openEditProduct(productId: string | number) {
    this.router.navigate(['/business/dashboard/edit-product', productId]);
  }

  confirmDeleteProduct(productId: string | number) {
    const dialogRef = this.dialog.open(DeleteConfirmationDialog, {
      width: '448px',
      height: '194px',
      panelClass: 'delete-confirmation-dialog',
      data: {
        title: 'vendor.confirmDeleteTitle',
        message: 'vendor.confirmDelete',
        confirmText: 'vendor.deleteProduct',
        cancelText: 'vendor.cancel',
      },
      disableClose: false,
      hasBackdrop: true,
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.productToDelete.set(productId);
        this.deleteProduct();
      });
  }

  deleteProduct() {
    const profile = this.vendorProfile();
    const productId = this.productToDelete();

    if (!profile || !productId) return;

    this.vendorService.deleteProduct(profile.supplier_id, productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.products.set(this.products().filter(p => p.id !== productId));
          this.productToDelete.set(null);
        },
        error: (error) => {
          console.error('Failed to delete product:', error);
          this.productToDelete.set(null);
        }
      });
  }

  goBack() {
    this.router.navigate(['/profile/business']);
  }
}
