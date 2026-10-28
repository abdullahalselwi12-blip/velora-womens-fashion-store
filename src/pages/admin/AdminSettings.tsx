import { useEffect, useState, useCallback } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { SiteSetting } from '@/types';

export function AdminSettings() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fields = [
    { key: 'store_name', label: 'Store Name (EN)' },
    { key: 'store_name_ar', label: 'Store Name (AR)' },
    { key: 'store_email', label: 'Store Email' },
    { key: 'store_phone', label: 'Store Phone' },
    { key: 'store_address', label: 'Store Address' },
    { key: 'store_currency', label: 'Currency Code' },
    { key: 'store_currency_symbol', label: 'Currency Symbol' },
    { key: 'social_instagram', label: 'Instagram URL' },
    { key: 'social_facebook', label: 'Facebook URL' },
    { key: 'social_whatsapp', label: 'WhatsApp URL' },
    { key: 'footer_text_en', label: 'Footer Text (EN)' },
    { key: 'footer_text_ar', label: 'Footer Text (AR)' },
    { key: 'shipping_free_threshold', label: 'Free Shipping Threshold' },
    { key: 'default_language', label: 'Default Language' },
  ];

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('*');
    if (data) {
      const map: Record<string, string> = {};
      (data as SiteSetting[]).forEach(s => { map[s.setting_key] = s.setting_value || ''; });
      setSettings(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    for (const field of fields) {
      const value = settings[field.key];
      if (value !== undefined) {
        const { data: existing } = await supabase
          .from('site_settings')
          .select('id')
          .eq('setting_key', field.key)
          .maybeSingle();
        if (existing) {
          await supabase.from('site_settings').update({ setting_value: value }).eq('setting_key', field.key);
        } else {
          await supabase.from('site_settings').insert({ setting_key: field.key, setting_value: value });
        }
      }
    }
    showToast(t('msg.saved'), 'success');
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <>
      <SEO title={t('msg.settings')} />
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2"><SettingsIcon className="w-6 h-6" /> {t('msg.settings')}</h1>

      <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <Input
              key={f.key}
              label={f.label}
              value={settings[f.key] || ''}
              onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
              className={f.key.includes('footer') || f.key.includes('address') ? 'sm:col-span-2' : ''}
            />
          ))}
        </div>
        <Button onClick={handleSave} className="mt-6" disabled={saving}>
          {saving ? <Spinner size="sm" /> : <><Save className="w-4 h-4 mr-1" /> {t('action.save')}</>}
        </Button>
      </div>
    </>
  );
}
