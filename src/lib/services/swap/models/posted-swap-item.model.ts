export interface PostedSwapItem {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  wantedItem: string;
  photos: string[];
  status: string;
  createdAt: string;
  location?: string;
  condition?: string;
}
