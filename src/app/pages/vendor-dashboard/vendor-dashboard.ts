import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
    DeleteConfirmationDialog,
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

  vendorProfile = this.vendorService.vendorProfile;
  userProfile = signal<Profile | null>(null);

  activeTab = signal<TabType>('dashboard');
  mainNavigationTabs = MAIN_NAVIGATION_TABS;
  settingsNavigationTabs = SETTINGS_NAVIGATION_TABS;
  allNavigationTabs = [...MAIN_NAVIGATION_TABS, ...SETTINGS_NAVIGATION_TABS];
  products = signal<any[]>([]);
  loading = signal<boolean>(false);
  showDeleteDialog = signal<boolean>(false);
  productToDelete = signal<string | number | null>(null);
  sidebarOpen = signal<boolean>(false);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  ngOnInit() {
    // Load vendor translation module only once
    this.translation.loadModule('vendor').subscribe();

    // Load vendor profile if not already loaded
    if (!this.vendorProfile()) {
      this.vendorService.getMyProfile()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }

    // Load user profile (ProfileApiService caches this internally)
    const userId = this.auth.user()?.id;
    if (userId && !this.userProfile()) {
      this.profileApi.getProfile(userId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(profile => this.userProfile.set(profile));
    }

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['tab']) {
        this.setActiveTab(params['tab'] as TabType);
      }
    });
  }

  setActiveTab(tab: TabType) {
    this.activeTab.set(tab);

    // Load products when switching to products tab
    if (tab === 'products' && this.vendorProfile()) {
      this.loadProducts();
    }
  }

  loadProducts() {
    const profile = this.vendorProfile();
    if (!profile) return;

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
    this.productToDelete.set(productId);
    this.showDeleteDialog.set(true);
  }

  cancelDelete() {
    this.showDeleteDialog.set(false);
    this.productToDelete.set(null);
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
          this.showDeleteDialog.set(false);
          this.productToDelete.set(null);
        },
        error: (error) => {
          console.error('Failed to delete product:', error);
          this.showDeleteDialog.set(false);
          this.productToDelete.set(null);
        }
      });
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}
