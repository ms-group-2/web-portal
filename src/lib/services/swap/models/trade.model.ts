export interface TradeChainItem {
  id: number;
  user_id: string;
  from_item_id: string;
  to_item_id: string;
  status: string;
}

export interface TradeChain {
  id: string;
  status: string;
  created_at: string;
  expires_at: string;
  items: TradeChainItem[];
}

export interface VoteRequest {
  accept: boolean;
}
