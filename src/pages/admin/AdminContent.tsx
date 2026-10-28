import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { slugify } from '@/lib/format';
import type { Page as PageType } from '@/types';

export function AdminContent() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const [pages, setPages] = useState<PageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({
    title_ar: '', title_en: '', slug: '', content_ar: '', content_en: '',
    status: 'published' as 'draft' | 'published', seo_title: '', seo_description: '',
  });

  const fetchPages = useCallback(async () => {
    const { data } = await supabase.from('pages').select('*').order('updated_at', { ascending: false });
    if (data) setPages(data as PageType[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, slug: form.slug || slugify(form.title_en) };
    if (editingId) {
      const { error } = await supabase.from('pages').update(data).eq('id', editingId);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.updated'), 'success');
    } else {
      const { error } = await supabase.from('pages').insert(data);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.created'), 'success');
    }
    setShowForm(false);
    setEditingId('');
    fetchPages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('msg.confirmDelete'))) return;
    await supabase.from('pages').delete().eq('id', id);
    showToast(t('msg.deleted'), 'success');
    fetchPages();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <>
      <SEO title={t('msg.content')} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t('msg.content')}</h1>
        <Button onClick={() => { setEditingId(''); setForm({ title_ar: '', title_en: '', slug: '', content_ar: '', content_en: '', status: 'published', seo_title: '', seo_description: '' }); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Page
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map(p => (
          <div key={p.id} className="bg-white dark:bg-stone-900 rounded-lg p-4 product-card-shadow">
            <div className="flex items-start justify-between mb-2">
              <FileText className="w-5 h-5 text-stone-400" />
              <span className={`px-2 py-0.5 text-xs rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>{p.status}</span>
            </div>
            <p className="font-medium text-sm">{lang === 'ar' ? p.title_ar : p.title_en}</p>
            <p className="text-xs text-stone-500 mb-3">/{p.slug}</p>
            <div className="flex gap-1">
              <button onClick={() => { setEditingId(p.id); setForm({ title_ar: p.title_ar, title_en: p.title_en, slug: p.slug, content_ar: p.content_ar || '', content_en: p.content_en || '', status: p.status, seo_title: p.seo_title || '', seo_description: p.seo_description || '' }); setShowForm(true); }} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Page' : 'Add Page'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Title (EN)" value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} required />
                <Input label="Title (AR)" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} required />
                <Input label="Slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto" />
                <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </Select>
              </div>
              <Textarea label="Content (EN)" rows={6} value={form.content_en} onChange={e => setForm(f => ({ ...f, content_en: e.target.value }))} />
              <Textarea label="Content (AR)" rows={6} value={form.content_ar} onChange={e => setForm(f => ({ ...f, content_ar: e.target.value }))} />
              <Input label="SEO Title" value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))} />
              <Input label="SEO Description" value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))} />
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
