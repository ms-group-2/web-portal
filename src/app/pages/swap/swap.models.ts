export interface SwapItem {
  id: string;
  owner_id: string;
  category_id: number | null;
  title: string;
  description: string;
  swap_item_title: string;
  price: number;
  location: string;
  condition: string;
  status: string;
  boost_tier: string | null;
  boost_expires_at: string | null;
  stickers: string[];
  specifications: { attribute_id: number; value: string }[];
  desired_category_ids: number[];
  photos: string[];
  created_at: string;
  updated_at: string;
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
  user1Avatar: string;
  item1: string;
  image1: string;
  user2: string;
  user2Avatar: string;
  item2: string;
  image2: string;
  time: string;
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
