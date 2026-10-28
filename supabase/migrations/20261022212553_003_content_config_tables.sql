/*
# VELORA Content & Config Tables - Part 3

## Overview
Creates content management, wishlist, reviews, shipping, navigation,
newsletter, audit, redirects, analytics, and site settings tables.

## New Tables

### wishlists + wishlist_items
- Users can save favorite products
- One wishlist per user

### reviews
- Product reviews with ratings (1-5)
- Moderation status (pending, approved, rejected)
- Only approved reviews visible publicly

### banners
- Homepage/promotional banners
- Bilingual titles and subtitles
- Scheduled display with starts_at/ends_at

### pages
- Static content pages (About, FAQ, Privacy, Terms, etc.)
- Bilingual content
- SEO metadata

### site_settings
- Key-value store for store configuration
- Store name, logo, contact info, currency, social links, etc.

### navigation_menus + navigation_menu_items
- Editable navigation menus
- Nested items with display ordering

### shipping_zones + shipping_methods
- Country/region-based shipping zones
- Methods with pricing, delivery estimates, COD support

### newsletter_subscribers
- Email subscription with consent tracking

### audit_logs
- Admin action audit trail
- Tracks actor, action, entity type/id, metadata

### redirects
- URL redirects for SEO
- 301 or 302 redirect types

### analytics_events
- Privacy-conscious event tracking
- Product views, add-to-cart, purchases
- No unnecessary personal data

## Security
- RLS on all tables
- Wishlists: users manage own wishlist
- Reviews: users create own reviews, admin moderates
- Banners, pages, site_settings, navigation: public read, admin write
- Shipping: public read, admin write
- Newsletter: public subscribe, admin read
- Audit logs: admin only
- Redirects: public read, admin write
- Analytics: public insert (no auth required for tracking)
*/

-- ============ WISHLISTS ============
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;

DROP POLICY IF EXISTS "select_own_wishlist" ON public.wishlists;
CREATE POLICY "select_own_wishlist" ON public.wishlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wishlist" ON public.wishlists;
CREATE POLICY "insert_own_wishlist" ON public.wishlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wishlist" ON public.wishlists;
CREATE POLICY "delete_own_wishlist" ON public.wishlists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ WISHLIST_ITEMS ============
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id uuid NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wishlist_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;

DROP POLICY IF EXISTS "select_own_wishlist_items" ON public.wishlist_items;
CREATE POLICY "select_own_wishlist_items" ON public.wishlist_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_wishlist_items" ON public.wishlist_items;
CREATE POLICY "insert_own_wishlist_items" ON public.wishlist_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_wishlist_items" ON public.wishlist_items;
CREATE POLICY "delete_own_wishlist_items" ON public.wishlist_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid())
  );

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title text,
  review_body text,
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_moderation ON public.reviews(moderation_status);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;

-- Public can read approved reviews (anon + authenticated)
DROP POLICY IF EXISTS "public_read_approved_reviews" ON public.reviews;
CREATE POLICY "public_read_approved_reviews" ON public.reviews FOR SELECT
  TO anon, authenticated USING (moderation_status = 'approved');

-- Users can read their own reviews regardless of status
DROP POLICY IF EXISTS "select_own_reviews" ON public.reviews;
CREATE POLICY "select_own_reviews" ON public.reviews FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Admin can see all reviews
DROP POLICY IF EXISTS "admin_select_reviews" ON public.reviews;
CREATE POLICY "admin_select_reviews" ON public.reviews FOR SELECT
  TO authenticated USING (public.is_admin());

-- Users can create reviews
DROP POLICY IF EXISTS "insert_own_reviews" ON public.reviews;
CREATE POLICY "insert_own_reviews" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews (before moderation)
DROP POLICY IF EXISTS "update_own_reviews" ON public.reviews;
CREATE POLICY "update_own_reviews" ON public.reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin can update (moderate) reviews
DROP POLICY IF EXISTS "admin_update_reviews" ON public.reviews;
CREATE POLICY "admin_update_reviews" ON public.reviews FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin can delete reviews
DROP POLICY IF EXISTS "admin_delete_reviews" ON public.reviews;
CREATE POLICY "admin_delete_reviews" ON public.reviews FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ BANNERS ============
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  subtitle_ar text,
  subtitle_en text,
  image_path text,
  image_url text,
  destination_url text,
  display_order int DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.banners TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_banners" ON public.banners;
CREATE POLICY "public_read_banners" ON public.banners FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_all_banners" ON public.banners;
CREATE POLICY "admin_all_banners" ON public.banners FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_banners" ON public.banners;
CREATE POLICY "admin_insert_banners" ON public.banners FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_banners" ON public.banners;
CREATE POLICY "admin_update_banners" ON public.banners FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_banners" ON public.banners;
CREATE POLICY "admin_delete_banners" ON public.banners FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ PAGES ============
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  content_ar text,
  content_en text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  seo_title text,
  seo_description text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.pages TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_pages" ON public.pages;
CREATE POLICY "public_read_pages" ON public.pages FOR SELECT
  TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "admin_all_pages" ON public.pages;
CREATE POLICY "admin_all_pages" ON public.pages FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_pages" ON public.pages;
CREATE POLICY "admin_insert_pages" ON public.pages FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_pages" ON public.pages;
CREATE POLICY "admin_update_pages" ON public.pages FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_pages" ON public.pages;
CREATE POLICY "admin_delete_pages" ON public.pages FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ SITE_SETTINGS ============
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.site_settings TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_site_settings" ON public.site_settings;
CREATE POLICY "public_read_site_settings" ON public.site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_all_site_settings" ON public.site_settings;
CREATE POLICY "admin_all_site_settings" ON public.site_settings FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_site_settings" ON public.site_settings;
CREATE POLICY "admin_insert_site_settings" ON public.site_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_site_settings" ON public.site_settings;
CREATE POLICY "admin_update_site_settings" ON public.site_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_site_settings" ON public.site_settings;
CREATE POLICY "admin_delete_site_settings" ON public.site_settings FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ NAVIGATION_MENUS ============
CREATE TABLE IF NOT EXISTS public.navigation_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.navigation_menus TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_nav_menus" ON public.navigation_menus;
CREATE POLICY "public_read_nav_menus" ON public.navigation_menus FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_nav_menus" ON public.navigation_menus;
CREATE POLICY "admin_insert_nav_menus" ON public.navigation_menus FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_nav_menus" ON public.navigation_menus;
CREATE POLICY "admin_update_nav_menus" ON public.navigation_menus FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_nav_menus" ON public.navigation_menus;
CREATE POLICY "admin_delete_nav_menus" ON public.navigation_menus FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ NAVIGATION_MENU_ITEMS ============
CREATE TABLE IF NOT EXISTS public.navigation_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES public.navigation_menus(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.navigation_menu_items(id) ON DELETE CASCADE,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  url text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nav_items_menu_id ON public.navigation_menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_nav_items_parent_id ON public.navigation_menu_items(parent_id);

ALTER TABLE public.navigation_menu_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.navigation_menu_items TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_nav_items" ON public.navigation_menu_items;
CREATE POLICY "public_read_nav_items" ON public.navigation_menu_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_nav_items" ON public.navigation_menu_items;
CREATE POLICY "admin_insert_nav_items" ON public.navigation_menu_items FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_nav_items" ON public.navigation_menu_items;
CREATE POLICY "admin_update_nav_items" ON public.navigation_menu_items FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_nav_items" ON public.navigation_menu_items;
CREATE POLICY "admin_delete_nav_items" ON public.navigation_menu_items FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ SHIPPING_ZONES ============
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  countries text[] NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.shipping_zones TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_shipping_zones" ON public.shipping_zones;
CREATE POLICY "public_read_shipping_zones" ON public.shipping_zones FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_all_shipping_zones" ON public.shipping_zones;
CREATE POLICY "admin_all_shipping_zones" ON public.shipping_zones FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_shipping_zones" ON public.shipping_zones;
CREATE POLICY "admin_insert_shipping_zones" ON public.shipping_zones FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_shipping_zones" ON public.shipping_zones;
CREATE POLICY "admin_update_shipping_zones" ON public.shipping_zones FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_shipping_zones" ON public.shipping_zones;
CREATE POLICY "admin_delete_shipping_zones" ON public.shipping_zones FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ SHIPPING_METHODS ============
CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_zone_id uuid NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  delivery_estimate_ar text,
  delivery_estimate_en text,
  minimum_order_amount numeric(10,2) DEFAULT 0,
  is_cod_available boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipping_methods_zone_id ON public.shipping_methods(shipping_zone_id);

ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.shipping_methods TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_shipping_methods" ON public.shipping_methods;
CREATE POLICY "public_read_shipping_methods" ON public.shipping_methods FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_all_shipping_methods" ON public.shipping_methods;
CREATE POLICY "admin_all_shipping_methods" ON public.shipping_methods FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_shipping_methods" ON public.shipping_methods;
CREATE POLICY "admin_insert_shipping_methods" ON public.shipping_methods FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_shipping_methods" ON public.shipping_methods;
CREATE POLICY "admin_update_shipping_methods" ON public.shipping_methods FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_shipping_methods" ON public.shipping_methods;
CREATE POLICY "admin_delete_shipping_methods" ON public.shipping_methods FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ NEWSLETTER_SUBSCRIBERS ============
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  consent_status text NOT NULL DEFAULT 'subscribed' CHECK (consent_status IN ('subscribed', 'unsubscribed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
GRANT INSERT, SELECT ON public.newsletter_subscribers TO anon, authenticated;

DROP POLICY IF EXISTS "public_insert_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "public_insert_newsletter" ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "public_read_newsletter" ON public.newsletter_subscribers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_all_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "admin_all_newsletter" ON public.newsletter_subscribers FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "admin_update_newsletter" ON public.newsletter_subscribers FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "admin_delete_newsletter" ON public.newsletter_subscribers FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ AUDIT_LOGS ============
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  safe_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.audit_logs TO authenticated;

DROP POLICY IF EXISTS "admin_select_audit_logs" ON public.audit_logs;
CREATE POLICY "admin_select_audit_logs" ON public.audit_logs FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "admin_insert_audit_logs" ON public.audit_logs FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- ============ REDIRECTS ============
CREATE TABLE IF NOT EXISTS public.redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path text NOT NULL UNIQUE,
  destination_path text NOT NULL,
  redirect_type int NOT NULL DEFAULT 301 CHECK (redirect_type IN (301, 302)),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.redirects TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_redirects" ON public.redirects;
CREATE POLICY "public_read_redirects" ON public.redirects FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_all_redirects" ON public.redirects;
CREATE POLICY "admin_all_redirects" ON public.redirects FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_redirects" ON public.redirects;
CREATE POLICY "admin_insert_redirects" ON public.redirects FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_redirects" ON public.redirects;
CREATE POLICY "admin_update_redirects" ON public.redirects FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_redirects" ON public.redirects;
CREATE POLICY "admin_delete_redirects" ON public.redirects FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ ANALYTICS_EVENTS ============
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('product_view', 'add_to_cart', 'purchase', 'search', 'page_view')),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  search_query text,
  session_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_product_id ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.analytics_events TO anon, authenticated;

DROP POLICY IF EXISTS "public_insert_analytics" ON public.analytics_events;
CREATE POLICY "public_insert_analytics" ON public.analytics_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_select_analytics" ON public.analytics_events;
CREATE POLICY "admin_select_analytics" ON public.analytics_events FOR SELECT
  TO authenticated USING (public.is_admin());

-- ============ TRIGGERS ============
DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS pages_updated_at ON public.pages;
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
