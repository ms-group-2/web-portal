import { SwapListing } from './swap-listing.model';

export interface BoostPackage {
  tier: string;
  daily_price: number;
  sort_priority: number;
  display_zones?: string[];
}

export interface StickerInfo {
  id: number;
  name: string;
  label: string;
  price: number;
}

export interface MonetizationInfoResponse {
  boost_packages: BoostPackage[];
  stickers: StickerInfo[];
  auto_update_daily_price: number;
  extra_listing_price: number;
  free_monthly_listings: number;
}

export interface BoostedListingsResponse {
  super_vip: SwapListing[];
  vip_plus: SwapListing[];
  vip: SwapListing[];
}
