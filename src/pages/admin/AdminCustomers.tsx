import { useEffect, useState, useCallback } from 'react';
import { Search, Eye, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/format';
import type { Profile, Order } from '@/types';

export function AdminCustomers() {
  const { t, lang } = useI18n();
  const [profiles, setProfiles] = useState<(Profile & { orders?: Order[]; order_count?: number; total_spent?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<(Profile & { orders?: Order[] }) | null>(null);

  const fetchCustomers = useCallback(async () => {
    const { data: profData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!profData) { setLoading(false); return; }

    const enriched = await Promise.all(
      (profData as Profile[]).map(async p => {
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', p.id)
          .order('created_at', { ascending: false });
        const ords = (orders as Order[]) || [];
        return { ...p, orders: ords, order_count: ords.length, total_spent: ords.reduce((s, o) => s + Number(o.grand_total), 0) };
      })
    );
    setProfiles(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = profiles.filter(p =>
    (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search)
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <>
      <SEO title={t('msg.customers')} />
      <h1 className="text-2xl font-semibold mb-6">{t('msg.customers')}</h1>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('action.search')}
          className="w-full pl-10 pr-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 text-sm"
        />
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-lg overflow-hidden product-card-shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 dark:bg-stone-800 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Total Spent</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3 font-medium">{p.full_name || 'N/A'}</td>
                <td className="px-4 py-3 text-stone-500">{p.phone || '-'}</td>
                <td className="px-4 py-3">{p.order_count || 0}</td>
                <td className="px-4 py-3 font-semibold">${(p.total_spent || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-stone-500">{formatDate(p.created_at, lang)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(p)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"><Eye className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{selected.full_name || 'Customer'}</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="text-sm space-y-2 mb-4">
              <p><span className="text-stone-500">Phone:</span> {selected.phone || '-'}</p>
              <p><span className="text-stone-500">Joined:</span> {formatDate(selected.created_at, lang)}</p>
              <p><span className="text-stone-500">Total Orders:</span> {selected.orders?.length || 0}</p>
            </div>
            {selected.orders && selected.orders.length > 0 && (
              <>
                <h3 className="font-medium mb-2">Order History</h3>
                <div className="space-y-2">
                  {selected.orders.map(o => (
                    <div key={o.id} className="flex justify-between text-sm border-b border-stone-100 dark:border-stone-800 pb-2">
                      <div>
                        <p className="font-medium">{o.order_number}</p>
                        <p className="text-xs text-stone-500">{formatDate(o.created_at, lang)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${Number(o.grand_total).toFixed(2)}</p>
                        <p className="text-xs capitalize text-stone-500">{o.order_status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
