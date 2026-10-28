import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDate } from '@/lib/format';
import type { Order } from '@/types';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const { t, tl, lang, dir } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderNumber)
        .maybeSingle();
      if (data) setOrder(data as Order);
      setLoading(false);
    })();
  }, [orderNumber]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!order) return (
    <div className="container-velora py-20 text-center">
      <h1 className="text-2xl font-semibold mb-4">{t('msg.orderNotFound')}</h1>
      <Link to="/products"><Button>{t('action.backToShop')}</Button></Link>
    </div>
  );

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <>
      <SEO title={`${t('msg.orderDetails')} - ${order.order_number}`} />
      <div className="container-velora py-12 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">{t('msg.orderPlacedSuccess')}</h1>
          <p className="text-lg font-medium text-stone-600 dark:text-stone-400">{order.order_number}</p>
          <p className="text-sm text-stone-500 mt-2">{t('msg.thankYouForOrder')}</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-stone-500">{t('msg.orderDate')}</p>
              <p className="font-medium">{formatDate(order.created_at, lang)}</p>
            </div>
            <div>
              <p className="text-stone-500">{t('label.orderStatus')}</p>
              <p className="font-medium capitalize">{order.order_status}</p>
            </div>
            <div>
              <p className="text-stone-500">{t('label.paymentStatus')}</p>
              <p className="font-medium capitalize">{order.payment_status}</p>
            </div>
            <div>
              <p className="text-stone-500">{t('label.paymentMethod')}</p>
              <p className="font-medium">{order.payment_method === 'cod' ? t('msg.cod') : t('msg.onlinePayment')}</p>
            </div>
          </div>

          {/* Order items */}
          <h3 className="font-medium mb-3">{t('msg.orderItems')}</h3>
          <div className="space-y-3">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex justify-between text-sm border-b border-stone-100 dark:border-stone-800 pb-3">
                <div>
                  <p className="font-medium">{item.product_name_snapshot}</p>
                  <p className="text-xs text-stone-500">
                    {item.size_snapshot && `${t('label.size')}: ${item.size_snapshot}`}
                    {item.color_snapshot && ` | ${t('label.color')}: ${item.color_snapshot}`}
                    {` | ${item.quantity} x ${formatPrice(item.unit_price, order.currency, lang)}`}
                  </p>
                </div>
                <span className="font-medium">{formatPrice(item.line_total, order.currency, lang)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">{t('label.subtotal')}</span><span>{formatPrice(order.subtotal, order.currency, lang)}</span></div>
            {order.discount_total > 0 && <div className="flex justify-between text-green-600"><span>{t('label.discount')}</span><span>-{formatPrice(order.discount_total, order.currency, lang)}</span></div>}
            <div className="flex justify-between"><span className="text-stone-500">{t('label.shipping')}</span><span>{order.shipping_total === 0 ? t('msg.freeShipping') : formatPrice(order.shipping_total, order.currency, lang)}</span></div>
            <div className="flex justify-between font-semibold text-base border-t border-stone-200 dark:border-stone-800 pt-2"><span>{t('label.total')}</span><span>{formatPrice(order.grand_total, order.currency, lang)}</span></div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow mb-6">
          <h3 className="font-medium mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> {t('msg.shippingAddress')}</h3>
          <div className="text-sm text-stone-600 dark:text-stone-400">
            <p>{(order.shipping_address_snapshot as { recipient_name?: string }).recipient_name || order.customer_name}</p>
            <p>{(order.shipping_address_snapshot as { street_address?: string }).street_address}</p>
            <p>{(order.shipping_address_snapshot as { city?: string }).city}, {(order.shipping_address_snapshot as { country?: string }).country}</p>
            <p>{order.customer_phone}</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link to="/products"><Button>{t('action.continueShopping')} <ArrowIcon className="w-4 h-4 inline" /></Button></Link>
          {order.user_id && <Link to="/account/orders"><Button variant="outline">{t('label.orderHistory')}</Button></Link>}
        </div>
      </div>
    </>
  );
}
