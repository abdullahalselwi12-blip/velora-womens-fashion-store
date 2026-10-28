import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export function ForgotPasswordPage() {
  const { t, tl } = useI18n();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      showToast(t('msg.error'), 'error');
    } else {
      setSent(true);
      showToast(tl('تم إرسال رابط إعادة التعيين', 'Reset link sent'), 'success');
    }
    setLoading(false);
  };

  return (
    <>
      <SEO title={t('msg.resetPassword')} />
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold">{t('msg.resetPassword')}</h1>
            <p className="text-sm text-stone-500 mt-1">{t('msg.forgotPassword')}</p>
          </div>

          {sent ? (
            <div className="bg-white dark:bg-stone-900 p-6 rounded-lg product-card-shadow text-center">
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                {tl('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'A password reset link has been sent to your email')}
              </p>
              <Link to="/signin" className="text-sm text-rose-600 underline">{t('msg.backToSignIn')}</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-stone-900 p-6 rounded-lg product-card-shadow">
              <Input
                label={t('label.email')}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : t('msg.sendResetLink')}
              </Button>
              <Link to="/signin" className="block text-sm text-center text-stone-600 hover:text-stone-900 dark:hover:text-stone-100">
                {t('msg.backToSignIn')}
              </Link>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
