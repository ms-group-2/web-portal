export interface CreateListingRequest {
  title: string;
  swap_item_title: string;
  description: string;
  files: File[];
}

export interface UpdateListingRequest {
  title?: string;
  swap_item_title?: string;
  description?: string;
  photos_to_delete?: string[];
  new_files?: File[];
}

export interface FilterListingsParams {
  q?: string;
  category?: string;
  status?: string;
  min_price?: number;
  max_price?: number;
}
