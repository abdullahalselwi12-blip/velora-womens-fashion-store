export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export interface Category {
  id: string;
  parent_id: string | null;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string | null;
  image_url: string | null;
  alt_text_ar: string | null;
  alt_text_en: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color_name_ar: string | null;
  color_name_en: string | null;
  color_code: string | null;
  sku: string | null;
  stock_quantity: number;
  variant_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  short_description_ar: string | null;
  short_description_en: string | null;
  base_price: number;
  sale_price: number | null;
  currency: string;
  sku: string | null;
  category_id: string | null;
  brand: string | null;
  product_status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
  category?: Category;
}

export interface Cart {
  id: string;
  user_id: string | null;
  guest_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product_variant?: ProductVariant;
  product?: Product;
}

export interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  country: string;
  city: string;
  region: string | null;
  street_address: string;
  additional_details: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_address_snapshot: Record<string, unknown>;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  currency: string;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  fulfillment_status: string;
  customer_notes: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_variant_id: string | null;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  size_snapshot: string | null;
  color_snapshot: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  image_url: string | null;
  destination_url: string | null;
  display_order: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  content_ar: string | null;
  content_en: string | null;
  status: 'draft' | 'published';
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_title: string | null;
  review_body: string | null;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ShippingZone {
  id: string;
  name_ar: string;
  name_en: string;
  countries: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingMethod {
  id: string;
  shipping_zone_id: string;
  name_ar: string;
  name_en: string;
  price: number;
  delivery_estimate_ar: string | null;
  delivery_estimate_en: string | null;
  minimum_order_amount: number;
  is_cod_available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  preferred_language: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_variant_id: string;
  quantity_change: number;
  movement_type: 'stock_in' | 'stock_out' | 'adjustment' | 'order' | 'return';
  reason: string | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface NavMenuItem {
  id: string;
  menu_id: string;
  parent_id: string | null;
  label_ar: string;
  label_en: string;
  url: string | null;
  display_order: number;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  consent_status: 'subscribed' | 'unsubscribed';
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  safe_metadata: Record<string, unknown>;
  created_at: string;
}
