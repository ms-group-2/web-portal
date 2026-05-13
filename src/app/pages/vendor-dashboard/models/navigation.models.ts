export type TabType = 'dashboard' | 'products' | 'orders' | 'import' | 'settings';

export interface NavigationTab {
  id: TabType;
  icon: string;
  translationKey: string;
}
