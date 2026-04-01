import { ChangeDetectorRef, Component, ChangeDetectionStrategy, DestroyRef, input, output, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VendorRegistration } from 'lib/models/vendor.models';
import { strictEmailValidator } from 'lib/validators/strict-email.validator';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { phoneNationalValidator } from 'lib/validators/phone-national.validator';
import { ibanValidator } from 'lib/validators/iban.validator';
import { sanitizePhoneInput } from 'lib/utils/input-sanitizers.util';
import { PhoneUtil } from 'lib/services/profile/utils/phone.util';
import { FormFieldConfig } from '../../models/form-field-config.model';
import { VendorService } from 'lib/services/vendor/vendor.service';
import { businessRegistryAsyncValidator } from 'lib/validators/business-registry-async.validator';

const BLUR_VALIDATE_FIELDS = new Set<string>([
  'contact_email',
  'contact_phone',
  'bank_account_number',
  'identification_number',
]);

@Component({
  selector: 'app-vendor-step-two',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslatePipe
  ],
  templateUrl: './step-two.html',
  styleUrls: ['./step-two.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorStepTwoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private translation = inject(TranslationService);
  private vendorService = inject(VendorService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  formData = input<Partial<VendorRegistration>>({});
  previousStep = output<void>();
  nextStep = output<VendorRegistration>();

  businessForm!: FormGroup;
  readonly COUNTRY_CODE = PhoneUtil.GE_DIAL_CODE;

  formFields: FormFieldConfig[] = [
    {
      name: 'identification_number',
      label: 'profile.vendor.form.identificationNumber',
      type: 'text',
      placeholder: 'profile.vendor.form.placeholders.identificationNumber',
      validators: [Validators.required, Validators.minLength(9), Validators.maxLength(11),Validators.pattern(/^\d+$/)]
    },
    {
      name: 'name',
      label: 'profile.vendor.form.businessName',
      type: 'text',
      placeholder: 'profile.vendor.form.placeholders.businessName',
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)]
    },
    {
      name: 'legal_address',
      label: 'profile.vendor.form.legalAddress',
      type: 'text',
      placeholder: 'profile.vendor.form.placeholders.legalAddress',
      validators: [Validators.required, Validators.maxLength(50)]
    },
    {
      name: 'contact_email',
      label: 'profile.vendor.form.contactEmail',
      type: 'email',
      placeholder: 'profile.vendor.form.placeholders.contactEmail',
      validators: [Validators.required,Validators.maxLength(255), strictEmailValidator(), emptySpaceValidator()]
    },
    {
      name: 'contact_phone',
      label: 'profile.vendor.form.contactPhone',
      type: 'tel',
      placeholder: 'profile.vendor.form.placeholders.contactPhone',
      validators: [
        Validators.required,
        Validators.minLength(9),
        Validators.maxLength(9),
        Validators.pattern(/^\d+$/),
        phoneNationalValidator(),
      ]
    },
    {
      name: 'bank_account_number',
      label: 'profile.vendor.form.bankAccount',
      type: 'text',
      placeholder: 'profile.vendor.form.placeholders.bankAccount',
      validators: [Validators.required, Validators.maxLength(34), ibanValidator()]
    }
  ];

  ngOnInit() {
    const formControls: Record<string, FormControl> = {};
    this.formFields.forEach(field => {
      const rawValue = (this.formData()[field.name as keyof VendorRegistration] ?? '').toString();
      const initialValue =
        field.name === 'contact_phone'
          ? PhoneUtil.extractGeNational(rawValue)
          : rawValue;

      const asyncValidators =
        field.name === 'identification_number'
          ? [businessRegistryAsyncValidator(this.vendorService)]
          : [];

      formControls[field.name] = this.fb.control(initialValue, {
        validators: field.validators,
        asyncValidators,
        updateOn: BLUR_VALIDATE_FIELDS.has(field.name) ? 'blur' : 'change',
      });
    });

    this.businessForm = this.fb.group(formControls);

    this.businessForm
      .get('identification_number')
      ?.statusChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  onBack() {
    this.previousStep.emit();
  }

  onContinue() {
    if (this.businessForm.valid) {
      const raw = this.businessForm.getRawValue() as any;
      const national = (raw.contact_phone ?? '').toString();
      const payload: VendorRegistration = {
        ...(raw as VendorRegistration),
        contact_phone: PhoneUtil.toGeE164(national),
      };

      this.nextStep.emit(payload);
    } else {
      this.businessForm.markAllAsTouched();
    }
  }

  onInput(event: Event, fieldName: keyof VendorRegistration) {
    if (fieldName === 'identification_number' || fieldName === 'contact_phone') {
      const control = this.businessForm.get(fieldName) as FormControl | null;
      if (!control) {
        return;
      }

      sanitizePhoneInput(event, control);
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.businessForm.get(fieldName);
    const errors = control?.errors as Record<string, any> | null;
    if (!errors) {
      return '';
    }

    const key = Object.keys(errors)[0];

    if (key === 'minlength' && errors['minlength']?.requiredLength) {
      return this.translation.translate('validation.minlength', { n: errors['minlength'].requiredLength });
    }

    if (key === 'maxlength' && errors['maxlength']?.requiredLength) {
      return this.translation.translate('validation.maxlength', { n: errors['maxlength'].requiredLength });
    }

    if (key === 'invalidPhone') {
      return this.translation.translate('profile.errors.invalidPhoneFormat');
    }

    return `validation.${key}`;
  }
}
