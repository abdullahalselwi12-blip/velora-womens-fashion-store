/*
# VELORA Seed Data - Categories, Products, Banners, Settings

## Overview
Seeds the database with:
- 9 women's fashion categories (bilingual)
- 12 sample products with images and variants
- 3 homepage banners
- Site settings (store name, contact, currency, social links)
- Shipping zone and method
- Static pages (About, FAQ, Privacy, Terms, Shipping & Returns)
- Navigation menu

All sample products are clearly marked as demonstration content.
*/

-- ============ CATEGORIES ============
INSERT INTO public.categories (name_ar, name_en, slug, description_ar, description_en, display_order, is_active)
VALUES
  ('فساتين أنيقة', 'Elegant Dresses', 'elegant-dresses', 'فساتين أنيقة لكل مناسبة', 'Elegant dresses for every occasion', 1, true),
  ('عبايات وأزياء محتشمة', 'Abayas & Modest Fashion', 'abayas-modest-fashion', 'عبايات وأزياء محتشمة بتصاميم عصرية', 'Modern modest fashion and abayas', 2, true),
  ('بلوزات وقمصان', 'Tops & Blouses', 'tops-blouses', 'بلوزات وقمصان أنيقة', 'Stylish tops and blouses', 3, true),
  ('بناطيل وتنانير', 'Trousers & Skirts', 'trousers-skirts', 'بناطيل وتنانير عصرية', 'Modern trousers and skirts', 4, true),
  ('أطقم قطعتين', 'Two-Piece Outfits', 'two-piece-outfits', 'أطقم قطعتين متناسقة', 'Coordinated two-piece outfits', 5, true),
  ('جاكيتات ومعاطف', 'Jackets & Coats', 'jackets-coats', 'جاكيتات ومعاطف أنيقة', 'Elegant jackets and coats', 6, true),
  ('حقائب', 'Handbags', 'handbags', 'حقائب نسائية أنيقة', 'Elegant women''s handbags', 7, true),
  ('أحذية نسائية', 'Women''s Shoes', 'womens-shoes', 'أحذية نسائية عصرية', 'Stylish women''s shoes', 8, true),
  ('إكسسوارات', 'Fashion Accessories', 'fashion-accessories', 'إكسسوارات أزياء متنوعة', 'Fashion accessories', 9, true)
ON CONFLICT (slug) DO NOTHING;

-- ============ PRODUCTS ============
-- Product 1: Elegant Black Dress
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, sale_price, currency, sku, category_id, brand, product_status, is_featured, is_new_arrival, is_best_seller, published_at)
SELECT 'فستان أسود أنيق', 'Elegant Black Dress', 'elegant-black-dress',
  'فستان أسود أنيق بقصّة كلاسيكية يناسب جميع المناسبات. مصنوع من أقمشة عالية الجودة.',
  'A timeless elegant black dress with a classic silhouette suitable for all occasions. Crafted from premium fabrics.',
  'فستان أسود كلاسيكي', 'Classic black dress',
  89.00, 69.00, 'USD', 'VEL-DR-001', c.id, 'VELORA', 'published', true, true, true, now()
FROM public.categories c WHERE c.slug = 'elegant-dresses'
ON CONFLICT (slug) DO NOTHING;

-- Product 2: Blue Evening Dress
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, currency, sku, category_id, brand, product_status, is_featured, is_new_arrival, published_at)
SELECT 'فستان سهرة أزرق', 'Blue Evening Dress', 'blue-evening-dress',
  'فستان سهرة أزرق بتصميم انسيابي يمنحك إطلالة مذهلة.',
  'A flowing blue evening dress that gives you a stunning look.',
  'فستان سهرة انسيابي', 'Flowing evening dress',
  120.00, 'USD', 'VEL-DR-002', c.id, 'VELORA', 'published', true, true, now()
FROM public.categories c WHERE c.slug = 'elegant-dresses'
ON CONFLICT (slug) DO NOTHING;

-- Product 3: White Summer Dress
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, currency, sku, category_id, brand, product_status, is_featured, is_best_seller, published_at)
SELECT 'فستان صيفي أبيض', 'White Summer Dress', 'white-summer-dress',
  'فستان صيفي أبيض خفيف وأنيق مثالي للإطلالات النهارية.',
  'A light and elegant white summer dress perfect for daytime looks.',
  'فستان صيفي خفيف', 'Light summer dress',
  75.00, 'USD', 'VEL-DR-003', c.id, 'VELORA', 'published', true, true, now()
FROM public.categories c WHERE c.slug = 'elegant-dresses'
ON CONFLICT (slug) DO NOTHING;

-- Product 4: Red Cocktail Dress
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, sale_price, currency, sku, category_id, brand, product_status, is_featured, is_new_arrival, published_at)
SELECT 'فستان كوكتيل أحمر', 'Red Cocktail Dress', 'red-cocktail-dress',
  'فستان كوكتيل أحمر جريء يلفت الأنظار في كل مناسبة.',
  'A bold red cocktail dress that turns heads at every event.',
  'فستان أحمر جريء', 'Bold red dress',
  95.00, 75.00, 'USD', 'VEL-DR-004', c.id, 'VELORA', 'published', true, true, now()
FROM public.categories c WHERE c.slug = 'elegant-dresses'
ON CONFLICT (slug) DO NOTHING;

-- Product 5: Embroidered Abaya
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, currency, sku, category_id, brand, product_status, is_featured, is_best_seller, published_at)
SELECT 'عباية مطرزة', 'Embroidered Abaya', 'embroidered-abaya',
  'عباية سوداء مطرزة بتفاصيل فاخرة تجمع بين الأصالة والعصرية.',
  'A black abaya with luxurious embroidery details combining heritage and modernity.',
  'عباية مطرزة فاخرة', 'Luxurious embroidered abaya',
  150.00, 'USD', 'VEL-AB-001', c.id, 'VELORA', 'published', true, true, now()
FROM public.categories c WHERE c.slug = 'abayas-modest-fashion'
ON CONFLICT (slug) DO NOTHING;

-- Product 6: Modern Blue Abaya
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, sale_price, currency, sku, category_id, brand, product_status, is_new_arrival, published_at)
SELECT 'عباية زرقاء عصرية', 'Modern Blue Abaya', 'modern-blue-abaya',
  'عباية زرقاء بتصميم عصري وتفاصيل أنيقة.',
  'A modern blue abaya with elegant details and contemporary design.',
  'عباية زرقاء عصرية', 'Modern blue abaya',
  130.00, 99.00, 'USD', 'VEL-AB-002', c.id, 'VELORA', 'published', true, now()
FROM public.categories c WHERE c.slug = 'abayas-modest-fashion'
ON CONFLICT (slug) DO NOTHING;

-- Product 7: Striped Abaya
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, currency, sku, category_id, brand, product_status, is_featured, published_at)
SELECT 'عباية مخططة', 'Striped Abaya', 'striped-abaya',
  'عباية مخططة بتصميم أنيق ومريح للاستخدام اليومي.',
  'A striped abaya with an elegant and comfortable design for everyday wear.',
  'عباية مخططة أنيقة', 'Elegant striped abaya',
  110.00, 'USD', 'VEL-AB-003', c.id, 'VELORA', 'published', true, now()
FROM public.categories c WHERE c.slug = 'abayas-modest-fashion'
ON CONFLICT (slug) DO NOTHING;

-- Product 8: Elegant Blouse
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, currency, sku, category_id, brand, product_status, is_new_arrival, published_at)
SELECT 'بلوزة أنيقة', 'Elegant Blouse', 'elegant-blouse',
  'بلوزة أنيقة بتصميم عصري تناسب الإطلالات الرسمية والكاجوال.',
  'An elegant blouse with a modern design suitable for formal and casual looks.',
  'بلوزة عصرية', 'Modern blouse',
  45.00, 'USD', 'VEL-TB-001', c.id, 'VELORA', 'published', true, now()
FROM public.categories c WHERE c.slug = 'tops-blouses'
ON CONFLICT (slug) DO NOTHING;

-- Product 9: Ruffle Top
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, sale_price, currency, sku, category_id, brand, product_status, is_best_seller, published_at)
SELECT 'بلوزة بكشاكش', 'Ruffle Top', 'ruffle-top',
  'بلوزة سوداء بكشاكش أنيقة تضيف لمسة أنثوية لإطلالتك.',
  'A black ruffle top that adds a feminine touch to your look.',
  'بلوزة بكشاكش أنيقة', 'Elegant ruffle top',
  38.00, 29.00, 'USD', 'VEL-TB-002', c.id, 'VELORA', 'published', true, now()
FROM public.categories c WHERE c.slug = 'tops-blouses'
ON CONFLICT (slug) DO NOTHING;

-- Product 10: Winter Coat
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, currency, sku, category_id, brand, product_status, is_featured, is_new_arrival, published_at)
SELECT 'معطف شتوي أنيق', 'Elegant Winter Coat', 'elegant-winter-coat',
  'معطف شتوي أنيق بفرو فاخر يمنحك الدفء والأناقة معاً.',
  'An elegant winter coat with luxurious fur trim for warmth and style.',
  'معطف شتوي فاخر', 'Luxurious winter coat',
  180.00, 'USD', 'VEL-JC-001', c.id, 'VELORA', 'published', true, true, now()
FROM public.categories c WHERE c.slug = 'jackets-coats'
ON CONFLICT (slug) DO NOTHING;

-- Product 11: Leather Handbag
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, currency, sku, category_id, brand, product_status, is_featured, is_best_seller, published_at)
SELECT 'حقيبة جلدية أنيقة', 'Elegant Leather Handbag', 'elegant-leather-handbag',
  'حقيبة يد جلدية أنيقة بتصميم كلاسيكي يناسب جميع الإطلالات.',
  'An elegant leather handbag with a classic design for all looks.',
  'حقيبة جلدية كلاسيكية', 'Classic leather handbag',
  65.00, 'USD', 'VEL-HB-001', c.id, 'VELORA', 'published', true, true, now()
FROM public.categories c WHERE c.slug = 'handbags'
ON CONFLICT (slug) DO NOTHING;

-- Product 12: High Heels
INSERT INTO public.products (name_ar, name_en, slug, description_ar, description_en, short_description_ar, short_description_en, base_price, sale_price, currency, sku, category_id, brand, product_status, is_new_arrival, published_at)
SELECT 'حذاء بكعب عالٍ', 'High Heels', 'high-heels',
  'حذاء بكعب عالٍ أنيق يضيف لمسة من الرقي لإطلالتك.',
  'Elegant high heels that add sophistication to your look.',
  'حذاء كعب عالٍ أنيق', 'Elegant high heels',
  55.00, 42.00, 'USD', 'VEL-SH-001', c.id, 'VELORA', 'published', true, now()
FROM public.categories c WHERE c.slug = 'womens-shoes'
ON CONFLICT (slug) DO NOTHING;

-- ============ PRODUCT IMAGES ============
-- Product 1: Elegant Black Dress
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/18731383/pexels-photo-18731383.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'فستان أسود أنيق', 'Elegant black dress', 0, true
FROM public.products WHERE slug = 'elegant-black-dress'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/29124227/pexels-photo-29124227.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'فستان أسود', 'Black dress', 1, false
FROM public.products WHERE slug = 'elegant-black-dress'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/34171256/pexels-photo-34171256.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'فستان أسود أنيق', 'Chic black dress', 2, false
FROM public.products WHERE slug = 'elegant-black-dress'
ON CONFLICT DO NOTHING;

-- Product 2: Blue Evening Dress
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/37015070/pexels-photo-37015070.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'فستان سهرة أزرق', 'Blue evening dress', 0, true
FROM public.products WHERE slug = 'blue-evening-dress'
ON CONFLICT DO NOTHING;

-- Product 3: White Summer Dress
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/27580017/pexels-photo-27580017.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'فستان صيفي أبيض', 'White summer dress', 0, true
FROM public.products WHERE slug = 'white-summer-dress'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/27292466/pexels-photo-27292466.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'فستان أبيض', 'White dress', 1, false
FROM public.products WHERE slug = 'white-summer-dress'
ON CONFLICT DO NOTHING;

-- Product 4: Red Cocktail Dress
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/34160661/pexels-photo-34160661.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'فستان كوكتيل أحمر', 'Red cocktail dress', 0, true
FROM public.products WHERE slug = 'red-cocktail-dress'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/25111218/pexels-photo-25111218.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'فستان أحمر', 'Red dress', 1, false
FROM public.products WHERE slug = 'red-cocktail-dress'
ON CONFLICT DO NOTHING;

-- Product 5: Embroidered Abaya
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/35150034/pexels-photo-35150034.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'عباية مطرزة', 'Embroidered abaya', 0, true
FROM public.products WHERE slug = 'embroidered-abaya'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/13838842/pexels-photo-13838842.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'عباية سوداء', 'Black abaya', 1, false
FROM public.products WHERE slug = 'embroidered-abaya'
ON CONFLICT DO NOTHING;

-- Product 6: Modern Blue Abaya
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/35263643/pexels-photo-35263643.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'عباية زرقاء عصرية', 'Modern blue abaya', 0, true
FROM public.products WHERE slug = 'modern-blue-abaya'
ON CONFLICT DO NOTHING;

-- Product 7: Striped Abaya
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/33539326/pexels-photo-33539326.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'عباية مخططة', 'Striped abaya', 0, true
FROM public.products WHERE slug = 'striped-abaya'
ON CONFLICT DO NOTHING;

-- Product 8: Elegant Blouse
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/28765912/pexels-photo-28765912.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'بلوزة أنيقة', 'Elegant blouse', 0, true
FROM public.products WHERE slug = 'elegant-blouse'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/16243971/pexels-photo-16243971.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'بلوزة حمراء', 'Red blouse', 1, false
FROM public.products WHERE slug = 'elegant-blouse'
ON CONFLICT DO NOTHING;

-- Product 9: Ruffle Top
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/7490354/pexels-photo-7490354.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'بلوزة بكشاكش', 'Ruffle top', 0, true
FROM public.products WHERE slug = 'ruffle-top'
ON CONFLICT DO NOTHING;

-- Product 10: Winter Coat
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/19441381/pexels-photo-19441381.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'معطف شتوي', 'Winter coat', 0, true
FROM public.products WHERE slug = 'elegant-winter-coat'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/14979420/pexels-photo-14979420.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'معطف رمادي', 'Gray coat', 1, false
FROM public.products WHERE slug = 'elegant-winter-coat'
ON CONFLICT DO NOTHING;

-- Product 11: Leather Handbag
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/8502482/pexels-photo-8502482.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'حقيبة جلدية', 'Leather handbag', 0, true
FROM public.products WHERE slug = 'elegant-leather-handbag'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/8989582/pexels-photo-8989582.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'حقيبة أنيقة', 'Elegant handbag', 1, false
FROM public.products WHERE slug = 'elegant-leather-handbag'
ON CONFLICT DO NOTHING;

-- Product 12: High Heels
INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/17826424/pexels-photo-17826424.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'حذاء بكعب عالٍ', 'High heels', 0, true
FROM public.products WHERE slug = 'high-heels'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text_ar, alt_text_en, display_order, is_primary)
SELECT id, 'https://images.pexels.com/photos/17739689/pexels-photo-17739689.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'حذاء أسود أنيق', 'Elegant black heels', 1, false
FROM public.products WHERE slug = 'high-heels'
ON CONFLICT DO NOTHING;

-- ============ PRODUCT VARIANTS ============
-- Product 1 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'S', 'أسود', 'Black', '#000000', 'VEL-DR-001-S-BLK', 20
FROM public.products WHERE slug = 'elegant-black-dress'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'M', 'أسود', 'Black', '#000000', 'VEL-DR-001-M-BLK', 15
FROM public.products WHERE slug = 'elegant-black-dress'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'L', 'أسود', 'Black', '#000000', 'VEL-DR-001-L-BLK', 10
FROM public.products WHERE slug = 'elegant-black-dress'
ON CONFLICT DO NOTHING;

-- Product 2 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'S', 'أزرق', 'Blue', '#1e40af', 'VEL-DR-002-S-BLU', 12
FROM public.products WHERE slug = 'blue-evening-dress'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'M', 'أزرق', 'Blue', '#1e40af', 'VEL-DR-002-M-BLU', 8
FROM public.products WHERE slug = 'blue-evening-dress'
ON CONFLICT DO NOTHING;

-- Product 3 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'S', 'أبيض', 'White', '#ffffff', 'VEL-DR-003-S-WHT', 18
FROM public.products WHERE slug = 'white-summer-dress'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'M', 'أبيض', 'White', '#ffffff', 'VEL-DR-003-M-WHT', 14
FROM public.products WHERE slug = 'white-summer-dress'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'L', 'أبيض', 'White', '#ffffff', 'VEL-DR-003-L-WHT', 9
FROM public.products WHERE slug = 'white-summer-dress'
ON CONFLICT DO NOTHING;

-- Product 4 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'S', 'أحمر', 'Red', '#dc2626', 'VEL-DR-004-S-RED', 15
FROM public.products WHERE slug = 'red-cocktail-dress'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'M', 'أحمر', 'Red', '#dc2626', 'VEL-DR-004-M-RED', 12
FROM public.products WHERE slug = 'red-cocktail-dress'
ON CONFLICT DO NOTHING;

-- Product 5 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'M', 'أسود', 'Black', '#000000', 'VEL-AB-001-M-BLK', 25
FROM public.products WHERE slug = 'embroidered-abaya'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'L', 'أسود', 'Black', '#000000', 'VEL-AB-001-L-BLK', 20
FROM public.products WHERE slug = 'embroidered-abaya'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'XL', 'أسود', 'Black', '#000000', 'VEL-AB-001-XL-BLK', 10
FROM public.products WHERE slug = 'embroidered-abaya'
ON CONFLICT DO NOTHING;

-- Product 6 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'M', 'أزرق', 'Blue', '#1e3a8a', 'VEL-AB-002-M-BLU', 15
FROM public.products WHERE slug = 'modern-blue-abaya'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'L', 'أزرق', 'Blue', '#1e3a8a', 'VEL-AB-002-L-BLU', 12
FROM public.products WHERE slug = 'modern-blue-abaya'
ON CONFLICT DO NOTHING;

-- Product 7 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'M', 'رمادي', 'Gray', '#6b7280', 'VEL-AB-003-M-GRY', 18
FROM public.products WHERE slug = 'striped-abaya'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'L', 'رمادي', 'Gray', '#6b7280', 'VEL-AB-003-L-GRY', 15
FROM public.products WHERE slug = 'striped-abaya'
ON CONFLICT DO NOTHING;

-- Product 8 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'S', 'أسود', 'Black', '#000000', 'VEL-TB-001-S-BLK', 30
FROM public.products WHERE slug = 'elegant-blouse'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'M', 'أسود', 'Black', '#000000', 'VEL-TB-001-M-BLK', 25
FROM public.products WHERE slug = 'elegant-blouse'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'L', 'أسود', 'Black', '#000000', 'VEL-TB-001-L-BLK', 20
FROM public.products WHERE slug = 'elegant-blouse'
ON CONFLICT DO NOTHING;

-- Product 9 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'S', 'أسود', 'Black', '#000000', 'VEL-TB-002-S-BLK', 22
FROM public.products WHERE slug = 'ruffle-top'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'M', 'أسود', 'Black', '#000000', 'VEL-TB-002-M-BLK', 18
FROM public.products WHERE slug = 'ruffle-top'
ON CONFLICT DO NOTHING;

-- Product 10 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'S', 'بني', 'Brown', '#78350f', 'VEL-JC-001-S-BRN', 10
FROM public.products WHERE slug = 'elegant-winter-coat'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'M', 'بني', 'Brown', '#78350f', 'VEL-JC-001-M-BRN', 8
FROM public.products WHERE slug = 'elegant-winter-coat'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'L', 'بني', 'Brown', '#78350f', 'VEL-JC-001-L-BRN', 5
FROM public.products WHERE slug = 'elegant-winter-coat'
ON CONFLICT DO NOTHING;

-- Product 11 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'One Size', 'بني', 'Brown', '#92400e', 'VEL-HB-001-OS-BRN', 30
FROM public.products WHERE slug = 'elegant-leather-handbag'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, 'One Size', 'أسود', 'Black', '#000000', 'VEL-HB-001-OS-BLK', 25
FROM public.products WHERE slug = 'elegant-leather-handbag'
ON CONFLICT DO NOTHING;

-- Product 12 variants
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, '36', 'أسود', 'Black', '#000000', 'VEL-SH-001-36-BLK', 15
FROM public.products WHERE slug = 'high-heels'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, '37', 'أسود', 'Black', '#000000', 'VEL-SH-001-37-BLK', 12
FROM public.products WHERE slug = 'high-heels'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, '38', 'أسود', 'Black', '#000000', 'VEL-SH-001-38-BLK', 10
FROM public.products WHERE slug = 'high-heels'
ON CONFLICT DO NOTHING;
INSERT INTO public.product_variants (product_id, size, color_name_ar, color_name_en, color_code, sku, stock_quantity)
SELECT id, '39', 'أسود', 'Black', '#000000', 'VEL-SH-001-39-BLK', 8
FROM public.products WHERE slug = 'high-heels'
ON CONFLICT DO NOTHING;

-- ============ BANNERS ============
INSERT INTO public.banners (title_ar, title_en, subtitle_ar, subtitle_en, image_url, destination_url, display_order, is_active)
VALUES
  ('مجموعة الخريف الجديدة', 'New Autumn Collection', 'اكتشفي أحدث صيحات الموضة', 'Discover the latest fashion trends', 'https://images.pexels.com/photos/35045845/pexels-photo-35045845.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '/products', 0, true),
  ('عبايات فاخرة', 'Luxury Abayas', 'أناقة محتشمة بلمسة عصرية', 'Modest elegance with a modern touch', 'https://images.pexels.com/photos/35150034/pexels-photo-35150034.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '/category/abayas-modest-fashion', 1, true),
  ('تخفيضات الموسم', 'Season Sale', 'خصومات تصل إلى 30%', 'Up to 30% off', 'https://images.pexels.com/photos/25111218/pexels-photo-25111218.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '/sale', 2, true)
ON CONFLICT DO NOTHING;

-- ============ SITE SETTINGS ============
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('store_name', 'VELORA'),
  ('store_name_ar', 'فيلورا'),
  ('store_email', 'contact@velora.store'),
  ('store_phone', '+967 1 234 567'),
  ('store_address', 'Sanaa, Yemen'),
  ('store_currency', 'USD'),
  ('store_currency_symbol', '$'),
  ('social_instagram', 'https://instagram.com/velora'),
  ('social_facebook', 'https://facebook.com/velora'),
  ('social_whatsapp', 'https://wa.me/9671234567'),
  ('footer_text_en', 'VELORA - Premium Women''s Fashion'),
  ('footer_text_ar', 'فيلورا - أزياء نسائية فاخرة'),
  ('default_language', 'en'),
  ('shipping_free_threshold', '200'),
  ('enable_guest_checkout', 'true')
ON CONFLICT (setting_key) DO NOTHING;

-- ============ SHIPPING ZONES ============
INSERT INTO public.shipping_zones (name_ar, name_en, countries, is_active)
VALUES
  ('اليمن', 'Yemen', ARRAY['YE'], true),
  ('دول الخليج', 'Gulf Countries', ARRAY['SA', 'AE', 'KW', 'QA', 'BH', 'OM'], true),
  ('دول أخرى', 'Other Countries', ARRAY['*'], true)
ON CONFLICT DO NOTHING;

-- ============ SHIPPING METHODS ============
INSERT INTO public.shipping_methods (shipping_zone_id, name_ar, name_en, price, delivery_estimate_ar, delivery_estimate_en, minimum_order_amount, is_cod_available, is_active)
SELECT id, 'توصيل عادي', 'Standard Delivery', 5.00, '3-5 أيام عمل', '3-5 business days', 0.00, true, true
FROM public.shipping_zones WHERE name_en = 'Yemen'
ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_methods (shipping_zone_id, name_ar, name_en, price, delivery_estimate_ar, delivery_estimate_en, minimum_order_amount, is_cod_available, is_active)
SELECT id, 'توصيل سريع', 'Express Delivery', 12.00, '1-2 يوم عمل', '1-2 business days', 0.00, true, true
FROM public.shipping_zones WHERE name_en = 'Yemen'
ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_methods (shipping_zone_id, name_ar, name_en, price, delivery_estimate_ar, delivery_estimate_en, minimum_order_amount, is_cod_available, is_active)
SELECT id, 'شحن دولي', 'International Shipping', 25.00, '7-14 يوم عمل', '7-14 business days', 0.00, false, true
FROM public.shipping_zones WHERE name_en = 'Gulf Countries'
ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_methods (shipping_zone_id, name_ar, name_en, price, delivery_estimate_ar, delivery_estimate_en, minimum_order_amount, is_cod_available, is_active)
SELECT id, 'شحن عالمي', 'Worldwide Shipping', 40.00, '14-21 يوم عمل', '14-21 business days', 0.00, false, true
FROM public.shipping_zones WHERE name_en = 'Other Countries'
ON CONFLICT DO NOTHING;

-- ============ PAGES ============
INSERT INTO public.pages (title_ar, title_en, slug, content_ar, content_en, status, seo_title, seo_description)
VALUES
  ('عن فيلورا', 'About VELORA', 'about',
   'فيلورا علامة أزياء نسائية فاخرة تأسست لتقديم أناقة عصرية للمرأة المعاصرة. نؤمن بأن الأناقة لا تعني التنازل عن الراحة أو الاحتشام.',
   'VELORA is a premium women''s fashion brand founded to bring modern elegance to the contemporary woman. We believe elegance should never mean compromising on comfort or modesty.',
   'published', 'About VELORA - Premium Women''s Fashion', 'Learn about VELORA, our mission, and our commitment to elegant women''s fashion.'),
  ('الأسئلة الشائعة', 'FAQ', 'faq',
   'أسئلة وأجوبة حول الطلب والشحن والإرجاع.',
   'Frequently asked questions about ordering, shipping, and returns.',
   'published', 'FAQ - VELORA', 'Find answers to common questions about VELORA orders, shipping, and returns.'),
  ('سياسة الخصوصية', 'Privacy Policy', 'privacy-policy',
   'نلتزم بحماية خصوصيتك وبياناتك الشخصية.',
   'We are committed to protecting your privacy and personal data.',
   'published', 'Privacy Policy - VELORA', 'Read VELORA''s privacy policy regarding your personal data.'),
  ('الشروط والأحكام', 'Terms of Service', 'terms-of-service',
   'الشروط والأحكام لاستخدام موقع فيلورا.',
   'Terms and conditions for using the VELORA website.',
   'published', 'Terms of Service - VELORA', 'Read the terms and conditions for using VELORA.'),
  ('الشحن والإرجاع', 'Shipping & Returns', 'shipping-returns',
   'معلومات الشحن وسياسة الإرجاع.',
   'Shipping information and return policy.',
   'published', 'Shipping & Returns - VELORA', 'Learn about VELORA''s shipping options and return policy.'),
  ('تواصلي معنا', 'Contact Us', 'contact',
   'تواصلي معنا لأي استفسارات.',
   'Contact us for any inquiries.',
   'published', 'Contact VELORA', 'Get in touch with the VELORA team.')
ON CONFLICT (slug) DO NOTHING;

-- ============ COUPON ============
INSERT INTO public.coupons (code, discount_type, discount_value, minimum_order_amount, maximum_discount, usage_limit, is_active, starts_at, expires_at)
VALUES
  ('WELCOME10', 'percentage', 10, 50, 100, 100, true, now(), now() + interval '365 days'),
  ('VELORA20', 'percentage', 20, 100, 50, 50, true, now(), now() + interval '90 days')
ON CONFLICT (code) DO NOTHING;

-- ============ NAVIGATION MENU ============
INSERT INTO public.navigation_menus (name, slug) VALUES ('Main Menu', 'main-menu') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.navigation_menu_items (menu_id, label_ar, label_en, url, display_order)
SELECT id, 'الرئيسية', 'Home', '/', 0 FROM public.navigation_menus WHERE slug = 'main-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.navigation_menu_items (menu_id, label_ar, label_en, url, display_order)
SELECT id, 'المنتجات', 'Shop', '/products', 1 FROM public.navigation_menus WHERE slug = 'main-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.navigation_menu_items (menu_id, label_ar, label_en, url, display_order)
SELECT id, 'وصل حديثاً', 'New Arrivals', '/new-arrivals', 2 FROM public.navigation_menus WHERE slug = 'main-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.navigation_menu_items (menu_id, label_ar, label_en, url, display_order)
SELECT id, 'الأكثر مبيعاً', 'Best Sellers', '/best-sellers', 3 FROM public.navigation_menus WHERE slug = 'main-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.navigation_menu_items (menu_id, label_ar, label_en, url, display_order)
SELECT id, 'تخفيضات', 'Sale', '/sale', 4 FROM public.navigation_menus WHERE slug = 'main-menu'
ON CONFLICT DO NOTHING;
