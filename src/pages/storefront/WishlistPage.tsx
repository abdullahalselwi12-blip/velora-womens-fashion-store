import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/lib/wishlist';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { SEO } from '@/components/SEO';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/Button';

export function WishlistPage() {
  const { items, loading } = useWishlist();
  const { user } = useAuth();
  const { t } = useI18n();

  if (!user) {
    return (
      <div className="container-velora py-20 text-center">
        <Heart className="w-16 h-16 mx-auto text-stone-300 mb-4" />
        <h1 className="text-xl font-semibold mb-2">{t('nav.wishlist')}</h1>
        <p className="text-sm text-stone-500 mb-6">{t('msg.wishlistEmpty')}</p>
        <Link to="/signin"><Button>{t('action.signIn')}</Button></Link>
      </div>
    );
  }

  return (
    <>
      <SEO title={t('nav.wishlist')} />
      <div className="container-velora py-8">
        <h1 className="text-2xl font-semibold mb-8">{t('nav.wishlist')}</h1>

        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-16 h-16" />}
            title={t('msg.wishlistEmpty')}
            description={t('msg.wishlistEmpty')}
            action={<Link to="/products"><Button>{t('action.continueShopping')}</Button></Link>}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </>
  );
}
