export interface CreateListingRequest {
  title: string;
  swap_item_title: string;
  description: string;
  price: number;
  category_id?: number;
  location?: string;
  condition?: string;
  specifications?: { attribute_id: number; value: string }[];
  desired_category_ids?: number[];
}

export interface UpdateListingRequest {
  title?: string;
  swap_item_title?: string;
  description?: string;
  price?: number;
  category_id?: number;
  location?: string;
  specifications?: { attribute_id: number; value: string }[];
  desired_category_ids?: number[];
}

export interface UploadUrlResponse {
  upload_url: string;
  object_path: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
