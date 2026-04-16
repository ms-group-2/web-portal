export interface SwapItem {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  swap_item_title: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  is_locked: boolean;
  location?: string;
  postedBy?: string;
  postedDate?: string;
  featured?: boolean;
}

export interface HeroSwap {
  id: string;
  title: string;
  image: string;
  wantInReturn: string;
  postedBy: string;
  location: string;
  badge: string;
}

export interface TrendingSwap {
  id: string;
  image: string;
  title: string;
  wants: string;
  views: number;
  hot: boolean;
}

export interface AiMatch {
  id: string;
  image: string;
  title: string;
  matchScore: number;
  reason: string;
}

export interface RecentTrade {
  user1: string;
  item1: string;
  image1: string;
  user2: string;
  item2: string;
  image2: string;
  time: string;
  rating: number;
}

export interface LiveActivity {
  id: string;
  type: 'swap' | 'new' | 'match';
  user: string;
  item: string;
  time: string;
}

export interface SwapFormData {
  title: string;
  description: string;
  wantedItem: string;
  images: File[];
}
