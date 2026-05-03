export interface ProposalSessionResponse {
  session_id: string;
  qr_code_base64: string;
  pairing_url: string;
}

export interface ProposalUploadUrlRequest {
  session_id: string;
  filename: string;
}

export interface ProposalUploadUrlResponse {
  upload_url: string;
  object_path: string;
}

export interface ProposalItemRequest {
  title: string;
  temp_path: string;
}

export interface CreateProposalRequest {
  session_id: string;
  target_listing_id: string;
  message: string;
  items: ProposalItemRequest[];
}

export interface ProposalItem {
  id: string;
  title: string;
  image_url: string;
  condition: string;
}

export interface ProposalResponse {
  id: string;
  profile_id: string;
  target_listing_id: string;
  message: string;
  status: string;
  created_at: string;
  items: ProposalItem[];
}

export interface ProposalItemDraft {
  temp_path: string;
  title: string;
  previewUrl?: string;
  fromListing?: boolean;
  listingId?: string;
}
