export type ContactTheme = 'primary' | 'swap' | 'market';

export interface ContactField {
  label: string;
  icon: string;
  theme: ContactTheme;
  formControlName: 'email' | 'phone' | 'location';
  isEditable: boolean;
  inputType: 'email' | 'tel' | 'text';
  valueKey: 'email' | 'phone' | 'location';
}

export const CONTACT_FIELDS: ContactField[] = [
  {
    label: 'იმეილი',
    icon: 'mail',
    theme: 'primary',
    formControlName: 'email',
    isEditable: false,
    inputType: 'email',
    valueKey: 'email'
  },
  {
    label: 'ტელეფონი',
    icon: 'phone',
    theme: 'swap',
    formControlName: 'phone',
    isEditable: true,
    inputType: 'tel',
    valueKey: 'phone'
  },
  {
    label: 'მისამართი',
    icon: 'location_on',
    theme: 'market',
    formControlName: 'location',
    isEditable: true,
    inputType: 'text',
    valueKey: 'location'
  }
];

