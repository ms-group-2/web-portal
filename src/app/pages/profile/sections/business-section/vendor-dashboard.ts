import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VerificationService } from 'lib/services/verification/verification.service';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { VENDOR_FEATURES } from 'lib/constants/vendor.constants';
import { AuthService } from 'lib/services/identity/auth.service';

@Component({
  selector: 'app-vendor-dashboard',
  imports: [
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
  ],
  templateUrl: './vendor-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDashboardComponent implements OnInit {
  private router = inject(Router);
  private translation = inject(TranslationService);
  private vendorService = inject(VendorService);
  private verificationService = inject(VerificationService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  isVerified = this.verificationService.isVerified;
  isVendor = this.vendorService.isVendor;
  isPending = this.vendorService.isPendingApproval;
  vendorProfile = this.vendorService.vendorProfile;

  readonly features = VENDOR_FEATURES;

  activeTab = signal<'dashboard' | 'products' | 'orders' | 'settings'>('dashboard');
  products = signal<any[]>([]);
  loading = signal<boolean>(false);
  showBusinessDropdown = signal<boolean>(false);

  ngOnInit() {
    this.translation.loadModule('profile').subscribe();

    // Re-hydrate vendor state on page revisit / refresh
    if (this.auth.isAuthenticated()) {
      this.vendorService.getMyProfile()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  startRegistration() {
    this.router.navigate(['/business/register']);
  }

  setActiveTab(tab: 'dashboard' | 'products' | 'orders' | 'settings') {
    this.activeTab.set(tab);

    if (tab === 'products' && this.products().length === 0 && this.vendorProfile()) {
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

  toggleBusinessDropdown() {
    this.showBusinessDropdown.update(v => !v);
  }


  goBack() {
    this.router.navigate(['/profile']);
  }

  goToDashboard() {
    this.router.navigate(['/business/dashboard']);
  }
}
