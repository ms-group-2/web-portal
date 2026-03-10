import { VendorRegistration, BusinessType } from 'lib/models/vendor.models';

export interface ReviewField {
  label: string;
  value: string;
  isTranslatable?: boolean;
}

export function getReviewFields(
  data: VendorRegistration,
  businessType: BusinessType | null
): ReviewField[] {
  return [
    {
      label: 'profile.vendor.form.identificationNumber',
      value: data.identification_number || '—',
      isTranslatable: false
    },
    {
      label: 'profile.vendor.form.legalAddress',
      value: data.legal_address || '—',
      isTranslatable: false
    },
    {
      label: 'profile.vendor.form.contactPhone',
      value: data.contact_phone || '—',
      isTranslatable: false
    },
    {
      label: 'profile.vendor.form.contactEmail',
      value: data.contact_email || '—',
      isTranslatable: false
    },
    {
      label: 'profile.vendor.form.bankAccount',
      value: data.bank_account_number || '—',
      isTranslatable: false
    },
    {
      label: 'profile.vendor.step3.businessType',
      value: businessType ? `profile.vendor.step1.types.${businessType}.title` : '—',
      isTranslatable: true
    }
  ];
}
