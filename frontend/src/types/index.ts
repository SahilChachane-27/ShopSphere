export type UserRole = 'ADMIN' | 'SELLER' | 'CUSTOMER';

export type SellerApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'COD';

export type PaymentMethod = 'CARD' | 'UPI' | 'COD';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  title: string;
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at?: string;
}

export interface SellerProfile {
  id: number;
  user_id: number;
  store_name: string;
  store_description?: string;
  store_logo?: string;
  store_banner?: string;
  business_email: string;
  business_phone: string;
  tax_id?: string;
  approval_status: SellerApprovalStatus;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
  subcategories?: Category[];
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  size?: string;
  color?: string;
  price_override?: number;
  stock: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  seller_id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  brand: string;
  sku: string;
  price: number;
  discount_price?: number;
  tax_percent: number;
  status: ProductStatus;
  rating_avg: number;
  review_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
  category?: Category;
  seller?: SellerProfile;
  stock_count?: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface Inventory {
  id: number;
  product_id: number;
  variant_id?: number;
  current_stock: number;
  reserved_stock: number;
  sold_quantity: number;
  min_threshold: number;
  available_stock: number;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  product: Product;
  created_at: string;
}

export interface Wishlist {
  id: number;
  user_id: number;
  items: WishlistItem[];
}

export interface OrderItem {
  id: number;
  seller_id: number;
  product_id: number;
  variant_id?: number;
  product_name: string;
  variant_name?: string;
  price: number;
  discount: number;
  quantity: number;
  total_price: number;
  status: OrderStatus;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  address_id?: number;
  shipping_address_json: Address;
  subtotal: number;
  discount: number;
  tax: number;
  shipping_fee: number;
  total: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

export interface Coupon {
  id: number;
  seller_id?: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order_value: number;
  maximum_discount?: number;
  start_date: string;
  expiry_date: string;
  usage_limit: number;
  per_user_limit: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title: string;
  comment: string;
  images_json?: string[];
  seller_response?: string;
  seller_responded_at?: string;
  created_at: string;
  user?: User;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardMetrics {
  total_sales: number;
  total_orders: number;
  total_products: number;
  total_customers?: number;
  total_sellers?: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
  low_stock_count: number;
}

export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
