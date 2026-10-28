import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Copy, Eye, EyeOff, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { formatPrice, slugify } from '@/lib/format';
import type { Product, Category } from '@/types';

export function AdminProducts() {
  const { t, lang, tl } = useI18n();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({
    name_ar: '', name_en: '', slug: '', description_ar: '', description_en: '',
    short_description_ar: '', short_description_en: '', base_price: 0, sale_price: '',
    currency: 'USD', sku: '', category_id: '', brand: 'VELORA', product_status: 'draft',
    is_featured: false, is_new_arrival: false, is_best_seller: false,
  });

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });
    if (data) setProducts(data as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    supabase.from('categories').select('*').order('display_order').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, [fetchProducts]);

  const filtered = products.filter(p =>
    p.name_en.toLowerCase().includes(search.toLowerCase()) ||
    p.name_ar.includes(search) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name_ar: product.name_ar, name_en: product.name_en, slug: product.slug,
      description_ar: product.description_ar || '', description_en: product.description_en || '',
      short_description_ar: product.short_description_ar || '', short_description_en: product.short_description_en || '',
      base_price: product.base_price, sale_price: product.sale_price?.toString() || '',
      currency: product.currency, sku: product.sku || '', category_id: product.category_id || '',
      brand: product.brand || 'VELORA', product_status: product.product_status,
      is_featured: product.is_featured, is_new_arrival: product.is_new_arrival, is_best_seller: product.is_best_seller,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingId('');
    setForm({
      name_ar: '', name_en: '', slug: '', description_ar: '', description_en: '',
      short_description_ar: '', short_description_en: '', base_price: 0, sale_price: '',
      currency: 'USD', sku: '', category_id: '', brand: 'VELORA', product_status: 'draft',
      is_featured: false, is_new_arrival: false, is_best_seller: false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      slug: form.slug || slugify(form.name_en),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      base_price: Number(form.base_price),
      category_id: form.category_id || null,
      published_at: form.product_status === 'published' ? new Date().toISOString() : null,
    };

    if (editingId) {
      const { error } = await supabase.from('products').update(data).eq('id', editingId);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.updated'), 'success');
    } else {
      const { error } = await supabase.from('products').insert(data);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.created'), 'success');
    }
    setShowForm(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('msg.confirmDelete'))) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { showToast(t('msg.error'), 'error'); return; }
    showToast(t('msg.deleted'), 'success');
    fetchProducts();
  };

  const handleTogglePublish = async (product: Product) => {
    const newStatus = product.product_status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('products')
      .update({ product_status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null })
      .eq('id', product.id);
    if (error) { showToast(t('msg.error'), 'error'); return; }
    showToast(t('msg.updated'), 'success');
    fetchProducts();
  };

  const handleDuplicate = async (product: Product) => {
    const { error } = await supabase.from('products').insert({
      name_ar: product.name_ar + ' (copy)', name_en: product.name_en + ' (copy)',
      slug: slugify(product.name_en + '-copy-' + Date.now()),
      description_ar: product.description_ar, description_en: product.description_en,
      short_description_ar: product.short_description_ar, short_description_en: product.short_description_en,
      base_price: product.base_price, sale_price: product.sale_price, currency: product.currency,
      sku: product.sku + '-COPY', category_id: product.category_id, brand: product.brand,
      product_status: 'draft',
    });
    if (error) { showToast(t('msg.error'), 'error'); return; }
    showToast(t('msg.created'), 'success');
    fetchProducts();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <>
      <SEO title={t('msg.products')} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t('msg.products')}</h1>
        <Button onClick={handleNew}><Plus className="w-4 h-4 mr-1" /> {t('msg.addProduct')}</Button>
      </div>

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

      {/* Products table */}
      <div className="bg-white dark:bg-stone-900 rounded-lg overflow-hidden product-card-shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 dark:bg-stone-800 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t('msg.productName')}</th>
              <th className="px-4 py-3 font-medium">{t('msg.sku')}</th>
              <th className="px-4 py-3 font-medium">{t('msg.price')}</th>
              <th className="px-4 py-3 font-medium">{t('msg.category')}</th>
              <th className="px-4 py-3 font-medium">{t('msg.status')}</th>
              <th className="px-4 py-3 font-medium">{t('msg.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{lang === 'ar' ? p.name_ar : p.name_en}</p>
                  <p className="text-xs text-stone-500">{p.brand}</p>
                </td>
                <td className="px-4 py-3 text-stone-500">{p.sku || '-'}</td>
                <td className="px-4 py-3">
                  {p.sale_price ? (
                    <div>
                      <span className="text-rose-600 font-medium">{formatPrice(p.sale_price, p.currency, lang)}</span>
                      <span className="text-xs text-stone-400 line-through ml-1">{formatPrice(p.base_price, p.currency, lang)}</span>
                    </div>
                  ) : formatPrice(p.base_price, p.currency, lang)}
                </td>
                <td className="px-4 py-3 text-stone-500">
                  {p.category ? (lang === 'ar' ? p.category.name_ar : p.category.name_en) : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                    p.product_status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    p.product_status === 'draft' ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {p.product_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded" title={t('msg.edit')}><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleTogglePublish(p)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded" title={p.product_status === 'published' ? t('msg.unpublish') : t('msg.publish')}>
                      {p.product_status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDuplicate(p)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded" title={t('msg.duplicate')}><Copy className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500" title={t('msg.delete')}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editingId ? t('msg.editProduct') : t('msg.addProduct')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label={`${t('msg.productName')} (EN)`} value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} required />
                <Input label={`${t('msg.productName')} (AR)`} value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} required />
                <Input label="Slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" />
                <Input label={t('msg.sku')} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                <Input label={t('msg.price')} type="number" step="0.01" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: Number(e.target.value) }))} required />
                <Input label={t('msg.salePrice')} type="number" step="0.01" value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} />
                <Select label={t('msg.category')} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">--</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_en} / {c.name_ar}</option>)}
                </Select>
                <Select label={t('msg.status')} value={form.product_status} onChange={e => setForm(f => ({ ...f, product_status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>
                <Input label={t('msg.brand')} value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
              </div>
              <Textarea label={`${t('label.description')} (EN)`} rows={3} value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} />
              <Textarea label={`${t('label.description')} (AR)`} rows={3} value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} />
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} /> {t('label.featured')}</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_new_arrival} onChange={e => setForm(f => ({ ...f, is_new_arrival: e.target.checked }))} /> {t('label.new')}</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_best_seller} onChange={e => setForm(f => ({ ...f, is_best_seller: e.target.checked }))} /> {t('label.bestSeller')}</label>
              </div>
              <div className="flex gap-3">
                <Button type="submit">{editingId ? t('action.update') : t('action.create')}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t('msg.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
