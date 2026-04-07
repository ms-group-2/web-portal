export type BusinessType = 'seller' | 'service' | 'both';

export interface VendorProfile {
  supplier_id: number;
  user_id: string;
  identification_number: string;
  name: string;
  legal_address: string;
  contact_phone: string;
  contact_email: string;
  bank_account_number: string;
  status?: string;
  business_type?: BusinessType;
}

export interface VendorRegistration {
  identification_number: string;
  name: string;
  legal_address: string;
  contact_phone: string;
  contact_email: string;
  bank_account_number: string;
  business_type?: BusinessType;
}

export interface RegistrationStep {
  step: number;
  label: string;
  completed: boolean;
}

export interface BusinessTypeOption {
  type: BusinessType;
  icon: string;
  title: string;
  description: string;
  subtitle: string;
  color: string;
  borderColor: string;
  bgColor: string;
  hoverBg: string;
  disabled: boolean;
  comingSoon?: {
    title: string;
    subtitle: string;
  };
}

export interface VendorProductCreate {
  category_id: number;
  brand_id: number;
  title: string;
  description: string;
  price: number;
  quantity: number;
  sku: string;
  cover_image_url?: string;
  images?: string[];
  specifications: Array<{
    field_id: number;
    option_id: number;
  }>;
}

export interface VendorProductUpdate {
  category_id?: number;
  brand_id?: number;
  title?: string;
  description?: string;
  price?: number;
  quantity?: number;
  sku?: string;
  cover_image_url?: string;
  images?: string[];
  field_options?: number[];
  specifications?: Array<{
    field_id: number;
    option_id: number;
  }>;
}

// export interface VendorProductsResponse {
//   items: any[]; 
//   total: number;
//   page: number;
//   limit: number;
// }
