import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { formatDate } from '@/lib/format';
import type { Coupon, Banner } from '@/types';

export function AdminPromotions() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'coupons' | 'banners'>('coupons');
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState('');
  const [editingBannerId, setEditingBannerId] = useState('');
  const [couponForm, setCouponForm] = useState({
    code: '', discount_type: 'percentage', discount_value: 0, minimum_order_amount: 0,
    maximum_discount: '', usage_limit: '', is_active: true, starts_at: '', expires_at: '',
  });
  const [bannerForm, setBannerForm] = useState({
    title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '', image_url: '',
    destination_url: '', display_order: 0, is_active: true,
  });

  const fetchData = useCallback(async () => {
    const [cRes, bRes] = await Promise.all([
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('banners').select('*').order('display_order'),
    ]);
    if (cRes.data) setCoupons(cRes.data as Coupon[]);
    if (bRes.data) setBanners(bRes.data as Banner[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      code: couponForm.code.toUpperCase(),
      discount_type: couponForm.discount_type,
      discount_value: Number(couponForm.discount_value),
      minimum_order_amount: Number(couponForm.minimum_order_amount),
      maximum_discount: couponForm.maximum_discount ? Number(couponForm.maximum_discount) : null,
      usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
      is_active: couponForm.is_active,
      starts_at: couponForm.starts_at || null,
      expires_at: couponForm.expires_at || null,
    };
    if (editingCouponId) {
      const { error } = await supabase.from('coupons').update(data).eq('id', editingCouponId);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.updated'), 'success');
    } else {
      const { error } = await supabase.from('coupons').insert(data);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.created'), 'success');
    }
    setShowCouponForm(false);
    setEditingCouponId('');
    fetchData();
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...bannerForm };
    if (editingBannerId) {
      const { error } = await supabase.from('banners').update(data).eq('id', editingBannerId);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.updated'), 'success');
    } else {
      const { error } = await supabase.from('banners').insert(data);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.created'), 'success');
    }
    setShowBannerForm(false);
    setEditingBannerId('');
    fetchData();
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm(t('msg.confirmDelete'))) return;
    await supabase.from('coupons').delete().eq('id', id);
    showToast(t('msg.deleted'), 'success');
    fetchData();
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm(t('msg.confirmDelete'))) return;
    await supabase.from('banners').delete().eq('id', id);
    showToast(t('msg.deleted'), 'success');
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <>
      <SEO title={t('msg.promotions')} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t('msg.promotions')}</h1>
      </div>

      <div className="flex gap-2 mb-6 border-b border-stone-200 dark:border-stone-800">
        {(['coupons', 'banners'] as const).map(tb => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              tab === tb ? 'border-stone-900 dark:border-stone-100' : 'border-transparent text-stone-500'
            }`}
          >
            {tb}
          </button>
        ))}
      </div>

      {tab === 'coupons' && (
        <>
          <Button onClick={() => { setEditingCouponId(''); setCouponForm({ code: '', discount_type: 'percentage', discount_value: 0, minimum_order_amount: 0, maximum_discount: '', usage_limit: '', is_active: true, starts_at: '', expires_at: '' }); setShowCouponForm(true); }} className="mb-4">
            <Plus className="w-4 h-4 mr-1" /> Add Coupon
          </Button>
          <div className="bg-white dark:bg-stone-900 rounded-lg overflow-hidden product-card-shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">Usage</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {coupons.map(c => (
                  <tr key={c.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <td className="px-4 py-3 font-medium font-mono">{c.code}</td>
                    <td className="px-4 py-3 capitalize">{c.discount_type}</td>
                    <td className="px-4 py-3">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                    <td className="px-4 py-3 text-stone-500">{c.usage_count}/{c.usage_limit || '∞'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setEditingCouponId(c.id); setCouponForm({ code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, minimum_order_amount: c.minimum_order_amount, maximum_discount: c.maximum_discount?.toString() || '', usage_limit: c.usage_limit?.toString() || '', is_active: c.is_active, starts_at: c.starts_at || '', expires_at: c.expires_at || '' }); setShowCouponForm(true); }} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteCoupon(c.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showCouponForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCouponForm(false)}>
              <div className="bg-white dark:bg-stone-900 rounded-lg p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-4">{editingCouponId ? 'Edit Coupon' : 'Add Coupon'}</h2>
                <form onSubmit={handleCouponSubmit} className="space-y-4">
                  <Input label="Code" value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value }))} required />
                  <Select label="Discount Type" value={couponForm.discount_type} onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value }))}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </Select>
                  <Input label="Discount Value" type="number" step="0.01" value={couponForm.discount_value} onChange={e => setCouponForm(f => ({ ...f, discount_value: Number(e.target.value) }))} required />
                  <Input label="Minimum Order Amount" type="number" step="0.01" value={couponForm.minimum_order_amount} onChange={e => setCouponForm(f => ({ ...f, minimum_order_amount: Number(e.target.value) }))} />
                  <Input label="Maximum Discount" type="number" step="0.01" value={couponForm.maximum_discount} onChange={e => setCouponForm(f => ({ ...f, maximum_discount: e.target.value }))} />
                  <Input label="Usage Limit" type="number" value={couponForm.usage_limit} onChange={e => setCouponForm(f => ({ ...f, usage_limit: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Starts At" type="datetime-local" value={couponForm.starts_at} onChange={e => setCouponForm(f => ({ ...f, starts_at: e.target.value }))} />
                    <Input label="Expires At" type="datetime-local" value={couponForm.expires_at} onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))} />
                  </div>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={couponForm.is_active} onChange={e => setCouponForm(f => ({ ...f, is_active: e.target.checked }))} /> Active</label>
                  <div className="flex gap-3">
                    <Button type="submit">{editingCouponId ? t('action.update') : t('action.create')}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCouponForm(false)}>{t('msg.cancel')}</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'banners' && (
        <>
          <Button onClick={() => { setEditingBannerId(''); setBannerForm({ title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '', image_url: '', destination_url: '', display_order: 0, is_active: true }); setShowBannerForm(true); }} className="mb-4">
            <Plus className="w-4 h-4 mr-1" /> Add Banner
          </Button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map(b => (
              <div key={b.id} className="bg-white dark:bg-stone-900 rounded-lg overflow-hidden product-card-shadow">
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <p className="font-medium text-sm">{lang === 'ar' ? b.title_ar : b.title_en}</p>
                  <p className="text-xs text-stone-500 mb-2">{lang === 'ar' ? b.subtitle_ar : b.subtitle_en}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>{b.is_active ? 'Active' : 'Inactive'}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingBannerId(b.id); setBannerForm({ title_ar: b.title_ar, title_en: b.title_en, subtitle_ar: b.subtitle_ar || '', subtitle_en: b.subtitle_en || '', image_url: b.image_url || '', destination_url: b.destination_url || '', display_order: b.display_order, is_active: b.is_active }); setShowBannerForm(true); }} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteBanner(b.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showBannerForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowBannerForm(false)}>
              <div className="bg-white dark:bg-stone-900 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-4">{editingBannerId ? 'Edit Banner' : 'Add Banner'}</h2>
                <form onSubmit={handleBannerSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Title (EN)" value={bannerForm.title_en} onChange={e => setBannerForm(f => ({ ...f, title_en: e.target.value }))} required />
                    <Input label="Title (AR)" value={bannerForm.title_ar} onChange={e => setBannerForm(f => ({ ...f, title_ar: e.target.value }))} required />
                    <Input label="Subtitle (EN)" value={bannerForm.subtitle_en} onChange={e => setBannerForm(f => ({ ...f, subtitle_en: e.target.value }))} />
                    <Input label="Subtitle (AR)" value={bannerForm.subtitle_ar} onChange={e => setBannerForm(f => ({ ...f, subtitle_ar: e.target.value }))} />
                  </div>
                  <Input label="Image URL" value={bannerForm.image_url} onChange={e => setBannerForm(f => ({ ...f, image_url: e.target.value }))} />
                  <Input label="Destination URL" value={bannerForm.destination_url} onChange={e => setBannerForm(f => ({ ...f, destination_url: e.target.value }))} />
                  <Input label="Display Order" type="number" value={bannerForm.display_order} onChange={e => setBannerForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
                  <label className="flex items-center gap-2"><input type="checkbox" checked={bannerForm.is_active} onChange={e => setBannerForm(f => ({ ...f, is_active: e.target.checked }))} /> Active</label>
                  <div className="flex gap-3">
                    <Button type="submit">{editingBannerId ? t('action.update') : t('action.create')}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowBannerForm(false)}>{t('msg.cancel')}</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
