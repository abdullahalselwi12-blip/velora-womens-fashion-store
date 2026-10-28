/*
# VELORA Commerce Tables - Part 2

## Overview
Creates commerce tables: carts, cart_items, addresses, orders, order_items,
payments, coupons, and inventory_movements.

## New Tables

### carts
- Supports both authenticated user carts and guest session carts
- user_id for logged-in users, guest_session_id for guests

### cart_items
- Links cart to product variants with quantity

### addresses
- User shipping addresses with default flag
- Full address fields: country, city, region, street, etc.

### orders
- Complete order record with order_number, customer info, address snapshot
- Financial breakdown: subtotal, discount, shipping, tax, grand_total
- Order status, payment status, fulfillment status tracking

### order_items
- Snapshot of product at time of order (name, SKU, size, color, price)
- Preserves order history even if product is later changed/deleted

### payments
- Payment tracking with provider reference
- Never stores card numbers - only provider references

### coupons
- Discount codes with type (percentage/fixed), limits, expiry
- Usage tracking

### inventory_movements
- Audit trail for stock changes
- Links to product variants with quantity change and reason

## Security
- RLS on all tables
- Cart: users manage own cart, guest cart via session ID
- Orders: users can read own orders, admin can see all
- Coupons: public read of active coupons, admin manages
- Addresses: users manage own addresses
- Inventory movements: admin only
- All write operations for orders go through SECURITY DEFINER function (created in later migration)
*/

-- ============ CARTS ============
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_guest_session_id ON public.carts(guest_session_id);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO anon, authenticated;

DROP POLICY IF EXISTS "anon_cart_access" ON public.carts;
CREATE POLICY "anon_cart_access" ON public.carts FOR SELECT
  TO anon, authenticated USING (guest_session_id IS NOT NULL AND guest_session_id = current_setting('app.guest_session_id', true));

DROP POLICY IF EXISTS "user_cart_access" ON public.carts;
CREATE POLICY "user_cart_access" ON public.carts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "anon_insert_cart" ON public.carts;
CREATE POLICY "anon_insert_cart" ON public.carts FOR INSERT
  TO anon, authenticated WITH CHECK (guest_session_id IS NOT NULL);

DROP POLICY IF EXISTS "user_insert_cart" ON public.carts;
CREATE POLICY "user_insert_cart" ON public.carts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "anon_update_cart" ON public.carts;
CREATE POLICY "anon_update_cart" ON public.carts FOR UPDATE
  TO anon, authenticated USING (guest_session_id IS NOT NULL) WITH CHECK (guest_session_id IS NOT NULL);

DROP POLICY IF EXISTS "user_update_cart" ON public.carts;
CREATE POLICY "user_update_cart" ON public.carts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "anon_delete_cart" ON public.carts;
CREATE POLICY "anon_delete_cart" ON public.carts FOR DELETE
  TO anon, authenticated USING (guest_session_id IS NOT NULL);

DROP POLICY IF EXISTS "user_delete_cart" ON public.carts;
CREATE POLICY "user_delete_cart" ON public.carts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ CART_ITEMS ============
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(product_variant_id);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO anon, authenticated;

DROP POLICY IF EXISTS "anon_cart_items_access" ON public.cart_items;
CREATE POLICY "anon_cart_items_access" ON public.cart_items FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.guest_session_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "user_cart_items_access" ON public.cart_items;
CREATE POLICY "user_cart_items_access" ON public.cart_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "anon_cart_items_insert" ON public.cart_items;
CREATE POLICY "anon_cart_items_insert" ON public.cart_items FOR INSERT
  TO anon, authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.guest_session_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "user_cart_items_insert" ON public.cart_items;
CREATE POLICY "user_cart_items_insert" ON public.cart_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "anon_cart_items_update" ON public.cart_items;
CREATE POLICY "anon_cart_items_update" ON public.cart_items FOR UPDATE
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.guest_session_id IS NOT NULL)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.guest_session_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "user_cart_items_update" ON public.cart_items;
CREATE POLICY "user_cart_items_update" ON public.cart_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "anon_cart_items_delete" ON public.cart_items;
CREATE POLICY "anon_cart_items_delete" ON public.cart_items FOR DELETE
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.guest_session_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "user_cart_items_delete" ON public.cart_items;
CREATE POLICY "user_cart_items_delete" ON public.cart_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
  );

-- ============ ADDRESSES ============
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  phone text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  region text,
  street_address text NOT NULL,
  additional_details text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;

DROP POLICY IF EXISTS "select_own_addresses" ON public.addresses;
CREATE POLICY "select_own_addresses" ON public.addresses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_addresses" ON public.addresses;
CREATE POLICY "insert_own_addresses" ON public.addresses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_addresses" ON public.addresses;
CREATE POLICY "update_own_addresses" ON public.addresses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_addresses" ON public.addresses;
CREATE POLICY "delete_own_addresses" ON public.addresses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  shipping_address_snapshot jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_total numeric(10,2) NOT NULL DEFAULT 0,
  shipping_total numeric(10,2) NOT NULL DEFAULT 0,
  tax_total numeric(10,2) NOT NULL DEFAULT 0,
  grand_total numeric(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  payment_method text DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status text NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  fulfillment_status text DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'fulfilled', 'partially_fulfilled')),
  customer_notes text,
  tracking_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.orders TO authenticated;

DROP POLICY IF EXISTS "select_own_orders" ON public.orders;
CREATE POLICY "select_own_orders" ON public.orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_orders" ON public.orders;
CREATE POLICY "admin_select_orders" ON public.orders FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_orders" ON public.orders;
CREATE POLICY "admin_update_orders" ON public.orders FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ ORDER_ITEMS ============
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name_snapshot text NOT NULL,
  sku_snapshot text,
  size_snapshot text,
  color_snapshot text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total numeric(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.order_items TO authenticated;

DROP POLICY IF EXISTS "select_own_order_items" ON public.order_items;
CREATE POLICY "select_own_order_items" ON public.order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_select_order_items" ON public.order_items;
CREATE POLICY "admin_select_order_items" ON public.order_items FOR SELECT
  TO authenticated USING (public.is_admin());

-- ============ PAYMENTS ============
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_reference text,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  safe_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.payments TO authenticated;

DROP POLICY IF EXISTS "select_own_payments" ON public.payments;
CREATE POLICY "select_own_payments" ON public.payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payments.order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_select_payments" ON public.payments;
CREATE POLICY "admin_select_payments" ON public.payments FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_payments" ON public.payments;
CREATE POLICY "admin_update_payments" ON public.payments FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ COUPONS ============
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  minimum_order_amount numeric(10,2) DEFAULT 0,
  maximum_discount numeric(10,2),
  usage_limit int,
  usage_count int DEFAULT 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.coupons TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_coupons" ON public.coupons;
CREATE POLICY "public_read_coupons" ON public.coupons FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_all_coupons" ON public.coupons;
CREATE POLICY "admin_all_coupons" ON public.coupons FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_coupons" ON public.coupons;
CREATE POLICY "admin_insert_coupons" ON public.coupons FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_coupons" ON public.coupons;
CREATE POLICY "admin_update_coupons" ON public.coupons FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_coupons" ON public.coupons;
CREATE POLICY "admin_delete_coupons" ON public.coupons FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ INVENTORY_MOVEMENTS ============
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity_change int NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment', 'order', 'return')),
  reason text,
  reference_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_id ON public.inventory_movements(product_variant_id);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.inventory_movements TO authenticated;

DROP POLICY IF EXISTS "admin_select_inventory_movements" ON public.inventory_movements;
CREATE POLICY "admin_select_inventory_movements" ON public.inventory_movements FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_inventory_movements" ON public.inventory_movements;
CREATE POLICY "admin_insert_inventory_movements" ON public.inventory_movements FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- ============ TRIGGERS ============
DROP TRIGGER IF EXISTS carts_updated_at ON public.carts;
CREATE TRIGGER carts_updated_at BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS cart_items_updated_at ON public.cart_items;
CREATE TRIGGER cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS addresses_updated_at ON public.addresses;
CREATE TRIGGER addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS coupons_updated_at ON public.coupons;
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
