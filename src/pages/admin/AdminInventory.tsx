import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Minus, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { ProductVariant, Product } from '@/types';

export function AdminInventory() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const [variants, setVariants] = useState<(ProductVariant & { product?: Product })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [editing, setEditing] = useState<Record<string, number>>({});

  const fetchVariants = useCallback(async () => {
    const { data } = await supabase
      .from('product_variants')
      .select('*, product:products(name_en, name_ar, slug)')
      .order('created_at', { ascending: false });
    if (data) setVariants(data as (ProductVariant & { product?: Product })[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  const filtered = variants.filter(v => {
    const matchesSearch = v.product && (
      v.product.name_en.toLowerCase().includes(search.toLowerCase()) ||
      v.product.name_ar.includes(search) ||
      (v.sku || '').toLowerCase().includes(search.toLowerCase())
    );
    const matchesStock = stockFilter === 'all' ? true :
      stockFilter === 'low' ? v.stock_quantity < 10 :
      stockFilter === 'out' ? v.stock_quantity === 0 :
      stockFilter === 'in' ? v.stock_quantity >= 10 : true;
    return matchesSearch && matchesStock;
  });

  const handleStockChange = (id: string, value: number) => {
    setEditing(prev => ({ ...prev, [id]: Math.max(0, value) }));
  };

  const handleSaveStock = async (variant: ProductVariant) => {
    const newStock = editing[variant.id];
    if (newStock === undefined) return;
    const change = newStock - variant.stock_quantity;
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({ stock_quantity: newStock })
      .eq('id', variant.id);
    if (updateError) { showToast(t('msg.error'), 'error'); return; }

    if (change !== 0) {
      await supabase.from('inventory_movements').insert({
        product_variant_id: variant.id,
        quantity_change: change,
        movement_type: 'adjustment',
        reason: 'Manual stock adjustment',
      });
    }
    showToast(t('msg.saved'), 'success');
    setEditing(prev => { const n = { ...prev }; delete n[variant.id]; return n; });
    fetchVariants();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <>
      <SEO title={t('msg.inventory')} />
      <h1 className="text-2xl font-semibold mb-6">{t('msg.inventory')}</h1>

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
        <Select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="w-auto">
          <option value="all">All Stock</option>
          <option value="in">In Stock (10+)</option>
          <option value="low">Low Stock (&lt;10)</option>
          <option value="out">Out of Stock (0)</option>
        </Select>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-lg overflow-hidden product-card-shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 dark:bg-stone-800 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Color</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {filtered.map(v => (
              <tr key={v.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3 font-medium">
                  {v.product ? (lang === 'ar' ? v.product.name_ar : v.product.name_en) : 'N/A'}
                </td>
                <td className="px-4 py-3 text-stone-500">{v.sku || '-'}</td>
                <td className="px-4 py-3">{v.size || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {v.color_code && <span className="w-4 h-4 rounded-full border border-stone-300" style={{ backgroundColor: v.color_code }} />}
                    <span>{lang === 'ar' ? v.color_name_ar : v.color_name_en}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="inline-flex items-center border border-stone-300 dark:border-stone-700 rounded-md">
                    <button onClick={() => handleStockChange(v.id, (editing[v.id] !== undefined ? editing[v.id] : v.stock_quantity) - 1)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700">
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={editing[v.id] !== undefined ? editing[v.id] : v.stock_quantity}
                      onChange={e => handleStockChange(v.id, Number(e.target.value))}
                      className="w-14 text-center bg-transparent text-sm outline-none"
                    />
                    <button onClick={() => handleStockChange(v.id, (editing[v.id] !== undefined ? editing[v.id] : v.stock_quantity) + 1)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editing[v.id] !== undefined && editing[v.id] !== v.stock_quantity && (
                    <button onClick={() => handleSaveStock(v)} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200">
                      <Save className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
