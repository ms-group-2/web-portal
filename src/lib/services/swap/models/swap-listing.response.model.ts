import { SwapListing } from './swap-listing.model';

export interface PaginatedListingsResponse {
  items: SwapListing[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
