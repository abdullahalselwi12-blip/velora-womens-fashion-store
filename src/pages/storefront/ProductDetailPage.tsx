import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingBag, Minus, Plus, ChevronRight, Star, Truck, RotateCcw, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { ProductCard } from '@/components/ProductCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import type { Product, Review } from '@/types';

export function ProductDetailPage() {
  const { slug } = useParams();
  const { t, tl, lang } = useI18n();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');
  const [newReview, setNewReview] = useState({ rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, product_images(*), product_variants(*), category:categories(*)')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        setProduct(data as Product);
        const firstVariant = (data as Product).product_variants?.[0];
        if (firstVariant) setSelectedVariant(firstVariant.id);

        if ((data as Product).category_id) {
          const { data: relData } = await supabase
            .from('products')
            .select('*, product_images(*), product_variants(*)')
            .eq('product_status', 'published')
            .eq('category_id', (data as Product).category_id)
            .neq('id', (data as Product).id)
            .limit(4);
          if (relData) setRelated(relData as Product[]);
        }

        const { data: revData } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', (data as Product).id)
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: false });
        if (revData) setReviews(revData as Review[]);
      }
      setLoading(false);
    })();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      showToast(t('msg.selectSize'), 'error');
      return;
    }
    const { error } = await addItem(selectedVariant, quantity);
    if (error) {
      showToast(t('msg.error'), 'error');
    } else {
      showToast(t('msg.addedToCart'), 'success');
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    await toggleWishlist(product.id);
    showToast(t('msg.addedToWishlist'), 'success');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: user.id,
      rating: newReview.rating,
      review_title: newReview.title,
      review_body: newReview.body,
    });
    if (error) {
      showToast(t('msg.error'), 'error');
    } else {
      showToast(tl('تم إرسال تقييمك للمراجعة', 'Your review has been submitted for approval'), 'success');
      setNewReview({ rating: 5, title: '', body: '' });
    }
    setSubmittingReview(false);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!product) return (
    <div className="container-velora py-20 text-center">
      <h1 className="text-2xl font-semibold mb-4">{t('msg.pageNotFound')}</h1>
      <Link to="/products" className="text-rose-600 hover:underline">{t('action.backToShop')}</Link>
    </div>
  );

  const images = product.product_images || [];
  const variants = product.product_variants || [];
  const hasSale = product.sale_price && product.sale_price < product.base_price;
  const currentPrice = hasSale ? product.sale_price! : product.base_price;
  const selectedVariantData = variants.find(v => v.id === selectedVariant);
  const inWishlist = isInWishlist(product.id);
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))] as string[];
  const colors = [...new Map(variants.map(v => [v.color_code, v]).filter(([k]) => k)).values()];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": lang === 'ar' ? product.name_ar : product.name_en,
    "description": lang === 'ar' ? product.description_ar : product.description_en,
    "sku": product.sku,
    "brand": { "@type": "Brand", "name": product.brand || 'VELORA' },
    "offers": {
      "@type": "Offer",
      "price": currentPrice,
      "priceCurrency": product.currency,
      "availability": selectedVariantData?.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  if (reviews.length > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "reviewCount": reviews.length,
    };
  }

  return (
    <>
      <SEO
        title={lang === 'ar' ? product.name_ar : product.name_en}
        description={lang === 'ar' ? product.seo_description || product.short_description_ar || '' : product.seo_description || product.short_description_en || ''}
        canonicalUrl={product.canonical_url || undefined}
        image={images[0]?.image_url || undefined}
        type="product"
        jsonLd={jsonLd}
      />

      <div className="container-velora py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-stone-500 mb-6">
          <Link to="/" className="hover:text-stone-900 dark:hover:text-stone-100">{t('nav.home')}</Link>
          <ChevronRight className="w-3 h-3 rtl:rotate-180" />
          <Link to="/products" className="hover:text-stone-900 dark:hover:text-stone-100">{t('nav.shop')}</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3 h-3 rtl:rotate-180" />
              <Link to={`/category/${product.category.slug}`} className="hover:text-stone-900 dark:hover:text-stone-100">
                {lang === 'ar' ? product.category.name_ar : product.category.name_en}
              </Link>
            </>
          )}
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image gallery */}
          <div>
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 mb-4">
              {images[selectedImage]?.image_url ? (
                <img
                  src={images[selectedImage].image_url}
                  alt={lang === 'ar' ? images[selectedImage].alt_text_ar || product.name_ar : images[selectedImage].alt_text_en || product.name_en}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-16 h-16" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      i === selectedImage ? 'border-stone-900 dark:border-stone-100' : 'border-transparent hover:border-stone-300'
                    }`}
                  >
                    <img src={img.image_url || ''} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            {product.brand && <p className="text-sm text-stone-500 mb-1">{product.brand}</p>}
            <h1 className="text-2xl md:text-3xl font-semibold text-stone-900 dark:text-stone-100 mb-3">
              {lang === 'ar' ? product.name_ar : product.name_en}
            </h1>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-stone-500">
                  {avgRating.toFixed(1)} ({reviews.length} {t('msg.reviews')})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className={`text-2xl font-semibold ${hasSale ? 'text-rose-600' : 'text-stone-900 dark:text-stone-100'}`}>
                {formatPrice(currentPrice, product.currency, lang)}
              </span>
              {hasSale && (
                <span className="text-lg text-stone-400 line-through">
                  {formatPrice(product.base_price, product.currency, lang)}
                </span>
              )}
            </div>

            {/* Short description */}
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
              {lang === 'ar' ? product.short_description_ar : product.short_description_en}
            </p>

            {/* Color selection */}
            {colors.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium mb-2">{t('label.color')}</p>
                <div className="flex gap-2">
                  {colors.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedVariant === v.id ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-stone-100' : 'border-stone-300'
                      }`}
                      style={{ backgroundColor: v.color_code || '#ccc' }}
                      title={lang === 'ar' ? v.color_name_ar || '' : v.color_name_en || ''}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            {sizes.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{t('label.size')}</p>
                  <button className="text-xs text-stone-500 underline">{t('label.sizeGuide')}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => {
                    const sizeVariants = variants.filter(v => v.size === size);
                    const inStock = sizeVariants.some(v => v.stock_quantity > 0);
                    return (
                      <button
                        key={size}
                        disabled={!inStock}
                        onClick={() => {
                          const v = sizeVariants.find(v => v.stock_quantity > 0);
                          if (v) setSelectedVariant(v.id);
                        }}
                        className={`min-w-[3rem] px-3 py-2 text-sm border rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          selectedVariant && sizeVariants.some(v => v.id === selectedVariant)
                            ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                            : 'border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">{t('label.quantity')}</p>
              <div className="inline-flex items-center border border-stone-300 dark:border-stone-700 rounded-md">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2.5 hover:bg-stone-100 dark:hover:bg-stone-800">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="p-2.5 hover:bg-stone-100 dark:hover:bg-stone-800">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stock status */}
            {selectedVariantData && (
              <div className="mb-6">
                {selectedVariantData.stock_quantity > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    {t('label.inStock')} ({selectedVariantData.stock_quantity})
                  </span>
                ) : (
                  <span className="text-sm text-red-500">{t('label.outOfStock')}</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <Button onClick={handleAddToCart} size="lg" className="flex-1" disabled={!selectedVariantData || selectedVariantData.stock_quantity <= 0}>
                <ShoppingBag className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {t('action.addToCart')}
              </Button>
              <Button onClick={handleWishlist} variant="outline" size="lg" className="px-4">
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
              </Button>
            </div>

            {/* Shipping info */}
            <div className="border-t border-stone-200 dark:border-stone-800 pt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
                <Truck className="w-5 h-5 text-stone-400" />
                <span>{tl('شحن سريع لجميع المدن', 'Fast shipping to all cities')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
                <RotateCcw className="w-5 h-5 text-stone-400" />
                <span>{tl('إرجاع مجاني خلال 14 يوم', 'Free returns within 14 days')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 border-t border-stone-200 dark:border-stone-800 pt-8">
          <div className="flex gap-6 mb-6 border-b border-stone-200 dark:border-stone-800">
            {([
              { key: 'description', label: t('label.description') },
              { key: 'reviews', label: `${t('label.reviews')} (${reviews.length})` },
              { key: 'shipping', label: t('label.shippingReturns') },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.key
                    ? 'border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">
                {lang === 'ar' ? product.description_ar : product.description_en}
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="max-w-3xl">
              {reviews.length === 0 ? (
                <p className="text-stone-500 text-sm">{t('msg.noReviews')}</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-stone-200 dark:border-stone-800 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                          ))}
                        </div>
                        {r.review_title && <span className="text-sm font-medium">{r.review_title}</span>}
                      </div>
                      {r.review_body && <p className="text-sm text-stone-600 dark:text-stone-400">{r.review_body}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Write review form */}
              {user ? (
                <form onSubmit={handleReviewSubmit} className="mt-8 space-y-4">
                  <h4 className="font-medium">{t('msg.writeReview')}</h4>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('msg.rating')}</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewReview(prev => ({ ...prev, rating: i }))}
                        >
                          <Star className={`w-6 h-6 ${i <= newReview.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder={tl('عنوان التقييم', 'Review title')}
                    value={newReview.title}
                    onChange={e => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 text-sm"
                  />
                  <textarea
                    placeholder={tl('اكتبي تقييمك هنا...', 'Write your review here...')}
                    value={newReview.body}
                    onChange={e => setNewReview(prev => ({ ...prev, body: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 text-sm"
                  />
                  <Button type="submit" disabled={submittingReview}>{t('msg.writeReview')}</Button>
                </form>
              ) : (
                <p className="mt-8 text-sm text-stone-500">
                  <Link to="/signin" className="text-rose-600 underline">{t('action.signIn')}</Link>
                  {' '}{tl('لكتابة تقييم', 'to write a review')}
                </p>
              )}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="max-w-3xl text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>{tl('نقدم خيارات شحن متعددة لتناسب احتياجاتك. الشحن العادي يستغرق 3-5 أيام عمل، والشحن السريع 1-2 يوم عمل.', 'We offer multiple shipping options. Standard delivery takes 3-5 business days, express delivery 1-2 business days.')}</p>
              <p>{tl('يمكنك إرجاع المنتجات خلال 14 يوماً من الاستلام بشرط أن تكون بحالتها الأصلية.', 'You can return items within 14 days of delivery, provided they are in original condition.')}</p>
              <p>{tl('الدفع عند الاستلام متاح داخل اليمن.', 'Cash on delivery is available within Yemen.')}</p>
            </div>
          )}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold mb-6">{t('msg.relatedProducts')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
