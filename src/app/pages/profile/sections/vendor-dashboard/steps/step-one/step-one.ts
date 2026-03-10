import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { BusinessType } from 'lib/models/vendor.models';
import { BusinessTypeCardComponent } from '../../components/business-type-card/business-type-card';
import { BUSINESS_TYPE_OPTIONS, VENDOR_FEATURES } from 'lib/constants/vendor.constants';

@Component({
  selector: 'app-vendor-step-one',
  imports: [
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
    BusinessTypeCardComponent
  ],
  templateUrl: './step-one.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class VendorStepOneComponent {
  selectedType = input<BusinessType | null>(null);
  typeSelected = output<BusinessType>();
  nextStep = output<void>();

  readonly features = VENDOR_FEATURES;
  readonly businessTypes = BUSINESS_TYPE_OPTIONS;

  onTypeSelect(type: BusinessType) {
    this.typeSelected.emit(type);
  }

  onContinue() {
    if (this.selectedType()) {
      this.nextStep.emit();
    }
  }
}
