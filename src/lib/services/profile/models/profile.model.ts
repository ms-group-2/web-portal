export interface Profile {
  id: string;
  email?: string;
  name: string;
  surname: string;
  phone_number: string;
  birth_date: string; // ISO
  avatar_url: string;
  location: string;
  gender: boolean | null;
  bio: string;
  kyc_verified: boolean;
  updated_at: string;
  created_at?: string;
}

export interface VerificationStartResponse {
  session_id: string;
  url: string;
  status: string;
}

export interface UpdateProfileRequest {
  name: string;
  surname: string;
  phone_number?: string | null;
  birth_date?: string | null; //  YYYY-MM-DD
  location?: string | null;
  gender?: boolean | null;
  bio?: string | null;
}

export interface WishlistProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  cover_image_url: string;
  stock_quantity: number;
  sku: string;
  brand: {
    id: number;
    name: string;
    logo_url?: string;
  };
  images: string[];
}

export interface WishlistResponse {
  items: WishlistProduct[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface WishlistToggleRequest {
  product_id: number;
}

export interface WishlistToggleResponse {
  product_id: number;
  is_wishlisted: boolean;
}

