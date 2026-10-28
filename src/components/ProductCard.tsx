import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useWishlist } from '@/lib/wishlist';
import { useCart } from '@/lib/cart';
import { useToast } from '@/components/ui/Toast';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  const { lang, t, tl } = useI18n();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
  const hasSale = product.sale_price && product.sale_price < product.base_price;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.product_variants?.[0];
    if (!variant) return;
    if (variant.stock_quantity <= 0) {
      showToast(t('msg.outOfStock'), 'error');
      return;
    }
    const { error } = await addItem(variant.id, 1);
    if (error) {
      showToast(t('msg.error'), 'error');
    } else {
      showToast(t('msg.addedToCart'), 'success');
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
    showToast(inWishlist ? t('msg.removedFromCart') : t('msg.addedToWishlist'), 'success');
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block bg-white dark:bg-stone-900 rounded-lg overflow-hidden product-card-shadow transition-all duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 dark:bg-stone-800">
        {primaryImage?.image_url ? (
          <img
            src={primaryImage.image_url}
            alt={lang === 'ar' ? primaryImage.alt_text_ar || product.name_ar : primaryImage.alt_text_en || product.name_en}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <ShoppingBag className="w-12 h-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new_arrival && (
            <span className="px-2.5 py-1 bg-stone-900 text-white text-xs font-medium rounded">
              {t('label.new')}
            </span>
          )}
          {hasSale && (
            <span className="px-2.5 py-1 bg-rose-600 text-white text-xs font-medium rounded">
              {t('label.sale')}
            </span>
          )}
          {product.is_best_seller && (
            <span className="px-2.5 py-1 bg-amber-600 text-white text-xs font-medium rounded">
              {t('label.bestSeller')}
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-stone-900/80 backdrop-blur rounded-full transition-colors hover:bg-white dark:hover:bg-stone-800"
          aria-label={t('action.addToWishlist')}
        >
          <Heart
            className={`w-4 h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : 'text-stone-600 dark:text-stone-400'}`}
          />
        </button>

        {/* Quick add to cart */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 bg-stone-900 text-white py-3 text-sm font-medium translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          {t('action.addToCart')}
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 line-clamp-1">
          {lang === 'ar' ? product.name_ar : product.name_en}
        </h3>
        {product.brand && (
          <p className="text-xs text-stone-500 mt-0.5">{product.brand}</p>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          {hasSale ? (
            <>
              <span className="text-base font-semibold text-rose-600">
                {formatPrice(product.sale_price!, product.currency, lang)}
              </span>
              <span className="text-sm text-stone-400 line-through">
                {formatPrice(product.base_price, product.currency, lang)}
              </span>
            </>
          ) : (
            <span className="text-base font-semibold text-stone-900 dark:text-stone-100">
              {formatPrice(product.base_price, product.currency, lang)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
