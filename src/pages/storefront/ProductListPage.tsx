import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { SEO } from '@/components/SEO';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import type { Product, Category } from '@/types';

interface ProductListPageProps {
  mode?: 'all' | 'new-arrivals' | 'best-sellers' | 'sale' | 'featured' | 'search' | 'category';
}

const PAGE_SIZE = 12;

export function ProductListPage({ mode = 'all' }: ProductListPageProps) {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { t, tl, lang } = useI18n();

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 500 });
  const [availableOnly, setAvailableOnly] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildQuery = useCallback(() => {
    let query = supabase
      .from('products')
      .select('*, product_images(*), product_variants(*)', { count: 'exact' })
      .eq('product_status', 'published');

    if (mode === 'new-arrivals') query = query.eq('is_new_arrival', true);
    else if (mode === 'best-sellers') query = query.eq('is_best_seller', true);
    else if (mode === 'featured') query = query.eq('is_featured', true);
    else if (mode === 'sale') query = query.not('sale_price', 'is', null);
    else if (mode === 'category' && slug) query = query.eq('category_id', category?.id);
    else if (mode === 'search' && searchQuery) {
      query = query.or(`name_en.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
    }

    if (availableOnly) {
      query = query.eq('product_variants.stock_quantity', 0);
    }

    if (sortBy === 'priceLow') query = query.order('base_price', { ascending: true });
    else if (sortBy === 'priceHigh') query = query.order('base_price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    return query;
  }, [mode, slug, category, searchQuery, sortBy, page, availableOnly]);

  useEffect(() => {
    if (mode === 'category' && slug) {
      supabase.from('categories').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
        if (data) setCategory(data as Category);
      });
    } else {
      setCategory(null);
    }
  }, [mode, slug]);

  useEffect(() => {
    setPage(1);
  }, [mode, slug, searchQuery, sortBy]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, count } = await buildQuery();
      let filtered = (data as Product[]) || [];

      if (selectedSizes.length > 0) {
        filtered = filtered.filter(p =>
          p.product_variants?.some(v => v.size && selectedSizes.includes(v.size))
        );
      }
      filtered = filtered.filter(p => p.base_price >= priceRange.min && p.base_price <= priceRange.max);

      setProducts(filtered);
      setTotal(count || filtered.length);
      setLoading(false);
    })();
  }, [buildQuery, selectedSizes, priceRange]);

  const pageTitle = () => {
    if (mode === 'new-arrivals') return t('msg.newArrivals');
    if (mode === 'best-sellers') return t('msg.bestSellers');
    if (mode === 'sale') return t('nav.sale');
    if (mode === 'featured') return t('msg.featuredProducts');
    if (mode === 'search') return `${t('msg.searchResults')} - ${searchQuery}`;
    if (mode === 'category' && category) return lang === 'ar' ? category.name_ar : category.name_en;
    return t('nav.allProducts');
  };

  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'One Size', '36', '37', '38', '39'];

  return (
    <>
      <SEO
        title={pageTitle()}
        description={category?.description_en || category?.description_ar || tl('تسوقي أحدث منتجات فيلورا', 'Shop the latest VELORA products')}
      />

      {/* Page header */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <div className="container-velora py-8">
          <h1 className="text-2xl md:text-3xl font-semibold">{pageTitle()}</h1>
          {category?.description_en && (
            <p className="mt-2 text-sm text-stone-500">
              {lang === 'ar' ? category.description_ar : category.description_en}
            </p>
          )}
        </div>
      </div>

      <div className="container-velora py-8">
        <div className="flex gap-8">
          {/* Filters sidebar - desktop */}
          <aside className="hidden md:block w-60 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t('label.filters')}</h3>

              {/* Size filter */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">{t('label.size')}</p>
                <div className="flex flex-wrap gap-2">
                  {allSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                      className={`px-3 py-1.5 text-xs border rounded-md transition-colors ${
                        selectedSizes.includes(size)
                          ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                          : 'border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">{t('msg.priceRange')}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={e => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                    className="w-full px-2 py-1.5 text-sm border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900"
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={e => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                    className="w-full px-2 py-1.5 text-sm border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={e => setAvailableOnly(e.target.checked)}
                    className="rounded border-stone-300"
                  />
                  <span className="text-sm">{t('msg.available')}</span>
                </label>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSizes([]);
                  setPriceRange({ min: 0, max: 500 });
                  setAvailableOnly(false);
                }}
              >
                {t('label.clearAll')}
              </Button>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-stone-500">
                {total} {t('msg.items')}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(true)}
                  className="md:hidden flex items-center gap-2 text-sm border border-stone-300 dark:border-stone-700 px-3 py-2 rounded-md"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {t('label.filters')}
                </button>
                <Select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-auto"
                >
                  <option value="newest">{t('label.newest')}</option>
                  <option value="priceLow">{t('label.priceLow')}</option>
                  <option value="priceHigh">{t('label.priceHigh')}</option>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="min-h-[40vh] flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                title={t('label.noResults')}
                description={tl('لم نجد منتجات مطابقة. جربي تعديل التصفية.', 'No matching products found. Try adjusting your filters.')}
                action={<Button onClick={() => { setSelectedSizes([]); setPriceRange({ min: 0, max: 500 }); setAvailableOnly(false); }}>{t('label.clearAll')}</Button>}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute top-0 bottom-0 left-0 rtl:left-auto rtl:right-0 w-72 bg-white dark:bg-stone-900 shadow-xl overflow-y-auto p-4 animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">{t('label.filters')}</h3>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">{t('label.size')}</p>
              <div className="flex flex-wrap gap-2">
                {allSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                    className={`px-3 py-1.5 text-xs border rounded-md ${selectedSizes.includes(size) ? 'bg-stone-900 text-white' : 'border-stone-300'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">{t('msg.priceRange')}</p>
              <div className="flex items-center gap-2">
                <input type="number" value={priceRange.min} onChange={e => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))} className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-stone-900" />
                <span>-</span>
                <input type="number" value={priceRange.max} onChange={e => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))} className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-stone-900" />
              </div>
            </div>
            <div className="mb-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} className="rounded" />
                <span className="text-sm">{t('msg.available')}</span>
              </label>
            </div>
            <Button onClick={() => setShowFilters(false)} className="w-full">{t('action.apply')}</Button>
          </div>
        </div>
      )}
    </>
  );
}
