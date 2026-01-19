'use client';

import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check, Loader2 } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      // Set cookie
      document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
      // Reload to apply new locale
      window.location.reload();
    });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Globe className="h-5 w-5" />
          )}
          <span className="sr-only">تغيير اللغة</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{localeNames[loc]}</span>
            {locale === loc && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile
export function LanguageSwitcherCompact() {
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    startTransition(() => {
      document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
      window.location.reload();
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      disabled={isPending}
      className="gap-2"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Globe className="h-4 w-4" />
          <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
        </>
      )}
    </Button>
  );
}
