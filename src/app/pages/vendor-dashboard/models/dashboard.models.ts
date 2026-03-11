import { VendorProfile } from 'lib/models/vendor.models';

export interface InfoField {
  label: string;
  key: keyof VendorProfile;
  translationKey?: (value: any) => string;
}

export interface QuickAction {
  icon: string;
  title: string;
  description: string;
  action?: () => void;
}
