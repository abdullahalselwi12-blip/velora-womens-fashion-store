import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

export function SEO({ title, description, canonicalUrl, image, type = 'website', jsonLd }: SEOProps) {
  const { lang } = useI18n();

  useEffect(() => {
    const fullTitle = title ? `${title} | VELORA` : 'VELORA - Premium Women\'s Fashion';
    document.title = fullTitle;

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, 'property');
    }
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:type', type, 'property');
    setMeta('og:locale', lang === 'ar' ? 'ar_YE' : 'en_US', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    if (description) setMeta('twitter:description', description);
    if (image) {
      setMeta('og:image', image, 'property');
      setMeta('twitter:image', image);
    }
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    }

    // JSON-LD structured data
    let script = document.getElementById('jsonld-structured-data');
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.id = 'jsonld-structured-data';
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, canonicalUrl, image, type, lang, jsonLd]);

  return null;
}
