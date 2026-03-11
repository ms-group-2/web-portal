import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { VendorProfile } from 'lib/models/vendor.models';
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
  onNavigateToProducts = output<void>();

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
}
