export interface OrderItemResponse {
  id: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  product_title?: string;
  product_image_url?: string;
}

export interface OrderResponse {
  id: string;
  user_id: string;
  items: OrderItemResponse[];
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentResponse {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  provider_payment_id: string;
  redirect_url: string;
  created_at: string;
}

export interface OrderWithPaymentResponse extends OrderResponse {
  payment: PaymentResponse;
}

export interface OrderPaginatedResponse {
  items: OrderResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
