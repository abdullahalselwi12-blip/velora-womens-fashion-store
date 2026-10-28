/*
# VELORA Core Tables - Part 1

## Overview
Creates the foundational tables for the VELORA e-commerce platform:
profiles, user_roles, categories, products, product_images, and product_variants.

## New Tables

### profiles
- Links to authenticated users via auth.users
- Stores full_name, phone, preferred_language, avatar_url
- Timestamps for created_at and updated_at

### user_roles
- Maps users to roles (admin, customer)
- Used for admin access control via SECURITY DEFINER function

### categories
- Supports nested categories via parent_id self-reference
- Bilingual names, descriptions, SEO fields
- Display ordering and active status

### products
- Full bilingual product information
- Pricing (base_price, sale_price), SKU, brand
- Product status (draft, published, archived)
- Feature flags (is_featured, is_new_arrival, is_best_seller)
- SEO metadata fields

### product_images
- Multiple images per product
- Display ordering and primary image selection
- Bilingual alt text
- Storage path for Supabase Storage integration

### product_variants
- Size and color variants per product
- Individual SKU and stock per variant
- Optional variant-specific pricing
- Active/inactive status

## Security
- RLS enabled on all tables
- Public (anon) can read published products, active categories
- Authenticated users can read/update their own profile
- Admin access controlled via is_admin() SECURITY DEFINER function
- Only admins can write to products, categories, product_images, product_variants
- Auto-creates profile + customer role on signup via trigger
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  preferred_language text DEFAULT 'en',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============ USER_ROLES ============
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  description_ar text,
  description_en text,
  image_url text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  description_ar text,
  description_en text,
  short_description_ar text,
  short_description_en text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2),
  currency text DEFAULT 'USD',
  sku text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand text,
  product_status text NOT NULL DEFAULT 'draft' CHECK (product_status IN ('draft', 'published', 'archived')),
  is_featured boolean DEFAULT false,
  is_new_arrival boolean DEFAULT false,
  is_best_seller boolean DEFAULT false,
  seo_title text,
  seo_description text,
  canonical_url text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(product_status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON public.products(is_new_arrival) WHERE is_new_arrival = true;
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON public.products(is_best_seller) WHERE is_best_seller = true;

-- ============ PRODUCT_IMAGES ============
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path text,
  image_url text,
  alt_text_ar text,
  alt_text_en text,
  display_order int DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images(is_primary) WHERE is_primary = true;

-- ============ PRODUCT_VARIANTS ============
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text,
  color_name_ar text,
  color_name_en text,
  color_code text,
  sku text,
  stock_quantity int NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  variant_price numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- ============ HELPER FUNCTION: is_admin ============
-- Must be created AFTER user_roles table exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============ RLS: PROFILES ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ RLS: USER_ROLES ============
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "select_own_roles" ON public.user_roles;
CREATE POLICY "select_own_roles" ON public.user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- ============ RLS: CATEGORIES ============
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.categories TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_all_categories" ON public.categories;
CREATE POLICY "admin_all_categories" ON public.categories FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_categories" ON public.categories;
CREATE POLICY "admin_insert_categories" ON public.categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_categories" ON public.categories;
CREATE POLICY "admin_update_categories" ON public.categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_categories" ON public.categories;
CREATE POLICY "admin_delete_categories" ON public.categories FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ RLS: PRODUCTS ============
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.products TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products" ON public.products FOR SELECT
  TO anon, authenticated USING (product_status = 'published');

DROP POLICY IF EXISTS "admin_all_products" ON public.products;
CREATE POLICY "admin_all_products" ON public.products FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_products" ON public.products;
CREATE POLICY "admin_insert_products" ON public.products FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_products" ON public.products;
CREATE POLICY "admin_update_products" ON public.products FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_products" ON public.products;
CREATE POLICY "admin_delete_products" ON public.products FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ RLS: PRODUCT_IMAGES ============
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.product_images TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_product_images" ON public.product_images;
CREATE POLICY "public_read_product_images" ON public.product_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_all_product_images" ON public.product_images;
CREATE POLICY "admin_all_product_images" ON public.product_images FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_product_images" ON public.product_images;
CREATE POLICY "admin_insert_product_images" ON public.product_images FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_product_images" ON public.product_images;
CREATE POLICY "admin_update_product_images" ON public.product_images FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_product_images" ON public.product_images;
CREATE POLICY "admin_delete_product_images" ON public.product_images FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ RLS: PRODUCT_VARIANTS ============
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.product_variants TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_product_variants" ON public.product_variants;
CREATE POLICY "public_read_product_variants" ON public.product_variants FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_all_product_variants" ON public.product_variants;
CREATE POLICY "admin_all_product_variants" ON public.product_variants FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_product_variants" ON public.product_variants;
CREATE POLICY "admin_insert_product_variants" ON public.product_variants FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_product_variants" ON public.product_variants;
CREATE POLICY "admin_update_product_variants" ON public.product_variants FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_product_variants" ON public.product_variants;
CREATE POLICY "admin_delete_product_variants" ON public.product_variants FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ TRIGGERS ============
-- Auto-create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS product_variants_updated_at ON public.product_variants;
CREATE TRIGGER product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
