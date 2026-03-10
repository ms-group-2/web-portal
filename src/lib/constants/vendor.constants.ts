import { BusinessTypeOption, RegistrationStep } from 'lib/models/vendor.models';

export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  {
    type: 'seller',
    icon: 'shopping_bag',
    title: 'profile.vendor.step1.types.seller.title',
    description: 'profile.vendor.step1.types.seller.description',
    subtitle: 'profile.vendor.step1.types.seller.subtitle',
    color: 'bg-registerBusiness',
    borderColor: 'border-registerBusiness',
    bgColor: 'bg-registerBusiness/5',
    hoverBg: 'hover:bg-registerBusiness/5',
    disabled: false
  },
  {
    type: 'service',
    icon: 'event',
    title: 'profile.vendor.step1.types.service.title',
    description: 'profile.vendor.step1.types.service.description',
    subtitle: 'profile.vendor.step1.types.service.subtitle',
    color: 'bg-market',
    borderColor: 'border-[#885dde]',
    bgColor: 'bg-[#885dde]/10',
    hoverBg: 'hover:bg-[#885dde]/10',
    disabled: true,
    comingSoon: {
      title: 'profile.vendor.step1.comingSoon.title',
      subtitle: 'profile.vendor.step1.comingSoon.subtitle'
    }
  },
  {
    type: 'both',
    icon: 'store',
    title: 'profile.vendor.step1.types.both.title',
    description: 'profile.vendor.step1.types.both.description',
    subtitle: 'profile.vendor.step1.types.both.subtitle',
    color: 'bg-[#885dde]',
    borderColor: 'border-[#885dde]',
    bgColor: 'bg-[#885dde]/10',
    hoverBg: 'hover:bg-[#885dde]/10',
    disabled: true,
    comingSoon: {
      title: 'profile.vendor.step1.comingSoon.title',
      subtitle: 'profile.vendor.step1.comingSoon.subtitle'
    }
  }
];

export const REGISTRATION_STEPS: RegistrationStep[] = [
  { step: 1, label: 'profile.vendor.steps.type', completed: false },
  { step: 2, label: 'profile.vendor.steps.details', completed: false },
  { step: 3, label: 'profile.vendor.steps.verify', completed: false }
];

export const VENDOR_FEATURES: string[] = [
  'profile.vendor.step1.features.unlimited',
  'profile.vendor.step1.features.management',
  'profile.vendor.step1.features.payment',
  'profile.vendor.step1.features.support'
];

export const VENDOR_TERMS_PARAGRAPHS: string[] = [
  'profile.vendor.step3.termsText1',
  'profile.vendor.step3.termsText2',
  'profile.vendor.step3.termsText3',
  'profile.vendor.step3.termsText4'
];

export interface ReadyMessageElement {
  type: 'title' | 'text' | 'contact';
  translationKey: string;
  className: string;
}

export const READY_MESSAGE_ELEMENTS: ReadyMessageElement[] = [
  {
    type: 'title',
    translationKey: 'profile.vendor.step3.readyTitle',
    className: 'text-3xl font-black text-gray-900 mb-3 uppercase'
  },
  {
    type: 'text',
    translationKey: 'profile.vendor.step3.readyText',
    className: 'text-gray-700 mb-6 text-lg'
  },
  {
    type: 'contact',
    translationKey: 'profile.vendor.step3.contact',
    className: 'text-sm text-gray-600'
  }
];
