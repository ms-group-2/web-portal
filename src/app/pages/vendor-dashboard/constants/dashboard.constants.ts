import { InfoField, QuickAction } from '../models/dashboard.models';

export const INFO_FIELDS: InfoField[] = [
  { label: 'vendor.identificationNumber', key: 'identification_number' },
  { label: 'vendor.legalAddress', key: 'legal_address' },
  { label: 'vendor.contactPhone', key: 'contact_phone' },
  { label: 'vendor.contactEmail', key: 'contact_email' },
  { label: 'vendor.bankAccountNumber', key: 'bank_account_number' },
  {
    label: 'vendor.businessType',
    key: 'business_type',
    translationKey: (value: string) => {
      const types: Record<string, string> = {
        'seller': 'vendor.businessTypes.seller',
        'service': 'vendor.businessTypes.service',
        'both': 'vendor.businessTypes.both'
      };
      return types[value] || 'vendor.businessTypes.seller';
    }
  },
];

export const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: 'ph-package',
    title: 'vendor.quickActions.addProduct.title',
    description: 'vendor.quickActions.addProduct.description'
  },
  {
    icon: 'ph-file-text',
    title: 'vendor.quickActions.salesReport.title',
    description: 'vendor.quickActions.salesReport.description'
  },
  {
    icon: 'ph-upload',
    title: 'vendor.quickActions.importData.title',
    description: 'vendor.quickActions.importData.description'
  }
];
