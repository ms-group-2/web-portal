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

interface FormFieldConfig {
  name: keyof VendorRegistration;
  label: string;
  type: string;
  placeholder: string;
  validators: any[];
}

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
  readonly COUNTRY_CODE = '+995';
  readonly PHONE_NATIONAL_CONTROL = 'contact_phone_national';

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
        formControls[field.name] = [this.formData()[field.name] || '', field.validators];
      }
    });

    const existingPhone = (this.formData().contact_phone ?? '').toString();
    const nationalDefault = existingPhone.startsWith(this.COUNTRY_CODE)
      ? existingPhone.slice(this.COUNTRY_CODE.length)
      : existingPhone.replace(/^\+?995/, '');

    formControls[this.PHONE_NATIONAL_CONTROL] = [
      nationalDefault || '',
      [Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern(/^\d+$/)],
    ];

    this.businessForm = this.fb.group(formControls);
  }

  onBack() {
    this.previousStep.emit();
  }

  onContinue() {
    if (this.businessForm.valid) {
      const raw = this.businessForm.getRawValue() as any;
      const national = (raw[this.PHONE_NATIONAL_CONTROL] ?? '').toString();

      const payload: VendorRegistration = {
        ...(raw as Omit<VendorRegistration, 'contact_phone'>),
        contact_phone: `${this.COUNTRY_CODE}${national}`,
      } as VendorRegistration;

      delete (payload as any)[this.PHONE_NATIONAL_CONTROL];
      this.nextStep.emit(payload);
    } else {
      this.businessForm.markAllAsTouched();
    }
  }

  onInput(event: Event, fieldName: keyof VendorRegistration) {
    if (fieldName === 'identification_number') {
      const control = this.businessForm.get(fieldName) as FormControl | null;
      if (!control) {
        return;
      }

      sanitizePhoneInput(event, control);
    }
  }

  onPhoneNationalInput(event: Event) {
    const control = this.businessForm.get(this.PHONE_NATIONAL_CONTROL) as FormControl | null;
    if (!control) {
      return;
    }
    sanitizePhoneInput(event, control);
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
