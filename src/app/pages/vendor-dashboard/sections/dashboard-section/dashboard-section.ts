import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { VendorProfile } from 'lib/models/vendor.models';
import { ProviderProfileResponse } from 'lib/services/booking';
import { INFO_FIELDS, QUICK_ACTIONS } from '../../constants/dashboard.constants';
import { InfoField, QuickAction } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-section',
  imports: [TranslatePipe],
  templateUrl: './dashboard-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSection {
  vendorProfile = input<VendorProfile | null>();
  providerProfile = input<ProviderProfileResponse | null>(null);
  isBookingProvider = input(false);
  onNavigateToProducts = output<void>();
  onNavigateToSettings = output<void>();

  infoFields = INFO_FIELDS;
  quickActions = QUICK_ACTIONS;

  getFieldValue(field: InfoField): string {
    const profile = this.vendorProfile();
    if (!profile) return '';
    const value = profile[field.key];
    return field.translationKey ? field.translationKey(value) : String(value);
  }

  handleQuickAction(action: QuickAction): void {
    if (action.title === 'vendor.quickActions.addProduct.title') {
      this.onNavigateToProducts.emit();
    }
  }

  handleProviderAction(action: string): void {
    if (action === 'settings') {
      this.onNavigateToSettings.emit();
    }
  }
}
