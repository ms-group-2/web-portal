export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  category: string;
  badge?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string | null;
}

export interface Filters {
  category: string;
  priceRange: string;
  rating: string;
  verifiedOnly: boolean;
  sortBy: string;
}
