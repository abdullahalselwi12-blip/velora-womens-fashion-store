import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Tag, X } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatPrice } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Coupon } from '@/types';

export function CartPage() {
  const { items, loading, updateQuantity, removeItem, cartId } = useCart();
  const { t, tl, lang } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [shippingCost, setShippingCost] = useState(5);

  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.sale_price && item.product.sale_price < item.product.base_price
      ? item.product.sale_price
      : item.product?.base_price || 0;
    return sum + price * item.quantity;
  }, 0);

  const discount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? Math.min(subtotal * (appliedCoupon.discount_value / 100), appliedCoupon.maximum_discount || Infinity)
      : Math.min(appliedCoupon.discount_value, subtotal)
    : 0;

  const freeShippingThreshold = 200;
  const actualShipping = subtotal - discount >= freeShippingThreshold ? 0 : (subtotal > 0 ? shippingCost : 0);
  const total = subtotal - discount + actualShipping;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setApplyingCoupon(true);
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      const coupon = data as Coupon;
      if (coupon.minimum_order_amount > 0 && subtotal < coupon.minimum_order_amount) {
        showToast(tl('الحد الأدنى للطلب لا يكفي', 'Minimum order amount not met'), 'error');
      } else if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        showToast(t('msg.couponInvalid'), 'error');
      } else if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        showToast(t('msg.couponInvalid'), 'error');
      } else {
        setAppliedCoupon(coupon);
        showToast(t('msg.couponApplied'), 'success');
      }
    } else {
      showToast(t('msg.couponInvalid'), 'error');
    }
    setApplyingCoupon(false);
  };

  const handleCheckout = () => {
    const coupon = appliedCoupon?.code || '';
    navigate(`/checkout${coupon ? `?coupon=${coupon}` : ''}`);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <>
      <SEO title={t('nav.cart')} />
      <div className="container-velora py-8">
        <h1 className="text-2xl font-semibold mb-8">{t('nav.cart')}</h1>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-16 h-16" />}
            title={t('msg.cartEmpty')}
            description={tl('ابدئي التسوق واكتشفي مجموعتنا الأنيقة', 'Start shopping and discover our elegant collection')}
            action={<Link to="/products"><Button>{t('action.continueShopping')}</Button></Link>}
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => {
                const product = item.product;
                if (!product) return null;
                const price = product.sale_price && product.sale_price < product.base_price ? product.sale_price : product.base_price;
                const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
                const variant = item.product_variant;
                const outOfStock = variant?.stock_quantity <= 0;

                return (
                  <div key={item.id} className="flex gap-4 bg-white dark:bg-stone-900 rounded-lg p-4 product-card-shadow">
                    <Link to={`/product/${product.slug}`} className="flex-shrink-0">
                      <div className="w-24 h-32 rounded-md overflow-hidden bg-stone-100 dark:bg-stone-800">
                        {primaryImage?.image_url ? (
                          <img src={primaryImage.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-stone-400" /></div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link to={`/product/${product.slug}`} className="text-sm font-medium hover:underline">
                            {lang === 'ar' ? product.name_ar : product.name_en}
                          </Link>
                          <div className="text-xs text-stone-500 mt-1 space-y-0.5">
                            {variant?.size && <p>{t('label.size')}: {variant.size}</p>}
                            {variant?.color_name_en && <p>{t('label.color')}: {lang === 'ar' ? variant.color_name_ar : variant.color_name_en}</p>}
                            {outOfStock && <p className="text-red-500">{t('label.outOfStock')}</p>}
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-stone-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="inline-flex items-center border border-stone-300 dark:border-stone-700 rounded-md">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatPrice(price * item.quantity, product.currency, lang)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Link to="/products" className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 dark:hover:text-stone-100 mt-4">
                {t('action.continueShopping')}
              </Link>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow sticky top-24">
                <h2 className="text-lg font-semibold mb-4">{t('msg.orderSummary')}</h2>

                {/* Coupon */}
                <div className="mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">{appliedCoupon.code}</span>
                      </div>
                      <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-stone-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        placeholder={t('label.couponCode')}
                        className="text-sm"
                      />
                      <Button variant="outline" size="md" onClick={handleApplyCoupon} disabled={applyingCoupon}>
                        {t('action.apply')}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">{t('label.subtotal')}</span>
                    <span className="font-medium">{formatPrice(subtotal, 'USD', lang)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t('label.discount')}</span>
                      <span>-{formatPrice(discount, 'USD', lang)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-400">{t('label.shipping')}</span>
                    <span className="font-medium">{actualShipping === 0 ? t('msg.freeShipping') : formatPrice(actualShipping, 'USD', lang)}</span>
                  </div>
                  <div className="border-t border-stone-200 dark:border-stone-800 pt-2.5 flex justify-between text-base">
                    <span className="font-semibold">{t('label.total')}</span>
                    <span className="font-semibold">{formatPrice(total, 'USD', lang)}</span>
                  </div>
                </div>

                {subtotal < freeShippingThreshold && (
                  <p className="text-xs text-stone-500 mt-3">
                    {t('msg.freeShippingThreshold')} {formatPrice(freeShippingThreshold, 'USD', lang)}
                  </p>
                )}

                <Button onClick={handleCheckout} size="lg" className="w-full mt-6">
                  {t('action.checkout')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
