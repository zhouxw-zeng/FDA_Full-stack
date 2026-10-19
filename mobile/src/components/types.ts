export type TabKey = 'ai' | 'home' | 'chat' | 'friends' | 'profile';

export interface TabItem {
  key: TabKey;
  label: string;
  icon: string;
  activeIcon: string;
}
