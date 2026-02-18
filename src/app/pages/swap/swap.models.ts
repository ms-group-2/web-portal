export interface SwapItem {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  swap_item_title: string; 
  photos: string[]; 
  created_at: string;
  updated_at: string;
  userRating?: number;
  verified?: boolean;
  location?: string;
  distance?: string;
}

export interface SwapFormData {
  title: string;
  description: string;
  wantedItem: string; 
  images: File[];
}
