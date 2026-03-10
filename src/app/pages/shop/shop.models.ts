export interface Product {
  id: number;
  category_id: number;
  title: string;
  description?: string;
  price: number;
  sku: string;
  image_url: string;
  images?: string[];
  brand?: {
    id: number;
    name: string;
    logo_url?: string;
  };
  specifications?: Array<{
    group_name: string;
    specifications: Array<{
      name: string;
      value: string;
    }>;
  }>;
  name?: string;
  image?: string;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  badge?: string;
}

export interface Category {
  id: number | string;
  parent_id: number | null;
  name: string;
  slug: string;
  image?: string | null;
  image_url?: string | null;
  has_subcategories: boolean;
  subcategories?: Category[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface Filters {
  category: string;
  priceRange: string;
  rating: string;
  verifiedOnly: boolean;
  sortBy: string;
}
