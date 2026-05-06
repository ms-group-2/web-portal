export interface SwapWishlistToggleRequest {
  listing_id: string;
}

export interface SwapWishlistToggleResponse {
  listing_id: string;
  is_wishlisted: boolean;
}

export interface SwapWishlistResponse {
  items: string[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
