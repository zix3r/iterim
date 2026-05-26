import type { TranslationKey } from '@/i18n/translations';

type Translator = (key: TranslationKey) => string;

export function formatDate(dateString: string, t?: Translator, locale?: string): string {
  if (!dateString) {
    return 'Unknown date';
  }
  const isoString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t ? t('common.justNow') : 'just now';
  }

  if (diffInSeconds < 3600) {
    const n = Math.floor(diffInSeconds / 60);
    if (t) return (n === 1 ? t('common.minuteAgo') : t('common.minutesAgo').replace('{n}', String(n)));
    return `${n} minute${n > 1 ? 's' : ''} ago`;
  }

  if (diffInSeconds < 86400) {
    const n = Math.floor(diffInSeconds / 3600);
    if (t) return (n === 1 ? t('common.hourAgo') : t('common.hoursAgo').replace('{n}', String(n)));
    return `${n} hour${n > 1 ? 's' : ''} ago`;
  }

  if (diffInSeconds < 604800) {
    const n = Math.floor(diffInSeconds / 86400);
    if (t) return (n === 1 ? t('common.dayAgo') : t('common.daysAgo').replace('{n}', String(n)));
    return `${n} day${n > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString(locale ?? 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date string to a short format
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
