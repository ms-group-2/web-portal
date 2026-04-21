export interface CreateListingRequest {
  title: string;
  swap_item_title: string;
  description: string;
  price: number;
}

export interface UploadUrlResponse {
  upload_url: string;
  object_path: string;
}

export interface UpdateListingRequest {
  title?: string;
  swap_item_title?: string;
  description?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
