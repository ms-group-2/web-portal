export interface SwapRecord {
  id: string;
  profile_id: string;
  type: 'swap_offer' | 'trade_chain' | 'proposal';
  source_id: string;
  given_item_id: string;
  received_item_id: string;
  partner_profile_id: string;
  completed_at: string;
}

export interface PaginatedSwapHistoryResponse {
  items: SwapRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SwapHistoryStatsResponse {
  total: number;
  swap_offer: number;
  trade_chain: number;
  proposal: number;
}
