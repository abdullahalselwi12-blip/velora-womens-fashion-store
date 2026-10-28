import type { Language } from '@/types';

export function formatPrice(amount: number, currency: string, lang: Language): string {
  const locale = lang === 'ar' ? 'ar-YE' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency === 'USD' ? '$' : currency}${amount.toFixed(2)}`;
  }
}

export function formatDate(date: string, lang: Language): string {
  const locale = lang === 'ar' ? 'ar' : 'en-US';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
