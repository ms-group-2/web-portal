import { NavigationTab } from '../models/navigation.models';

export const MAIN_NAVIGATION_TABS: NavigationTab[] = [
  { id: 'dashboard', icon: 'ph-squares-four', translationKey: 'vendor.dashboard' },
  { id: 'products', icon: 'ph-package', translationKey: 'vendor.products' },
  { id: 'orders', icon: 'ph-shopping-bag', translationKey: 'vendor.orders' },
];

export const SETTINGS_NAVIGATION_TABS: NavigationTab[] = [
  { id: 'settings', icon: 'ph-gear', translationKey: 'vendor.settings' },
];
