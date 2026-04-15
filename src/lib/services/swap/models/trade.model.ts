export interface TradeParticipant {
  id: string;
  profile_id: string;
  gives_listing_id: string;
  receives_item: string;
  status: string;
}

export interface TradeChain {
  id: string;
  status: string;
  created_at: string;
  expires_at: string;
  participants: TradeParticipant[];
}

export interface VoteRequest {
  accept: boolean;
}
