import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { SEO } from '@/components/SEO';
import { Spinner } from '@/components/ui/Spinner';
import type { Page as PageType } from '@/types';

export function StaticPage({ slug }: { slug?: string }) {
  const { slug: paramSlug } = useParams();
  const finalSlug = slug || paramSlug;
  const { lang } = useI18n();
  const [page, setPage] = useState<PageType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', finalSlug)
        .eq('status', 'published')
        .maybeSingle();
      if (data) setPage(data as PageType);
      setLoading(false);
    })();
  }, [finalSlug]);

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!page) return (
    <div className="container-velora py-20 text-center">
      <h1 className="text-2xl font-semibold mb-4">Page not found</h1>
    </div>
  );

  return (
    <>
      <SEO
        title={lang === 'ar' ? page.title_ar : page.title_en}
        description={lang === 'ar' ? page.seo_description || '' : page.seo_description || ''}
      />
      <div className="container-velora py-12 max-w-3xl">
        <h1 className="text-3xl font-semibold mb-6">{lang === 'ar' ? page.title_ar : page.title_en}</h1>
        <div className="prose prose-stone dark:prose-invert max-w-none">
          <p className="text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">
            {lang === 'ar' ? page.content_ar : page.content_en}
          </p>
        </div>
      </div>
    </>
  );
}
