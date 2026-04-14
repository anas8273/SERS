'use client';

import Link from 'next/link';
import { ArrowLeft, Play, BookMarked } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { useTranslation } from '@/i18n/useTranslation';

export function ServicesSection() {
  const { t } = useTranslation();

  return (
    <ScrollReveal>
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{t('home.services.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('home.services.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card 1: Template Store */}
            <Link href="/marketplace" className="group relative overflow-hidden rounded-3xl border-2 border-blue-100 dark:border-blue-900/50 bg-white dark:bg-gray-800 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover-lift">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="p-8 md:p-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <BookMarked className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t('home.services.store.title')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                  {t('home.services.store.desc')}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {[t('home.services.store.tag1'), t('home.services.store.tag2'), t('home.services.store.tag3'), t('home.services.store.tag4'), t('home.services.store.tag5')].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold group-hover:gap-4 transition-all">
                  {t('home.services.store.browse')} <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Card 2: Educational Services */}
            <Link href="/services" className="group relative overflow-hidden rounded-3xl border-2 border-purple-100 dark:border-purple-900/50 bg-white dark:bg-gray-800 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover-lift">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="p-8 md:p-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {t('home.services.interactive.title')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                  {t('home.services.interactive.desc')}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {[t('home.services.interactive.tag1'), t('home.services.interactive.tag2'), t('home.services.interactive.tag3'), t('home.services.interactive.tag4')].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold group-hover:gap-4 transition-all">
                  {t('home.services.interactive.explore')} <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
