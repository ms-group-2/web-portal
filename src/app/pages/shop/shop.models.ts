export interface Product {
  id: string;
  category_id?: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  category?: string;
  badge?: string;
}

export interface Category {
  id: number | string;
  parent_id: number | null;
  name: string;
  slug: string;
  image?: string | null;
  image_url?: string | null;
  subcategories?: Category[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface ProductsResponse {
  products: Product[];
}

export interface Filters {
  category: string;
  priceRange: string;
  rating: string;
  verifiedOnly: boolean;
  sortBy: string;
}
