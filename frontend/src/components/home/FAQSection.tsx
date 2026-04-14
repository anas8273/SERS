'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { useTranslation } from '@/i18n/useTranslation';

export function FAQSection() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <ScrollReveal>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{t('home.faq.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('home.faq.subtitle')}</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-right font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-sm md:text-base">{t(`faq.${i}.q` as any)}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0 me-3 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-48 pb-5' : 'max-h-0'}`}>
                  <p className="px-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(`faq.${i}.a` as any)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
