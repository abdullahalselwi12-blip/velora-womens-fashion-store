import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice, formatDate } from '@/lib/format';
import type { Order, Product, ProductVariant } from '@/types';

export function AdminOverview() {
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, products: 0, avgOrder: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<(ProductVariant & { product?: Product })[]>([]);

  useEffect(() => {
    (async () => {
      const [ordersRes, productsRes, customersRes, variantsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('product_variants').select('*, product:products(name_en, name_ar)').lt('stock_quantity', 10).order('stock_quantity').limit(10),
      ]);

      const orders = (ordersRes.data as Order[]) || [];
      const revenue = orders.filter(o => o.payment_status === 'paid' || o.payment_method === 'cod').reduce((sum, o) => sum + Number(o.grand_total), 0);

      setStats({
        revenue,
        orders: orders.length,
        customers: customersRes.count || 0,
        products: productsRes.count || 0,
        avgOrder: orders.length > 0 ? revenue / orders.length : 0,
      });
      setRecentOrders(orders.slice(0, 5));
      setLowStock((variantsRes.data as (ProductVariant & { product?: Product })[]) || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  const statCards = [
    { label: t('msg.revenue'), value: formatPrice(stats.revenue, 'USD', lang), icon: DollarSign, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { label: t('msg.totalOrders'), value: stats.orders, icon: ShoppingCart, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: t('msg.totalCustomers'), value: stats.customers, icon: Users, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    { label: t('msg.totalProducts'), value: stats.products, icon: Package, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: t('msg.avgOrderValue'), value: formatPrice(stats.avgOrder, 'USD', lang), icon: TrendingUp, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  ];

  return (
    <>
      <SEO title={t('msg.overview')} />
      <h1 className="text-2xl font-semibold mb-6">{t('msg.overview')}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-white dark:bg-stone-900 rounded-lg p-4 product-card-shadow">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-stone-500">{card.label}</p>
            <p className="text-lg font-semibold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">{t('msg.recentOrders')}</h2>
            <Link to="/admin/orders" className="text-xs text-rose-600 hover:underline">{t('action.viewAll')}</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-stone-500 py-4 text-center">{t('msg.noOrders')}</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <Link key={order.id} to="/admin/orders" className="flex items-center justify-between p-3 border border-stone-100 dark:border-stone-800 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{order.order_number}</p>
                    <p className="text-xs text-stone-500">{order.customer_name} - {formatDate(order.created_at, lang)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(order.grand_total, order.currency, lang)}</p>
                    <p className="text-xs capitalize text-stone-500">{order.order_status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> {t('msg.lowStock')}</h2>
            <Link to="/admin/inventory" className="text-xs text-rose-600 hover:underline">{t('action.viewAll')}</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-stone-500 py-4 text-center">{t('msg.lowStock')}</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 border border-stone-100 dark:border-stone-800 rounded-md">
                  <div>
                    <p className="text-sm font-medium">{v.product ? (lang === 'ar' ? v.product.name_ar : v.product.name_en) : 'N/A'}</p>
                    <p className="text-xs text-stone-500">{v.size} - {v.color_name_en}</p>
                  </div>
                  <span className={`text-sm font-semibold ${v.stock_quantity <= 5 ? 'text-red-500' : 'text-amber-500'}`}>
                    {v.stock_quantity} {t('msg.stock')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
