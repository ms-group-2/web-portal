export interface CreateSwapOfferRequest {
  receiver_item_id: string;
  sender_item_ids: string[];
  message: string;
}

export interface SwapOfferResponse {
  id: string;
  sender_item_id: string;
  receiver_item_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RespondSwapOfferRequest {
  accept: boolean;
}
