import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VendorRegistration } from 'lib/models/vendor.models';
import { strictEmailValidator } from 'lib/validators/strict-email.validator';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { sanitizePhoneInput } from 'lib/utils/input-sanitizers.util';
import { PhoneUtil } from 'lib/services/profile/utils/phone.util';
import { FormFieldConfig } from '../../models/form-field-config.model';

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

  formData = input<Partial<VendorRegistration>>({});
  previousStep = output<void>();
  nextStep = output<VendorRegistration>();

  businessForm!: FormGroup;

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
      name: 'contact_phone',
      label: 'profile.vendor.form.contactPhone',
      type: 'tel',
      placeholder: 'profile.vendor.form.placeholders.contactPhone',
      validators: [Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern(/^\d+$/)]
    },
    {
      name: 'contact_email',
      label: 'profile.vendor.form.contactEmail',
      type: 'email',
      placeholder: 'profile.vendor.form.placeholders.contactEmail',
      validators: [Validators.required,Validators.maxLength(255), strictEmailValidator(), emptySpaceValidator()]
    },
    {
      name: 'bank_account_number',
      label: 'profile.vendor.form.bankAccount',
      type: 'text',
      placeholder: 'profile.vendor.form.placeholders.bankAccount',
      validators: [Validators.required, Validators.minLength(10)]
    }
  ];

  ngOnInit() {
    const formControls: any = {};
    this.formFields.forEach(field => {
      if (field.name === 'contact_email') {
        formControls[field.name] = this.fb.control(this.formData()[field.name] || '', {
          validators: field.validators,
          updateOn: 'blur'
        });
      } else {
        const rawValue = (this.formData()[field.name] || '').toString();
        const initialValue =
          field.name === 'contact_phone'
            ? PhoneUtil.sanitize(rawValue).replace(/^\+?995/, '').replace(/[^\d]/g, '')
            : rawValue;

        formControls[field.name] = [initialValue, field.validators];
      }
    });
    this.businessForm = this.fb.group(formControls);
  }

  onBack() {
    this.previousStep.emit();
  }

  onContinue() {
    if (this.businessForm.valid) {
      const raw = this.businessForm.value as VendorRegistration;
      this.nextStep.emit({
        ...raw,
        contact_phone: PhoneUtil.normalizeForApi(raw.contact_phone || ''),
      });
    } else {
      this.businessForm.markAllAsTouched();
    }
  }

  onInput(event: Event, fieldName: keyof VendorRegistration) {
    if (fieldName === 'contact_phone' || fieldName === 'identification_number') {
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

    return `validation.${key}`;
  }
}
