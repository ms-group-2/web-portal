export interface Product {
  id: number;
  category_id: number;
  title: string;
  description?: string;
  price: number;
  sku: string;
  image_url: string;
  cover_image_url?: string;
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

export interface CategoryWithProducts extends Category {
  products: Product[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CategoriesWithProductsResponse {
  categories: CategoryWithProducts[];
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

export interface FilterOption {
  option_id: number;
  option_value: string;
}

export interface FilterField {
  field_id: number;
  field_name: string;
  is_required: boolean;
  options: FilterOption[];
}

export interface FilterGroup {
  group_id: number;
  group_name: string;
  fields: FilterField[];
}

export interface GetFiltersResponse {
  filters: FilterGroup[];
}
