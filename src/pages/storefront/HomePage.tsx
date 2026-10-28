import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { SEO } from '@/components/SEO';
import { ProductCard } from '@/components/ProductCard';
import { Spinner } from '@/components/ui/Spinner';
import type { Product, Category, Banner } from '@/types';

export function HomePage() {
  const { t, tl, lang, dir } = useI18n();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [featRes, newRes, bestRes, catRes, banRes] = await Promise.all([
        supabase.from('products').select('*, product_images(*), product_variants(*)').eq('product_status', 'published').eq('is_featured', true).limit(8),
        supabase.from('products').select('*, product_images(*), product_variants(*)').eq('product_status', 'published').eq('is_new_arrival', true).limit(8),
        supabase.from('products').select('*, product_images(*), product_variants(*)').eq('product_status', 'published').eq('is_best_seller', true).limit(8),
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('banners').select('*').eq('is_active', true).order('display_order'),
      ]);

      if (featRes.data) setFeatured(featRes.data as Product[]);
      if (newRes.data) setNewArrivals(newRes.data as Product[]);
      if (bestRes.data) setBestSellers(bestRes.data as Product[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      if (banRes.data) setBanners(banRes.data as Banner[]);
      setLoading(false);
    })();
  }, []);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  return (
    <>
      <SEO
        title=""
        description={tl('فيلورا - أزياء نسائية فاخرة. اكتشفي مجموعتنا من الفساتين، العبايات، والأكسسوارات الأنيقة.', 'VELORA - Premium women\'s fashion. Discover our collection of dresses, abayas, and elegant accessories.')}
      />

      {/* Hero banner */}
      {banners[0] && (
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
          <img
            src={banners[0].image_url || ''}
            alt={lang === 'ar' ? banners[0].title_ar : banners[0].title_en}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0">
            <div className="container-velora pb-16">
              <div className="max-w-xl">
                <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
                  {lang === 'ar' ? banners[0].title_ar : banners[0].title_en}
                </h1>
                <p className="text-lg text-white/80 mb-6">
                  {lang === 'ar' ? banners[0].subtitle_ar : banners[0].subtitle_en}
                </p>
                <Link
                  to={banners[0].destination_url || '/products'}
                  className="inline-flex items-center gap-2 bg-white text-stone-900 px-8 py-3.5 rounded-md font-medium hover:bg-stone-100 transition-colors"
                >
                  {t('msg.heroCta')}
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Shop by category */}
      <section className="container-velora py-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-2">
          {t('msg.shopByCategory')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
          {categories.slice(0, 5).map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group relative aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800"
            >
              {cat.image_url ? (
                <img src={cat.image_url} alt={lang === 'ar' ? cat.name_ar : cat.name_en} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800">
                  <span className="text-3xl font-bold text-stone-400">{(lang === 'ar' ? cat.name_ar : cat.name_en).charAt(0)}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-end p-4">
                <span className="text-white font-medium text-sm">{lang === 'ar' ? cat.name_ar : cat.name_en}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="container-velora py-16 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold">{t('msg.featuredProducts')}</h2>
            <Link to="/products" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1">
              {t('action.viewAll')}
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Banner 2 */}
      {banners[1] && (
        <section className="relative h-[40vh] min-h-[300px] overflow-hidden my-8">
          <img src={banners[1].image_url || ''} alt={lang === 'ar' ? banners[1].title_ar : banners[1].title_en} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {lang === 'ar' ? banners[1].title_ar : banners[1].title_en}
              </h2>
              <p className="text-white/80 mb-4">
                {lang === 'ar' ? banners[1].subtitle_ar : banners[1].subtitle_en}
              </p>
              <Link to={banners[1].destination_url || '/products'} className="inline-flex items-center gap-2 bg-white text-stone-900 px-6 py-3 rounded-md font-medium hover:bg-stone-100 transition-colors">
                {t('action.viewAll')}
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="container-velora py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold">{t('msg.newArrivals')}</h2>
            <Link to="/new-arrivals" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1">
              {t('action.viewAll')}
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="container-velora py-16 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold">{t('msg.bestSellers')}</h2>
            <Link to="/best-sellers" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1">
              {t('action.viewAll')}
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {bestSellers.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Banner 3 - Sale */}
      {banners[2] && (
        <section className="relative h-[35vh] min-h-[250px] overflow-hidden my-8">
          <img src={banners[2].image_url || ''} alt={lang === 'ar' ? banners[2].title_ar : banners[2].title_en} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-rose-900/70 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container-velora">
              <div className="max-w-md">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {lang === 'ar' ? banners[2].title_ar : banners[2].title_en}
                </h2>
                <p className="text-white/80 mb-4">
                  {lang === 'ar' ? banners[2].subtitle_ar : banners[2].subtitle_en}
                </p>
                <Link to="/sale" className="inline-flex items-center gap-2 bg-white text-rose-700 px-6 py-3 rounded-md font-medium hover:bg-rose-50 transition-colors">
                  {t('nav.sale')}
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
