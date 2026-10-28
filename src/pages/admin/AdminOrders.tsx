import { useEffect, useState, useCallback } from 'react';
import { Search, Eye, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { formatPrice, formatDate } from '@/lib/format';
import type { Order } from '@/types';

export function AdminOrders() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('order_status', statusFilter);
    const { data } = await query;
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_phone.includes(search)
  );

  const handleUpdateStatus = async (id: string, field: 'order_status' | 'payment_status' | 'tracking_number', value: string) => {
    setUpdating(true);
    const { error } = await supabase.from('orders').update({ [field]: value }).eq('id', id);
    if (error) { showToast(t('msg.error'), 'error'); }
    else {
      showToast(t('msg.updated'), 'success');
      if (selectedOrder?.id === id) {
        setSelectedOrder({ ...selectedOrder, [field]: value });
      }
      fetchOrders();
    }
    setUpdating(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <>
      <SEO title={t('msg.orders')} />
      <h1 className="text-2xl font-semibold mb-6">{t('msg.orders')}</h1>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('action.search')}
            className="w-full pl-10 pr-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 text-sm"
          />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-auto">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-lg overflow-hidden product-card-shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 dark:bg-stone-800 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t('label.orderNumber')}</th>
              <th className="px-4 py-3 font-medium">{t('msg.customerInfo')}</th>
              <th className="px-4 py-3 font-medium">{t('label.total')}</th>
              <th className="px-4 py-3 font-medium">{t('label.orderStatus')}</th>
              <th className="px-4 py-3 font-medium">{t('label.paymentStatus')}</th>
              <th className="px-4 py-3 font-medium">{t('msg.orderDate')}</th>
              <th className="px-4 py-3 font-medium">{t('msg.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {filtered.map(order => (
              <tr key={order.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3 font-medium">{order.order_number}</td>
                <td className="px-4 py-3">
                  <p>{order.customer_name}</p>
                  <p className="text-xs text-stone-500">{order.customer_phone}</p>
                </td>
                <td className="px-4 py-3 font-semibold">{formatPrice(order.grand_total, order.currency, lang)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                    order.order_status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{order.order_status}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                    order.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-stone-100 text-stone-600'
                  }`}>{order.payment_status}</span>
                </td>
                <td className="px-4 py-3 text-stone-500">{formatDate(order.created_at, lang)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedOrder(order)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"><Eye className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)}><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><p className="text-stone-500">{t('msg.customerInfo')}</p><p className="font-medium">{selectedOrder.customer_name}</p><p className="text-stone-500">{selectedOrder.customer_phone}</p></div>
              <div><p className="text-stone-500">{t('msg.orderDate')}</p><p className="font-medium">{formatDate(selectedOrder.created_at, lang)}</p></div>
            </div>

            {/* Status controls */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Select label={t('label.orderStatus')} value={selectedOrder.order_status} onChange={e => handleUpdateStatus(selectedOrder.id, 'order_status', e.target.value)} disabled={updating}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <Select label={t('label.paymentStatus')} value={selectedOrder.payment_status} onChange={e => handleUpdateStatus(selectedOrder.id, 'payment_status', e.target.value)} disabled={updating}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </Select>
            </div>

            <input
              type="text"
              placeholder={t('label.trackingNumber')}
              value={selectedOrder.tracking_number || ''}
              onChange={e => setSelectedOrder({ ...selectedOrder, tracking_number: e.target.value })}
              onBlur={e => e.target.value && handleUpdateStatus(selectedOrder.id, 'tracking_number', e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 text-sm mb-4"
            />

            {/* Order items */}
            <h3 className="font-medium mb-2">{t('msg.orderItems')}</h3>
            <div className="space-y-2 mb-4">
              {selectedOrder.order_items?.map(item => (
                <div key={item.id} className="flex justify-between text-sm border-b border-stone-100 dark:border-stone-800 pb-2">
                  <div>
                    <p className="font-medium">{item.product_name_snapshot}</p>
                    <p className="text-xs text-stone-500">{item.quantity} x {formatPrice(item.unit_price, selectedOrder.currency, lang)}</p>
                  </div>
                  <span className="font-medium">{formatPrice(item.line_total, selectedOrder.currency, lang)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-sm border-t border-stone-200 dark:border-stone-800 pt-3">
              <div className="flex justify-between"><span className="text-stone-500">{t('label.subtotal')}</span><span>{formatPrice(selectedOrder.subtotal, selectedOrder.currency, lang)}</span></div>
              {selectedOrder.discount_total > 0 && <div className="flex justify-between text-green-600"><span>{t('label.discount')}</span><span>-{formatPrice(selectedOrder.discount_total, selectedOrder.currency, lang)}</span></div>}
              <div className="flex justify-between"><span className="text-stone-500">{t('label.shipping')}</span><span>{formatPrice(selectedOrder.shipping_total, selectedOrder.currency, lang)}</span></div>
              <div className="flex justify-between font-semibold text-base border-t border-stone-200 dark:border-stone-800 pt-2"><span>{t('label.total')}</span><span>{formatPrice(selectedOrder.grand_total, selectedOrder.currency, lang)}</span></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
