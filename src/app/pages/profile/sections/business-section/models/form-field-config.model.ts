import { VendorRegistration } from 'lib/models/vendor.models';

export interface FormFieldConfig {
  name: keyof VendorRegistration;
  label: string;
  type: string;
  placeholder: string;
  validators: any[];
}

