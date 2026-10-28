import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Truck, CreditCard, Banknote, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { formatPrice } from '@/lib/format';
import type { Address, ShippingMethod, Coupon } from '@/types';

export function CheckoutPage() {
  const { items, cartId, clearCart } = useCart();
  const { user } = useAuth();
  const { t, tl, lang, dir } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const couponFromUrl = searchParams.get('coupon') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    recipientName: '',
    phone: '',
    country: 'Yemen',
    city: '',
    region: '',
    streetAddress: '',
    additionalDetails: '',
    email: '',
    notes: '',
  });

  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.sale_price && item.product.sale_price < item.product.base_price
      ? item.product.sale_price : item.product?.base_price || 0;
    return sum + price * item.quantity;
  }, 0);

  const discount = coupon
    ? coupon.discount_type === 'percentage'
      ? Math.min(subtotal * (coupon.discount_value / 100), coupon.maximum_discount || Infinity)
      : Math.min(coupon.discount_value, subtotal)
    : 0;
  const shippingMethod = shippingMethods.find(m => m.id === selectedShipping);
  const shippingCost = shippingMethod
    ? (shippingMethod.minimum_order_amount > 0 && subtotal - discount >= shippingMethod.minimum_order_amount ? 0 : shippingMethod.price)
    : 0;
  const total = subtotal - discount + shippingCost;

  useEffect(() => {
    (async () => {
      if (items.length === 0) {
        navigate('/cart');
        return;
      }

      if (user) {
        const { data: addrData } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
        if (addrData) {
          setAddresses(addrData as Address[]);
          const defaultAddr = addrData.find(a => a.is_default);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setForm(f => ({
              ...f,
              recipientName: defaultAddr.recipient_name,
              phone: defaultAddr.phone,
              country: defaultAddr.country,
              city: defaultAddr.city,
              region: defaultAddr.region || '',
              streetAddress: defaultAddr.street_address,
              additionalDetails: defaultAddr.additional_details || '',
            }));
          }
        }
      }

      const { data: methods } = await supabase
        .from('shipping_methods')
        .select('*, shipping_zones!inner(*)')
        .eq('is_active', true)
        .order('price');
      if (methods) {
        setShippingMethods(methods as ShippingMethod[]);
        if (methods.length > 0) setSelectedShipping(methods[0].id);
      }

      if (couponFromUrl) {
        const { data: couponData } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', couponFromUrl.toUpperCase())
          .eq('is_active', true)
          .maybeSingle();
        if (couponData) setCoupon(couponData as Coupon);
      }

      if (user?.email) setForm(f => ({ ...f, email: user.email! }));
      setLoading(false);
    })();
  }, [user, items.length, navigate, couponFromUrl]);

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    const addr = addresses.find(a => a.id === id);
    if (addr) {
      setForm(f => ({
        ...f,
        recipientName: addr.recipient_name,
        phone: addr.phone,
        country: addr.country,
        city: addr.city,
        region: addr.region || '',
        streetAddress: addr.street_address,
        additionalDetails: addr.additional_details || '',
      }));
    }
  };

  const validateForm = () => {
    if (!form.recipientName.trim()) return t('msg.required');
    if (!form.phone.trim()) return t('msg.required');
    if (!form.city.trim()) return t('msg.required');
    if (!form.streetAddress.trim()) return t('msg.required');
    if (!selectedShipping) return t('msg.selectShipping');
    return null;
  };

  const handlePlaceOrder = async () => {
    const error = validateForm();
    if (error) {
      showToast(error, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = items.map(item => ({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
      }));

      const shippingAddress = {
        recipient_name: form.recipientName,
        phone: form.phone,
        country: form.country,
        city: form.city,
        region: form.region,
        street_address: form.streetAddress,
        additional_details: form.additionalDetails,
      };

      const { data, error: rpcError } = await supabase.rpc('create_order', {
        p_customer_name: form.recipientName,
        p_customer_phone: form.phone,
        p_items: JSON.stringify(orderItems),
        p_shipping_address: JSON.stringify(shippingAddress),
        p_user_id: user?.id || null,
        p_customer_email: form.email || user?.email || null,
        p_payment_method: paymentMethod,
        p_coupon_code: coupon?.code || null,
        p_shipping_method_id: selectedShipping,
        p_customer_notes: form.notes || null,
      });

      if (rpcError) throw rpcError;

      const result = data as { order_id?: string; order_number?: string; error?: string };
      if (result?.error) {
        showToast(tl('حدث خطأ: ', 'Error: ') + result.error, 'error');
        setSubmitting(false);
        return;
      }

      await clearCart();
      showToast(t('msg.orderPlacedSuccess') + ' ' + result?.order_number, 'success');
      navigate(`/order-confirmation/${result?.order_number}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('msg.error');
      showToast(msg, 'error');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <>
      <SEO title={t('action.checkout')} />
      <div className="container-velora py-8">
        <h1 className="text-2xl font-semibold mb-8">{t('action.checkout')}</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Saved addresses */}
            {user && addresses.length > 0 && (
              <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow">
                <h2 className="font-medium mb-4">{t('msg.useSavedAddress')}</h2>
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <button
                      key={addr.id}
                      onClick={() => handleAddressSelect(addr.id)}
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        selectedAddressId === addr.id
                          ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-800'
                          : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                    >
                      <p className="text-sm font-medium">{addr.recipient_name}</p>
                      <p className="text-xs text-stone-500">{addr.street_address}, {addr.city}, {addr.country}</p>
                      <p className="text-xs text-stone-500">{addr.phone}</p>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-stone-500 mt-3">{t('msg.orEnterNew')}</p>
              </div>
            )}

            {/* Delivery info form */}
            <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow">
              <h2 className="font-medium mb-4">{t('msg.deliveryInfo')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label={t('msg.recipientName')} value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} required />
                <Input label={t('label.phone')} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
                {!user && (
                  <Input label={t('label.email')} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                )}
                <Select label={t('label.country')} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                  <option>Yemen</option>
                  <option>Saudi Arabia</option>
                  <option>UAE</option>
                  <option>Kuwait</option>
                  <option>Qatar</option>
                  <option>Bahrain</option>
                  <option>Oman</option>
                  <option>Other</option>
                </Select>
                <Input label={t('label.city')} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
                <Input label={t('label.region')} value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
                <Input label={t('label.address')} value={form.streetAddress} onChange={e => setForm(f => ({ ...f, streetAddress: e.target.value }))} required className="sm:col-span-2" />
                <Input label={t('msg.additionalDetails')} value={form.additionalDetails} onChange={e => setForm(f => ({ ...f, additionalDetails: e.target.value }))} className="sm:col-span-2" />
                <Input label={t('msg.customerNotes')} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="sm:col-span-2" />
              </div>
            </div>

            {/* Shipping method */}
            <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow">
              <h2 className="font-medium mb-4">{t('msg.shippingMethod')}</h2>
              <div className="space-y-2">
                {shippingMethods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedShipping(m.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-md border transition-colors ${
                      selectedShipping === m.id
                        ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-800'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-stone-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{lang === 'ar' ? m.name_ar : m.name_en}</p>
                        <p className="text-xs text-stone-500">{lang === 'ar' ? m.delivery_estimate_ar : m.delivery_estimate_en}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {m.minimum_order_amount > 0 && subtotal >= m.minimum_order_amount ? t('msg.freeShipping') : formatPrice(m.price, 'USD', lang)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow">
              <h2 className="font-medium mb-4">{t('label.paymentMethod')}</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full flex items-center gap-3 p-3 rounded-md border transition-colors ${
                    paymentMethod === 'cod'
                      ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-800'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-stone-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{t('msg.cod')}</p>
                    <p className="text-xs text-stone-500">{t('msg.cashOnDeliveryNote')}</p>
                  </div>
                </button>
                <div className="flex items-center gap-3 p-3 rounded-md border border-stone-200 dark:border-stone-700 opacity-50 cursor-not-allowed">
                  <CreditCard className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-sm font-medium">{t('msg.onlinePayment')}</p>
                    <p className="text-xs text-stone-500">{tl('غير متاح حالياً', 'Not available yet')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow sticky top-24">
              <h2 className="font-medium mb-4">{t('msg.orderSummary')}</h2>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map(item => {
                  const product = item.product;
                  if (!product) return null;
                  const price = product.sale_price && product.sale_price < product.base_price ? product.sale_price : product.base_price;
                  const img = product.product_images?.find(i => i.is_primary) || product.product_images?.[0];
                  return (
                    <div key={item.id} className="flex gap-3 text-sm">
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-stone-100 flex-shrink-0">
                        {img?.image_url && <img src={img.image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lang === 'ar' ? product.name_ar : product.name_en}</p>
                        <p className="text-xs text-stone-500">{item.quantity} x {formatPrice(price, 'USD', lang)}</p>
                      </div>
                      <span className="font-medium">{formatPrice(price * item.quantity, 'USD', lang)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm border-t border-stone-200 dark:border-stone-800 pt-4">
                <div className="flex justify-between">
                  <span className="text-stone-500">{t('label.subtotal')}</span>
                  <span>{formatPrice(subtotal, 'USD', lang)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('label.discount')}</span>
                    <span>-{formatPrice(discount, 'USD', lang)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">{t('label.shipping')}</span>
                  <span>{shippingCost === 0 ? t('msg.freeShipping') : formatPrice(shippingCost, 'USD', lang)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t border-stone-200 dark:border-stone-800 pt-2">
                  <span>{t('label.total')}</span>
                  <span>{formatPrice(total, 'USD', lang)}</span>
                </div>
              </div>

              <Button onClick={handlePlaceOrder} size="lg" className="w-full mt-6" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : <>{t('action.placeOrder')} <ArrowIcon className="w-4 h-4 inline mr-1 rtl:mr-0 rtl:ml-1" /></>}
              </Button>

              {!user && (
                <p className="text-xs text-stone-500 mt-3 text-center">
                  {t('msg.guestCheckout')} - <Link to="/signin" className="underline">{t('action.signIn')}</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
