export interface ListingSpecification {
  attribute_id: number;
  value: string;
}

export interface SwapListing {
  id: string;
  owner_id: string;
  category_id: number | null;
  title: string;
  swap_item_title: string;
  description: string;
  price: number;
  location: string;
  condition: string;
  status: string;
  boost_tier: string | null;
  boost_expires_at: string | null;
  stickers: string[];
  specifications: ListingSpecification[];
  desired_category_ids: number[];
  created_at: string;
  updated_at: string;
  photos: string[];
}
