'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { translations, type TranslationKey } from './translations';
import { autoTranslations, resetLocaleCache } from './auto-translations';
import { defaultLocale, localeDirections, type Locale } from './config';

/* ─── Cookie helpers (silent, no reload) ──────────────────── */
function readLocaleCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  const match = document.cookie.match(/(?:^|;\s*)locale=(\w+)/);
  return match?.[1] === 'en' ? 'en' : 'ar';
}

function writeLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

/* ─── Context ─────────────────────────────────────────────── */
interface I18nContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  t: (key: TranslationKey) => string;
  /** Auto-translate: pass Arabic text, gets translated when locale is English */
  ta: (arabicText: string, englishOverride?: string) => string;
  setLocale: (locale: Locale) => void;
  /** Pick locale-aware field from API data, e.g. localizedField(template, 'name') → name_ar or name_en */
  localizedField: (obj: any, field: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'ar',
  dir: 'rtl',
  t: (key) => key,
  ta: (text) => text,
  setLocale: () => {},
  localizedField: (obj, field) => obj?.[`${field}_ar`] || '',
});

/* ─── Provider (ZERO RELOAD) ──────────────────────────────── */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Read cookie on mount
  useEffect(() => {
    setLocaleState(readLocaleCookie());
  }, []);

  // Sync dir + lang on <html> whenever locale changes
  useEffect(() => {
    const dir = localeDirections[locale];
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  // Instant switch — no page reload
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);          // React re-renders all consumers
    writeLocaleCookie(newLocale);       // Persist in background
    resetLocaleCache();                 // Bust standalone ta() cache immediately
    const dir = localeDirections[newLocale];
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string =>
      translations[locale]?.[key] ?? translations.ar[key] ?? key,
    [locale]
  );

  /**
   * ta() — Auto-translate hardcoded Arabic strings.
   * When locale is 'ar': returns the Arabic text as-is.
   * When locale is 'en': looks up the English translation from auto-translations dictionary.
   * Optionally accepts an explicit English override as second argument.
   */
  const ta = useCallback(
    (arabicText: string, englishOverride?: string): string => {
      if (locale === 'ar') return arabicText;
      // If explicit English override provided, use it
      if (englishOverride) return englishOverride;
      // Look up in auto-translations dictionary
      return autoTranslations[arabicText] || arabicText;
    },
    [locale]
  );

  // Helper: detect if text is in wrong language for the target locale
  const isWrongLanguage = useCallback(
    (text: string, targetLocale: Locale): boolean => {
      if (!text) return false;
      const hasArabic = /[\u0600-\u06FF]/.test(text);
      // If target is English but text is Arabic → wrong
      if (targetLocale === 'en' && hasArabic) return true;
      // If target is Arabic but text is pure Latin → wrong  
      if (targetLocale === 'ar' && !hasArabic && /^[a-zA-Z\s\d&,.!?'\-()]+$/.test(text)) return true;
      return false;
    },
    []
  );

  const localizedField = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj: any, field: string): string => {
      if (!obj) return '';
      const primary = obj[`${field}_${locale}`];
      // Return primary only if it exists AND is in the correct language
      if (primary && !isWrongLanguage(primary, locale)) return primary;
      // Fallback: try the other locale (still better than empty)
      const alt = locale === 'ar' ? obj[`${field}_en`] : obj[`${field}_ar`];
      if (alt && !isWrongLanguage(alt, locale)) return alt;
      // Try alt even if wrong language
      if (alt) return alt;
      // Try primary even if wrong language (better than empty)
      if (primary) return primary;
      // Last resort: plain field name
      return obj[field] || '';
    },
    [locale, isWrongLanguage]
  );

  return (
    <I18nContext.Provider value={{ locale, dir: localeDirections[locale], t, ta, setLocale, localizedField }}>
      {children}
    </I18nContext.Provider>
  );
}

/* ─── Hook ────────────────────────────────────────────────── */
export function useTranslation() {
  return useContext(I18nContext);
}
