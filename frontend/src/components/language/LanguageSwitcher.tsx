'use client';

import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';

/** 
 * Compact toggle for navbar:
 * - xs (<480px): أيقونة فقط مع badge صغير
 * - sm+: أيقونة + حرفان (AR/EN)
 */
export function LanguageSwitcherCompact() {
  const { locale, setLocale } = useTranslation();
  const nextLabel = locale === 'ar' ? 'EN' : 'ع';
  const ariaLabel = locale === 'ar' ? 'Switch to English' : 'التبديل للعربية';

  return (
    <button
      onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
      className={cn(
        "relative flex items-center justify-center rounded-lg transition-colors",
        "min-w-[36px] min-h-[36px] p-1.5",
        "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
        "text-gray-700 dark:text-gray-300"
      )}
      title={ariaLabel}
      aria-label={ariaLabel}
    >
      <Globe className="h-4 w-4 shrink-0" />
      {/* Badge: always visible — shows next locale */}
      <span className="absolute -bottom-0.5 -end-0.5 min-w-[16px] h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
        {nextLabel}
      </span>
    </button>
  );
}

/** Full icon-only variant with badge */
export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <button
      onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
      className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 min-w-[36px] min-h-[36px]"
      title={locale === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
    >
      <Globe className="h-5 w-5" />
      <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-black bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">
        {locale === 'ar' ? 'EN' : 'ع'}
      </span>
    </button>
  );
}
