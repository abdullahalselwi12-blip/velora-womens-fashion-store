import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <>
      <SEO title="404" />
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-6xl font-bold text-stone-900 dark:text-stone-100 mb-4">404</p>
        <h1 className="text-xl font-semibold mb-2">{t('msg.pageNotFound')}</h1>
        <p className="text-sm text-stone-500 mb-6">{t('msg.pageNotFound')}</p>
        <Link to="/"><Button>{t('msg.backHome')}</Button></Link>
      </div>
    </>
  );
}
