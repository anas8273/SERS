'use client';

import { Sparkles, ShieldCheck, Zap, Star } from 'lucide-react';
import { MeilisearchHeroSearch } from './MeilisearchHeroSearch';
import { useTranslation } from '@/i18n/useTranslation';
import type { Template } from '@/types';

interface MarketplaceHeroProps {
  templateCount: number;
  sectionCount: number;
  categoryCount: number;
  allTemplates?: Template[];
}

export function MarketplaceHero({ templateCount, sectionCount, categoryCount, allTemplates = [] }: MarketplaceHeroProps) {
  const { t, dir } = useTranslation();

  const stats = [
    { value: templateCount || '—', label: t('market.statTemplates'), icon: '📄' },
    { value: sectionCount || '—', label: t('market.statSections'), icon: '📁' },
    { value: categoryCount || '—', label: t('market.statCategories'), icon: '🏷️' },
  ];

  const trustBadges = [
    { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: t('market.trustQuality') },
    { icon: <Zap className="w-3.5 h-3.5" />, text: t('market.trustDownload') },
    { icon: <Star className="w-3.5 h-3.5" />, text: t('market.trustSupport') },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-slate-950 via-slate-900 to-primary/80 pt-16" dir={dir}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[120px] translate-y-1/3 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
      </div>
      
      <div className="relative container mx-auto px-4 py-14 md:py-20 lg:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs font-bold text-white/90 whitespace-nowrap">{t('market.heroBadge')}</span>
          </div>
          
          {/* Heading — proper sizing so it doesn't overflow */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 px-2">
            {t('market.heroTitle')}
            <span className="block bg-gradient-to-l from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent mt-1">
              {t('market.heroTitleHighlight')}
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300/90 max-w-xl mx-auto leading-relaxed animate-in fade-in duration-700 px-4" style={{ animationDelay: '200ms' }}>
            {t('market.heroDesc')}
            <br className="hidden sm:block" />
            <span className="text-slate-400">{t('market.heroDescSub')}</span>
          </p>

          {/* ═══ Meilisearch Instant Search Bar ═══ */}
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 pt-2" style={{ animationDelay: '300ms' }}>
            <MeilisearchHeroSearch allTemplates={allTemplates} />
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-6 md:gap-12 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-700" style={{ animationDelay: '400ms' }}>
            {stats.map((stat, i) => (
              <div key={i} className="text-center group cursor-default">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-lg">{stat.icon}</span>
                  <p className="text-2xl md:text-3xl font-black text-white group-hover:scale-110 transition-transform">{stat.value}</p>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium whitespace-nowrap">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 pt-3 animate-in fade-in duration-700 flex-wrap" style={{ animationDelay: '600ms' }}>
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-400 whitespace-nowrap">
                <span className="text-emerald-400">{badge.icon}</span>
                {badge.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 40" fill="none" className="w-full text-gray-50 dark:text-gray-950">
          <path d="M0 40h1440V20c-240 15-480 20-720 15S240 15 0 25v15z" fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}
