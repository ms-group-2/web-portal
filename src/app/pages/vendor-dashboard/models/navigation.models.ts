export type TabType = 'dashboard' | 'products' | 'orders' | 'settings';

export interface NavigationTab {
  id: TabType;
  icon: string;
  translationKey: string;
}
