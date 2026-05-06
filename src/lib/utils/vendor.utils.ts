import { VendorRegistration, BusinessType } from 'lib/models/vendor.models';
import { ProviderProfileRequest } from 'lib/services/booking';

export interface ReviewField {
  label: string;
  value: string;
  isTranslatable?: boolean;
}

export function getReviewFields(
  data: VendorRegistration | ProviderProfileRequest,
  businessType: BusinessType | null
): ReviewField[] {
  if (businessType === 'service') {
    const serviceData = data as ProviderProfileRequest;
    return [
      {
        label: 'profile.vendor.form.providerName',
        value: serviceData.name || '—',
        isTranslatable: false
      },
      {
        label: 'profile.vendor.form.providerDescription',
        value: serviceData.description || '—',
        isTranslatable: false
      },
      {
        label: 'profile.vendor.form.providerPhone',
        value: serviceData.phone_number || '—',
        isTranslatable: false
      },
      {
        label: 'profile.vendor.form.callType',
        value: serviceData.call_type ? `profile.vendor.form.callTypes.${serviceData.call_type}` : '—',
        isTranslatable: !!serviceData.call_type
      },
      {
        label: 'profile.vendor.form.providerBusinessType',
        value: serviceData.business_type ? `profile.vendor.form.providerBusinessTypes.${serviceData.business_type}` : '—',
        isTranslatable: !!serviceData.business_type
      },
      {
        label: 'profile.vendor.step3.businessType',
        value: 'profile.vendor.step1.types.service.title',
        isTranslatable: true
      }
    ];
  }

  const sellerData = data as VendorRegistration;
  return [
    {
      label: 'profile.vendor.form.identificationNumber',
      value: sellerData.identification_number || '—',
      isTranslatable: false
    },
    {
      label: 'profile.vendor.form.legalAddress',
      value: sellerData.legal_address || '—',
      isTranslatable: false
    },
    {
      label: 'profile.vendor.form.contactPhone',
      value: sellerData.contact_phone || '—',
      isTranslatable: false
    },
    {
      label: 'profile.vendor.form.contactEmail',
      value: sellerData.contact_email || '—',
      isTranslatable: false
    },
    {
      label: 'profile.vendor.form.bankAccount',
      value: sellerData.bank_account_number || '—',
      isTranslatable: false
    },
    {
      label: 'profile.vendor.step3.businessType',
      value: businessType ? `profile.vendor.step1.types.${businessType}.title` : '—',
      isTranslatable: true
    }
  ];
}
