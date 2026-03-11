import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { VendorRegistration, BusinessType } from 'lib/models/vendor.models';
import { getReviewFields } from 'lib/utils/vendor.utils';
import { VENDOR_TERMS_PARAGRAPHS, READY_MESSAGE_ELEMENTS } from 'lib/constants/vendor.constants';

@Component({
  selector: 'app-vendor-step-three',
  imports: [
    MatIconModule,
    MatButtonModule,
    TranslatePipe
  ],
  templateUrl: './step-three.html',
  styleUrls: ['./step-three.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorStepThreeComponent {
  formData = input.required<VendorRegistration>();
  businessType = input.required<BusinessType | null>();
  submitting = input<boolean>(false);

  previousStep = output<void>();
  submit = output<void>();

  agreedToTerms = signal(false);

  readonly termsParagraphs = VENDOR_TERMS_PARAGRAPHS;
  readonly readyMessageElements = READY_MESSAGE_ELEMENTS;

  reviewFields = computed(() =>
    getReviewFields(this.formData(), this.businessType())
  );

  onBack() {
    this.previousStep.emit();
  }

  onSubmit() {
    if (this.agreedToTerms()) {
      this.submit.emit();
    }
  }

  toggleTerms(checked: boolean) {
    this.agreedToTerms.set(checked);
  }
}
