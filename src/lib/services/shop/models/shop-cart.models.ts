export interface AddToCartRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItemResponse {
  id: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  product_title: string;
  product_image_url: string;
  subtotal: number;
  stock_quantity: number;
}

export interface CartResponse {
  id: string;
  user_id: string;
  items: CartItemResponse[];
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface CheckoutResponse {
  cart_id: string;
  status: string;
  total: number;
  item_count: number;
  message: string;
}

export interface MessageResponse {
  message: string;
}
