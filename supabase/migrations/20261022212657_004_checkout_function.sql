/*
# VELORA Checkout Function - Atomic Order Creation

## Overview
Creates a SECURITY DEFINER function `create_order` that handles the entire
checkout process atomically. This is the ONLY way orders are created.

## What It Does
1. Validates all product variants exist and are active
2. Validates stock availability for each item
3. Calculates prices server-side (never trusts client prices)
4. Validates and applies coupon if provided
5. Calculates shipping based on method selection
6. Creates order + order_items atomically
7. Decrements inventory (prevents overselling with FOR UPDATE locks)
8. Records inventory movements
9. Increments coupon usage count
10. Returns order with order_number

## Security
- SECURITY DEFINER: runs with elevated privileges
- Only callable by authenticated users
- All prices calculated server-side
- Stock check uses FOR UPDATE lock
*/

CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb,
  p_shipping_address jsonb,
  p_user_id uuid DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_payment_method text DEFAULT 'cod',
  p_coupon_code text DEFAULT NULL,
  p_shipping_method_id uuid DEFAULT NULL,
  p_customer_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_shipping numeric(10,2) := 0;
  v_tax numeric(10,2) := 0;
  v_grand_total numeric(10,2) := 0;
  v_coupon_id uuid;
  v_coupon_type text;
  v_coupon_value numeric(10,2);
  v_coupon_max_discount numeric(10,2);
  v_coupon_min_order numeric(10,2);
  v_coupon_usage_limit int;
  v_coupon_usage_count int;
  v_shipping_price numeric(10,2);
  v_shipping_min_order numeric(10,2);
  v_item jsonb;
  v_variant_id uuid;
  v_quantity int;
  v_product_id uuid;
  v_product_name text;
  v_sku text;
  v_size text;
  v_color text;
  v_unit_price numeric(10,2);
  v_line_total numeric(10,2);
  v_available_stock int;
  v_currency text := 'USD';
BEGIN
  -- Generate order number
  v_order_number := 'VEL-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));

  -- Validate coupon if provided
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    SELECT id, discount_type, discount_value, maximum_discount, minimum_order_amount, usage_limit, usage_count
    INTO v_coupon_id, v_coupon_type, v_coupon_value, v_coupon_max_discount, v_coupon_min_order, v_coupon_usage_limit, v_coupon_usage_count
    FROM public.coupons
    WHERE code = p_coupon_code AND is_active = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (expires_at IS NULL OR expires_at >= now())
      AND (usage_limit IS NULL OR usage_count < usage_limit)
    FOR UPDATE;

    IF v_coupon_id IS NULL THEN
      RETURN jsonb_build_object('error', 'invalid_or_expired_coupon');
    END IF;
  END IF;

  -- Calculate subtotal from items (server-side pricing)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := (v_item->>'product_variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    -- Get variant with stock lock
    SELECT pv.stock_quantity, COALESCE(pv.variant_price, p.sale_price, p.base_price),
           pv.product_id, pv.size, COALESCE(pv.color_name_en, pv.color_name_ar),
           COALESCE(pv.sku, p.sku), COALESCE(p.name_en, p.name_ar), p.currency
    INTO v_available_stock, v_unit_price, v_product_id, v_size, v_color, v_sku, v_product_name, v_currency
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_variant_id AND pv.is_active = true AND p.product_status = 'published'
    FOR UPDATE;

    IF v_unit_price IS NULL THEN
      RETURN jsonb_build_object('error', 'variant_not_found', 'variant_id', v_variant_id);
    END IF;

    IF v_available_stock < v_quantity THEN
      RETURN jsonb_build_object('error', 'insufficient_stock', 'variant_id', v_variant_id, 'available', v_available_stock, 'requested', v_quantity);
    END IF;

    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  -- Validate coupon minimum order
  IF v_coupon_id IS NOT NULL AND v_coupon_min_order > 0 AND v_subtotal < v_coupon_min_order THEN
    RETURN jsonb_build_object('error', 'coupon_minimum_not_met', 'minimum', v_coupon_min_order, 'subtotal', v_subtotal);
  END IF;

  -- Calculate discount
  IF v_coupon_id IS NOT NULL THEN
    IF v_coupon_type = 'percentage' THEN
      v_discount := v_subtotal * (v_coupon_value / 100.0);
      IF v_coupon_max_discount IS NOT NULL AND v_discount > v_coupon_max_discount THEN
        v_discount := v_coupon_max_discount;
      END IF;
    ELSE
      v_discount := LEAST(v_coupon_value, v_subtotal);
    END IF;
  END IF;

  -- Calculate shipping
  IF p_shipping_method_id IS NOT NULL THEN
    SELECT price, minimum_order_amount
    INTO v_shipping_price, v_shipping_min_order
    FROM public.shipping_methods
    WHERE id = p_shipping_method_id AND is_active = true;

    IF v_shipping_price IS NULL THEN
      RETURN jsonb_build_object('error', 'invalid_shipping_method');
    END IF;

    IF v_shipping_min_order > 0 AND (v_subtotal - v_discount) >= v_shipping_min_order THEN
      v_shipping := 0;
    ELSE
      v_shipping := v_shipping_price;
    END IF;
  END IF;

  v_grand_total := v_subtotal - v_discount + v_shipping + v_tax;

  -- Create the order
  INSERT INTO public.orders (
    order_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address_snapshot, subtotal, discount_total, shipping_total,
    tax_total, grand_total, currency, payment_method, payment_status,
    order_status, customer_notes
  ) VALUES (
    v_order_number, p_user_id, p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, v_subtotal, v_discount, v_shipping,
    v_tax, v_grand_total, v_currency, p_payment_method,
    'pending', 'confirmed', p_customer_notes
  ) RETURNING id INTO v_order_id;

  -- Create order items and decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := (v_item->>'product_variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    SELECT COALESCE(pv.variant_price, p.sale_price, p.base_price),
           pv.product_id, pv.size, COALESCE(pv.color_name_en, pv.color_name_ar),
           COALESCE(pv.sku, p.sku), COALESCE(p.name_en, p.name_ar)
    INTO v_unit_price, v_product_id, v_size, v_color, v_sku, v_product_name
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_variant_id;

    v_line_total := v_unit_price * v_quantity;

    INSERT INTO public.order_items (
      order_id, product_id, product_variant_id, product_name_snapshot,
      sku_snapshot, size_snapshot, color_snapshot, unit_price, quantity, line_total
    ) VALUES (
      v_order_id, v_product_id, v_variant_id, v_product_name,
      v_sku, v_size, v_color, v_unit_price, v_quantity, v_line_total
    );

    -- Decrement stock
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_quantity
    WHERE id = v_variant_id;

    -- Record inventory movement
    INSERT INTO public.inventory_movements (
      product_variant_id, quantity_change, movement_type, reason, reference_id, created_by
    ) VALUES (
      v_variant_id, -v_quantity, 'order', 'Order ' || v_order_number, v_order_id, p_user_id
    );
  END LOOP;

  -- Increment coupon usage
  IF v_coupon_id IS NOT NULL THEN
    UPDATE public.coupons SET usage_count = usage_count + 1 WHERE id = v_coupon_id;
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'shipping', v_shipping,
    'tax', v_tax,
    'grand_total', v_grand_total,
    'currency', v_currency
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order(text, text, jsonb, jsonb, uuid, text, text, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, jsonb, jsonb, uuid, text, text, text, uuid, text) TO authenticated;

-- Function to promote user to admin (only existing admins can call)
CREATE OR REPLACE FUNCTION public.promote_to_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can promote other users';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.promote_to_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(uuid) TO authenticated;
