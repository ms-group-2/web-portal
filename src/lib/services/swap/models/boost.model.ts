export interface ApplyBoostRequest {
  boost_tier?: string;
  boost_days?: number;
  auto_update_days?: number;
  stickers?: string[];
}

export interface BoostPriceBreakdown {
  boost_cost: number;
  auto_update_cost: number;
  stickers_cost: number;
  total: number;
}

export interface ApplyBoostResponse {
  listing_id: string;
  price_breakdown: BoostPriceBreakdown;
  boost_tier: string | null;
  boost_expires_at: string | null;
  auto_expired_at: string | null;
  stickers: string[];
}
