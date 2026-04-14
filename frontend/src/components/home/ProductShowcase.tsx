'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
import { Button } from '@/components/ui/button';
import { TemplateCardSkeleton } from '@/components/ui/skeletons';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Star, Flame, Bot, ArrowLeft, Download, Layout } from 'lucide-react';
import type { Template } from '@/types';
import { formatPrice } from '@/lib/utils';

export function ProductShowcase({
  featuredTemplates,
  bestSellers,
  allTemplates,
  isLoading,
  t,
  localizedField,
}: {
  featuredTemplates: Template[];
  bestSellers: Template[];
  allTemplates: Template[];
  isLoading: boolean;
  t: (key: any) => string;
  localizedField: (obj: any, field: string) => string;
}) {
  const [activeTab, setActiveTab] = useState<'bestsellers' | 'featured' | 'ai'>('bestsellers');
  const { getAIRecommendations, hasHistory } = useRecommendations();
  const [recommendations, setRecommendations] = useState<Template[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFetched, setAiFetched] = useState(false);

  useEffect(() => {
    if (activeTab !== 'ai' || !hasHistory || allTemplates.length === 0 || aiFetched) return;
    setAiLoading(true);
    setAiFetched(true);
    const uniqueTemplates = [...new Map(allTemplates.map(t => [t.id, t])).values()];
    getAIRecommendations(uniqueTemplates, 4)
      .then((recs) => {
        const unique = [...new Map(recs.map(t => [t.id, t])).values()];
        setRecommendations(unique);
      })
      .finally(() => setAiLoading(false));
  }, [activeTab, hasHistory, allTemplates, getAIRecommendations, aiFetched]);

  const tabs = [
    { key: 'bestsellers' as const, label: t('home.bestSellers.title'), icon: <Flame className="w-4 h-4" />, color: 'from-amber-400 to-orange-500' },
    { key: 'featured' as const, label: t('home.featured.title'), icon: <Star className="w-4 h-4" />, color: 'from-violet-500 to-purple-600' },
    ...(hasHistory ? [{ key: 'ai' as const, label: t('home.recommended.title'), icon: <Bot className="w-4 h-4" />, color: 'from-emerald-500 to-teal-600' }] : []),
  ];

  const currentTemplates = activeTab === 'bestsellers'
    ? bestSellers
    : activeTab === 'featured'
      ? featuredTemplates
      : recommendations;

  const showLoading = isLoading || (activeTab === 'ai' && aiLoading);

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">{t('home.featured.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t('home.featured.subtitle')}</p>
          </div>
          <Link href="/marketplace">
            <Button variant="outline" className="rounded-full px-6 border-2 font-bold dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              {t('home.featured.exploreAll')}
            </Button>
          </Link>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.key
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary/30'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {showLoading ? (
            [1, 2, 3, 4].map((i) => <TemplateCardSkeleton key={i} />)
          ) : currentTemplates.length > 0 ? (
            currentTemplates.slice(0, 8).map((template) => (
              <Link
                key={template.id}
                href={`/marketplace/${template.slug}`}
                className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full premium-card"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <SafeImage
                    src={template.thumbnail_url}
                    alt={localizedField(template, 'name')}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    fallback={
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Layout className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-500 mb-2" />
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{t('common.loading')}</span>
                        </div>
                      </div>
                    }
                  />
                  {activeTab === 'bestsellers' && (
                    <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-2.5 py-1 rounded-full font-black flex items-center gap-1 shadow-lg">
                      <Flame className="w-3 h-3" />
                      {t('home.bestSellers.badge')}
                    </div>
                  )}
                  {activeTab === 'ai' && (
                    <div className="absolute top-3 right-3 z-10 bg-violet-500/90 text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Bot className="w-2.5 h-2.5" /> AI
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider bg-primary/5 dark:bg-primary/15 px-2 py-0.5 rounded-full">
                      {localizedField(template.category, 'name') || t('home.sections.template')}
                    </span>
                    <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                      {localizedField(template, 'name')}
                    </h3>
                    {localizedField(template, 'description') && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {localizedField(template, 'description')}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-primary">{formatPrice(template.price)}</span>
                      {activeTab === 'bestsellers' && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {template.sales_count || 0}
                        </span>
                      )}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-16 text-center">
              <p className="text-gray-500 dark:text-gray-400 font-bold">{t('home.featured.noTemplates')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
