import { useState } from 'react';
import { Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

export function ContactPage() {
  const { t, tl } = useI18n();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(tl('تم إرسال رسالتك', 'Your message has been sent'), 'success');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <>
      <SEO title={t('nav.contact')} description={tl('تواصلي مع فريق فيلورا لأي استفسار', 'Contact the VELORA team for any inquiries')} />
      <div className="container-velora py-12 max-w-4xl">
        <h1 className="text-3xl font-semibold mb-2">{t('nav.contact')}</h1>
        <p className="text-sm text-stone-500 mb-8">{tl('نحن هنا لمساعدتك', 'We are here to help you')}</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-stone-500">contact@velora.store</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('label.phone')}</p>
                <p className="text-sm text-stone-500">+967 1 234 567</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{tl('العنوان', 'Address')}</p>
                <p className="text-sm text-stone-500">{tl('صنعاء، اليمن', 'Sanaa, Yemen')}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact form */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-stone-900 p-6 rounded-lg product-card-shadow">
            <Input label={t('label.fullName')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input label={t('label.email')} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <Textarea label={tl('رسالتك', 'Your Message')} rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
            <Button type="submit" className="w-full">{tl('إرسال', 'Send Message')}</Button>
          </form>
        </div>
      </div>
    </>
  );
}
