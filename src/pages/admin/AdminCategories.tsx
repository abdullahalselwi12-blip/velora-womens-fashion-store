import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Folder } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { slugify } from '@/lib/format';
import type { Category } from '@/types';

export function AdminCategories() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({
    name_ar: '', name_en: '', slug: '', description_ar: '', description_en: '',
    parent_id: '', display_order: 0, is_active: true, image_url: '',
  });

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('display_order');
    if (data) setCategories(data as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name_ar: cat.name_ar, name_en: cat.name_en, slug: cat.slug,
      description_ar: cat.description_ar || '', description_en: cat.description_en || '',
      parent_id: cat.parent_id || '', display_order: cat.display_order, is_active: cat.is_active,
      image_url: cat.image_url || '',
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingId('');
    setForm({ name_ar: '', name_en: '', slug: '', description_ar: '', description_en: '', parent_id: '', display_order: 0, is_active: true, image_url: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      slug: form.slug || slugify(form.name_en),
      parent_id: form.parent_id || null,
    };
    if (editingId) {
      const { error } = await supabase.from('categories').update(data).eq('id', editingId);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.updated'), 'success');
    } else {
      const { error } = await supabase.from('categories').insert(data);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.created'), 'success');
    }
    setShowForm(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('msg.confirmDelete'))) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { showToast(t('msg.error'), 'error'); return; }
    showToast(t('msg.deleted'), 'success');
    fetchCategories();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <>
      <SEO title={t('msg.categories')} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t('msg.categories')}</h1>
        <Button onClick={handleNew}><Plus className="w-4 h-4 mr-1" /> {t('msg.addCategory')}</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-stone-900 rounded-lg p-4 product-card-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-stone-400" />
                <div>
                  <p className="font-medium text-sm">{lang === 'ar' ? cat.name_ar : cat.name_en}</p>
                  <p className="text-xs text-stone-500">{cat.slug}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                {cat.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-3 line-clamp-2">{lang === 'ar' ? cat.description_ar : cat.description_en}</p>
            <div className="flex gap-1">
              <button onClick={() => handleEdit(cat)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editingId ? t('msg.editCategory') : t('msg.addCategory')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Name (EN)" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} required />
                <Input label="Name (AR)" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} required />
                <Input label="Slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto" />
                <Input label="Display Order" type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
                <Input label="Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="sm:col-span-2" />
              </div>
              <Textarea label="Description (EN)" rows={2} value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} />
              <Textarea label="Description (AR)" rows={2} value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} />
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> Active</label>
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
