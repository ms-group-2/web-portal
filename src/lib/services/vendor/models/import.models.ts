export interface ProductResult {
  title: string;
  description: string;
  price: number | null;
  quantity: number | null;
  sku: string;
  category_id: number | null;
  category_name: string;
  brand_id: number | null;
  brand_name: string;
  specifications: { key: string; value: string }[];
  source_row: number;
  raw_data: Record<string, unknown>;
  missing_fields: string[];
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

export interface ImportSummary {
  total_rows: number;
  products_ready: number;
  products_incomplete: number;
  errors: number;
}

export interface ImportError {
  row: number;
  error: string;
}

export interface ImportResponse {
  import_id: string;
  products_ready: ProductResult[];
  products_incomplete: ProductResult[];
  errors: ImportError[];
  summary: ImportSummary;
}

export interface ConfirmRequest {
  products: ProductResult[];
}

export interface ConfirmResponse {
  saved: number;
  failed: number;
  errors: ImportError[];
}

export interface ReferenceCategory {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface ReferenceBrand {
  id: number;
  name: string;
}

export interface ReferenceDataResponse {
  categories: ReferenceCategory[];
  brands: ReferenceBrand[];
}
