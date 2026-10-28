import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export function SignUpPage() {
  const { signUp } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t('msg.passwordTooShort'));
      return;
    }
    setLoading(true);
    const { error: signUpError } = await signUp(email, password, fullName);
    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else {
      navigate('/account');
    }
  };

  return (
    <>
      <SEO title={t('action.signUp')} />
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold">{t('msg.createAccount')}</h1>
            <p className="text-sm text-stone-500 mt-1">{t('msg.createAccount')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-stone-900 p-6 rounded-lg product-card-shadow">
            <Input
              label={t('label.fullName')}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
            <Input
              label={t('label.email')}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label={t('label.password')}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <p className="text-sm text-stone-500">
              {t('msg.haveAccount')} <Link to="/signin" className="text-stone-900 dark:text-stone-100 underline">{t('action.signIn')}</Link>
            </p>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Spinner size="sm" /> : t('action.signUp')}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
