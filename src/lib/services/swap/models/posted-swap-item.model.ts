export interface PostedSwapItem {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  wantedItem: string;
  photos: string[];
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;

  location?: string;
  valueRange?: string;
  condition?: string;
}
