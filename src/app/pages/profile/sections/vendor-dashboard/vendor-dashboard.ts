import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VerificationService } from 'lib/services/verification/verification.service';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { VENDOR_FEATURES } from 'lib/constants/vendor.constants';

@Component({
  selector: 'app-vendor-dashboard',
  imports: [
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
  ],
  templateUrl: './vendor-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class VendorDashboardComponent implements OnInit {
  private router = inject(Router);
  private translation = inject(TranslationService);
  private vendorService = inject(VendorService);
  private verificationService = inject(VerificationService);

  isVerified = this.verificationService.isVerified;
  isVendor = this.vendorService.isVendor;

  readonly features = VENDOR_FEATURES;

  products = signal<any[]>([]);
  loading = signal<boolean>(false);

  ngOnInit() {
    this.translation.loadModule('profile').subscribe();
  }

  startRegistration() {
    this.router.navigate(['/business/register']);
  }
}
