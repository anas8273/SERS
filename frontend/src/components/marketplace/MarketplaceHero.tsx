'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, Zap, Star, Search, X, Clock, TrendingUp, ArrowRight, FileText } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import type { Template } from '@/types';

interface MarketplaceHeroProps {
  templateCount: number;
  sectionCount: number;
  categoryCount: number;
  allTemplates?: Template[];
}

// ═══ Recent searches persistence ═══
const RECENT_KEY = 'sers-market-recent';
const MAX_RECENT = 5;
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function addRecent(q: string) {
  if (!q.trim()) return;
  const list = getRecent().filter(s => s !== q);
  list.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

export function MarketplaceHero({ templateCount, sectionCount, categoryCount, allTemplates = [] }: MarketplaceHeroProps) {
  const { t, dir, locale } = useTranslation();
  const router = useRouter();
  const isRTL = locale === 'ar';

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => { setRecentSearches(getRecent()); }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Live search results (max 6)
  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allTemplates
      .filter(tmpl => {
        const name = tmpl.name_ar || '';
        const desc = tmpl.description_ar || '';
        const cat = (typeof tmpl.category === 'object' && tmpl.category?.name_ar) ? tmpl.category.name_ar : '';
        return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
      })
      .slice(0, 6);
  }, [searchQuery, allTemplates, isRTL]);

  const handleSelect = (template: Template) => {
    addRecent(searchQuery);
    setRecentSearches(getRecent());
    setIsFocused(false);
    router.push(`/marketplace/${template.slug || template.id}`);
  };

  const handleRecentClick = (q: string) => {
    setSearchQuery(q);
    setIsFocused(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = isFocused && (searchQuery.trim().length > 0 || recentSearches.length > 0);
  const showResults = searchQuery.trim().length > 0;

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
    <section className="relative bg-gradient-to-bl from-slate-950 via-slate-900 to-primary/80 pt-16" dir={dir}>
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
          
          {/* Heading */}
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

          {/* ═══ Smart Search Bar ═══ */}
          <div ref={containerRef} className="relative w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-700 pt-2" style={{ animationDelay: '300ms' }}>
            <div className={`flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl px-5 py-4 transition-all duration-300 border ${
              isFocused
                ? 'border-white/40 bg-white/15 shadow-2xl shadow-black/20 ring-2 ring-white/20'
                : 'border-white/10 hover:border-white/25 hover:bg-white/[0.12]'
            }`}>
              <Search className={`w-5 h-5 shrink-0 transition-colors ${isFocused ? 'text-white' : 'text-white/50'}`} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setActiveIndex(-1); }}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder={isRTL ? 'ابحث عن قالب...' : 'Search templates...'}
                className="flex-1 bg-transparent text-base text-white placeholder-white/40 outline-none min-w-0 font-medium"
                dir={isRTL ? 'rtl' : 'ltr'}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setActiveIndex(-1); inputRef.current?.focus(); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFocused(false)} />
                <div
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-black/20 border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
                  style={{ animation: 'fadeInScale 0.2s ease-out forwards' }}
                >
                  {showResults ? (
                    <>
                      {results.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {results.map((tmpl, i) => {
                            const name = tmpl.name_ar || '';
                            const desc = tmpl.description_ar || '';
                            return (
                              <button
                                key={tmpl.id}
                                onClick={() => handleSelect(tmpl)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors ${
                                  activeIndex === i
                                    ? 'bg-primary/5 dark:bg-primary/10'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                              >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white shrink-0 shadow-sm">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{desc}</p>
                                </div>
                                {tmpl.price !== undefined && (
                                  <span className="text-xs font-bold text-primary shrink-0">
                                    {tmpl.price === 0 ? (isRTL ? 'مجاني' : 'Free') : `${tmpl.price} ${isRTL ? 'ر.س' : 'SAR'}`}
                                  </span>
                                )}
                                <ArrowRight className={`w-4 h-4 text-gray-300 dark:text-gray-500 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <Search className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {isRTL ? 'لا توجد نتائج لـ' : 'No results for'} &quot;{searchQuery}&quot;
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {isRTL ? 'جرّب كلمات مختلفة' : 'Try different keywords'}
                          </p>
                        </div>
                      )}
                      {results.length > 0 && (
                        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-[10px] text-gray-400 text-center font-medium">
                            {isRTL ? `${results.length} نتيجة — اضغط Enter للانتقال` : `${results.length} results — Press Enter to navigate`}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    recentSearches.length > 0 && (
                      <>
                        <div className="px-4 py-2.5 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                          <Clock className="w-3 h-3" />
                          {isRTL ? 'عمليات بحث سابقة' : 'Recent searches'}
                        </div>
                        {recentSearches.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleRecentClick(q)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-start"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{q}</span>
                          </button>
                        ))}
                      </>
                    )
                  )}
                </div>
              </>
            )}
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
