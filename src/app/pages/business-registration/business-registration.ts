import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VerificationService } from 'lib/services/verification/verification.service';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { BusinessType, VendorRegistration } from 'lib/models/vendor.models';
import { ProgressStepperComponent } from '../profile/sections/business-section/components/progress-stepper/progress-stepper';
import { VendorStepOneComponent } from '../profile/sections/business-section/steps/step-one/step-one';
import { VendorStepTwoComponent } from '../profile/sections/business-section/steps/step-two/step-two';
import { VendorStepThreeComponent } from '../profile/sections/business-section/steps/step-three/step-three';
import { REGISTRATION_STEPS } from 'lib/constants/vendor.constants';
import { Footer } from 'lib/components/footer/footer';

@Component({
  selector: 'app-business-registration',
  imports: [
    RouterLink,
    MatIconModule,
    MatSnackBarModule,
    TranslatePipe,
    ProgressStepperComponent,
    VendorStepOneComponent,
    VendorStepTwoComponent,
    VendorStepThreeComponent,
    Footer
  ],
  templateUrl: './business-registration.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessRegistrationComponent implements OnInit {
  private router = inject(Router);
  translation = inject(TranslationService);
  private vendorService = inject(VendorService);
  private verificationService = inject(VerificationService);
  private snackBar = inject(MatSnackBar);

  isVerified = this.verificationService.isVerified;
  isVendor = this.vendorService.isVendor;
  isPendingApproval = this.vendorService.isPendingApproval;

  currentStep = signal(1);
  businessType = signal<BusinessType | null>(null);
  formData = signal<Partial<VendorRegistration>>({});
  submitting = signal(false);

  steps = computed(() => {
    const current = this.currentStep();
    return REGISTRATION_STEPS.map(step => ({
      ...step,
      completed: step.step < current
    }));
  });

  ngOnInit() {
    this.translation.loadModule('profile').subscribe();
    this.translation.loadModule('validation').subscribe();
  }

  onTypeSelected(type: BusinessType) {
    this.businessType.set(type);
  }

  onStepOneNext() {
    this.currentStep.set(2);
  }

  onStepTwoBack() {
    this.currentStep.set(1);
  }

  onStepTwoNext(data: VendorRegistration) {
    this.formData.set(data);
    this.currentStep.set(3);
  }

  onStepThreeBack() {
    this.currentStep.set(2);
  }

  onSubmit() {
    const data = this.formData() as VendorRegistration;
    if (!data.identification_number) {
      return;
    }

    this.submitting.set(true);
    this.vendorService.registerAsVendor(data).subscribe({
      next: () => {
        this.snackBar.open('Successfully registered as vendor!', 'Close', {
          duration: 3000
        });
        this.submitting.set(false);
        this.router.navigate(['/profile/business']);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const httpErr = err instanceof HttpErrorResponse ? err : null;
        const body = httpErr?.error as { error_code?: string; message?: string } | null;
        if (body?.error_code === 'INVALID_ID_NUMBER') {
          const msg =
            body.message ||
            this.translation.translate('validation.invalidBusinessRegistryId');
          this.snackBar.open(msg, 'Close', { duration: 6000 });
          this.currentStep.set(2);
          return;
        }
        const fallback =
          typeof body?.message === 'string' && body.message.trim()
            ? body.message
            : this.translation.translate('profile.vendor.registrationFailed');
        this.snackBar.open(fallback, 'Close', { duration: 4000 });
      }
    });
  }

  goBack() {
    this.router.navigate(['/profile/business']);
  }
}
