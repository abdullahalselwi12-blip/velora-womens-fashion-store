import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function Footer() {
  const { t, tl, lang } = useI18n();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email });
    if (error) {
      if (error.code === '23505') {
        showToast(tl('أنت مشترك بالفعل', 'You are already subscribed'), 'info');
      } else {
        showToast(t('msg.error'), 'error');
      }
    } else {
      showToast(t('msg.newsletterSuccess'), 'success');
      setEmail('');
    }
  };

  return (
    <footer className="bg-stone-900 text-stone-300 mt-20">
      {/* Newsletter section */}
      <div className="border-b border-stone-800">
        <div className="container-velora py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">
              {t('msg.newsletterTitle')}
            </h2>
            <p className="text-sm text-stone-400 mb-6">
              {t('msg.newsletterSubtitle')}
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('msg.emailPlaceholder')}
                required
                className="bg-stone-800 border-stone-700 text-white placeholder-stone-500"
              />
              <Button type="submit" size="md" className="whitespace-nowrap">
                {t('action.subscribe')}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container-velora py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold tracking-widest text-white mb-3">VELORA</h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              {tl('أزياء نسائية فاخرة - أناقة تليق بك', 'Premium women\'s fashion - Elegant by design')}
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-800 rounded-full hover:bg-stone-700 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-800 rounded-full hover:bg-stone-700 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t('label.quickLinks')}
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/products" className="text-sm hover:text-white transition-colors">{t('nav.allProducts')}</Link></li>
              <li><Link to="/new-arrivals" className="text-sm hover:text-white transition-colors">{t('nav.newArrivals')}</Link></li>
              <li><Link to="/best-sellers" className="text-sm hover:text-white transition-colors">{t('nav.bestSellers')}</Link></li>
              <li><Link to="/sale" className="text-sm hover:text-white transition-colors">{t('nav.sale')}</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t('label.customerService')}
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-sm hover:text-white transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/contact" className="text-sm hover:text-white transition-colors">{t('nav.contact')}</Link></li>
              <li><Link to="/faq" className="text-sm hover:text-white transition-colors">{t('nav.faq')}</Link></li>
              <li><Link to="/shipping-returns" className="text-sm hover:text-white transition-colors">{t('msg.shippingReturns')}</Link></li>
              <li><Link to="/privacy-policy" className="text-sm hover:text-white transition-colors">{t('msg.privacyPolicy')}</Link></li>
              <li><Link to="/terms-of-service" className="text-sm hover:text-white transition-colors">{t('msg.termsOfService')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {tl('تواصلي معنا', 'Contact')}
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-stone-500" />
                contact@velora.store
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-stone-500" />
                +967 1 234 567
              </li>
              <li className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-stone-500" />
                {tl('صنعاء، اليمن', 'Sanaa, Yemen')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-stone-800">
        <div className="container-velora py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} VELORA. {t('label.allRightsReserved')}.
          </p>
          <p className="text-xs text-stone-500">
            {tl('صنع بحب في اليمن', 'Made with love in Yemen')}
          </p>
        </div>
      </div>
    </footer>
  );
}
