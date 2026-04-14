'use client';

import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TemplateCardSkeleton } from '@/components/ui/skeletons';
import TemplateCard from '@/components/templates/TemplateCard';
import {
  useMarketplace,
  getSectionIcon,
  getSectionGradient,
  getCategoryIcon,
  SORT_OPTIONS,
} from '@/hooks/useMarketplace';
import {
  MarketplaceHero,
  StorefrontSection,
} from '@/components/marketplace';
import {
  Sparkles, Flame, Wand2, Loader2, LayoutGrid,
  X as XIcon, Star, Package,
  SlidersHorizontal, Search, Quote,
} from 'lucide-react';

/* ═══ CSS ═══ */
const STYLES = `
  @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .anim-fade { animation: fadeInScale 0.25s ease-out forwards; }
  .anim-slide { animation: slideUp 0.35s cubic-bezier(0.32,0.72,0,1) forwards; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

/* ═══════════════════════════════════════
   CATEGORY PILLS (Firestore الفئات)
═══════════════════════════════════════ */
function CategoryPills({
  categories, selected, onSelect,
}: {
  categories: { id: string; name_ar: string; name_en?: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const { t, dir } = useTranslation();
  return (
    <section className="container mx-auto px-4 -mt-6 relative z-10 mb-8">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl border border-gray-100/80 dark:border-gray-800/60 p-5 md:p-6 shadow-xl shadow-violet-500/[0.03]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">{t('market.browseByCategory')}</h2>
            <p className="text-xs text-gray-400">{t('market.browseByCategory.desc')}</p>
          </div>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-1 px-1">
          <button
            onClick={() => selected && onSelect(selected)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all duration-300 whitespace-nowrap shrink-0 snap-start',
              !selected
                ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/25 scale-[1.02]'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-violet-300 hover:text-violet-600 hover:shadow-md'
            )}
          >
            <span className="text-base">🏪</span> {t('market.all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all duration-300 whitespace-nowrap shrink-0 snap-start',
                selected === cat.id
                  ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-violet-300 hover:text-violet-600 hover:shadow-md'
              )}
            >
              <span className="text-base">{getCategoryIcon(cat.name_ar)}</span> {dir === 'rtl' ? cat.name_ar : (cat.name_en || cat.name_ar)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   FILTER ICON + PANEL
   Desktop: inline bar + dropdown
   Mobile: floating button + bottom sheet
═══════════════════════════════════════ */
function FilterBar({
  groups, sections, selectedSection, onSelectSection,
  ratingFilter, onSetRating, sortBy, onSetSort,
  searchQuery, onSetSearch, isFiltered, onClear, resultCount, activeFilterCount,
  exactPhrase, onToggleExactPhrase,
}: {
  groups: any[]; sections: any[];
  selectedSection: string | null; onSelectSection: (id: string) => void;
  ratingFilter: number; onSetRating: (r: number) => void;
  sortBy: string; onSetSort: (v: any) => void;
  searchQuery: string; onSetSearch: (q: string) => void;
  isFiltered: boolean; onClear: () => void;
  resultCount: number; activeFilterCount: number;
  exactPhrase: boolean; onToggleExactPhrase: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const onTS = useCallback((e: React.TouchEvent) => { startY.current = e.touches[0].clientY; }, []);
  const onTM = useCallback((e: React.TouchEvent) => {
    const d = e.touches[0].clientY - startY.current;
    if (d > 0 && sheetRef.current) sheetRef.current.style.transform = `translateY(${d}px)`;
  }, []);
  const onTE = useCallback((e: React.TouchEvent) => {
    const d = (e.changedTouches[0]?.clientY || 0) - startY.current;
    if (sheetRef.current) sheetRef.current.style.transform = '';
    if (d > 100) setMobileOpen(false);
  }, []);

  // Shared filter content
  const { t, dir } = useTranslation();
  const Filters = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("space-y-5", mobile ? "p-5" : "p-5")}>

      {/* الأقسام */}
      {groups.length > 0 && (
        <div>
          <h4 className="text-sm font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-gray-400" /> {t('market.sections')}
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {groups.map((g: any) => (
              <button key={g.section.id} onClick={() => onSelectSection(g.section.id)}
                className={cn(
                  'flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition-all',
                  mobile && 'active:scale-[0.97] touch-manipulation',
                  selectedSection === g.section.id
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 ring-1 ring-violet-300'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 hover:bg-gray-100'
                )}>
                <span className="text-sm">{getSectionIcon(g.section.slug)}</span>
                <span className="flex-1 text-start truncate">{dir === 'rtl' ? g.section.name_ar : (g.section.name_en || g.section.name_ar)}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{g.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* التقييم */}
      <div>
        <h4 className="text-sm font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
          <Star className="w-4 h-4 text-gray-400" /> {t('market.rating')}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {[5, 4, 3, 2, 1].map(r => (
            <button key={r} onClick={() => onSetRating(ratingFilter === r ? 0 : r)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                ratingFilter === r
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 ring-1 ring-amber-200'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
              )}>
              <div className="flex gap-0.5">{Array.from({ length: r }, (_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}</div>
              <span>+</span>
            </button>
          ))}
        </div>
      </div>

      {/* الترتيب */}
      <div>
        <h4 className="text-sm font-black text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" /> {t('market.sortBy')}
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {SORT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => onSetSort(opt.value)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                sortBy === opt.value
                  ? 'bg-violet-500 text-white shadow-md'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 hover:bg-gray-100'
              )}>
              <span>{opt.icon}</span> <span>{t(opt.translationKey as any) || opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ═══ Desktop bar ═══ */}
      <div ref={ref} className="hidden md:flex sticky top-[4.5rem] z-30 items-center justify-between">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg px-4 py-3 flex items-center gap-3 w-full">
          {/* Search input with exact phrase toggle */}
          <div className="relative flex items-center flex-1 min-w-0">
            <Search className="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSetSearch(e.target.value)}
              placeholder={t('market.searchInStore')}
              className="w-full ps-24 pe-10 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
            />
            <button
              onClick={onToggleExactPhrase}
              title={exactPhrase ? t('market.exactMatchOff') : t('market.exactMatchOn')}
              className={cn(
                'absolute left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all',
                exactPhrase
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-violet-50 hover:text-violet-600'
              )}
            >
              <Quote className="w-3 h-3" />
              <span>{exactPhrase ? t('market.exactMatch') : t('market.smart')}</span>
            </button>
          </div>

          <span className="text-xs text-gray-400 font-medium shrink-0">{resultCount} {t('market.results')}</span>

          {selectedSection && (
            <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
              {dir === 'rtl' ? sections.find((s: any) => s.id === selectedSection)?.name_ar : (sections.find((s: any) => s.id === selectedSection)?.name_en || sections.find((s: any) => s.id === selectedSection)?.name_ar)}
              <button onClick={() => onSelectSection(selectedSection)} className="hover:text-red-500"><XIcon className="w-3 h-3" /></button>
            </span>
          )}

          {isFiltered && (
            <button onClick={onClear} className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full flex items-center gap-1">
              <XIcon className="w-3 h-3" /> {t('market.filtersClear')}
            </button>
          )}

          <button onClick={() => setOpen(!open)}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all shrink-0 relative',
              open ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/25'
                   : isFiltered ? 'bg-violet-50 text-violet-600 border-violet-300'
                   : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 hover:border-violet-400 hover:text-violet-500'
            )}>
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && !open && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-violet-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {open && (
          <div className="absolute end-0 top-full mt-2 w-[400px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl z-50 anim-fade max-h-[75vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between z-10 rounded-t-2xl">
              <h3 className="text-sm font-black flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-violet-500" /> {t('market.filtersTitle')}</h3>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200"><XIcon className="w-3.5 h-3.5" /></button>
            </div>
            <Filters />
          </div>
        )}
      </div>

      {/* ═══ Mobile floating icon ═══ */}
      <button onClick={() => setMobileOpen(true)}
        className={cn(
          'md:hidden fixed bottom-6 end-6 z-40 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-90 touch-manipulation relative',
          isFiltered ? 'bg-violet-500 text-white shadow-violet-500/30' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
        )}>
        <SlidersHorizontal className="w-5 h-5" />
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -end-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{activeFilterCount}</span>
        )}
      </button>

      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div ref={sheetRef}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain anim-slide"
            onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 pt-3 pb-2 z-10 rounded-t-3xl">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-black flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-violet-500" /> {t('market.filtersAndSort')}</h3>
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500"><XIcon className="w-4 h-4" /></button>
              </div>
            </div>
            <Filters mobile />
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              {isFiltered && <button onClick={onClear} className="px-4 py-3 rounded-2xl text-sm font-bold border border-gray-200 text-gray-600 active:scale-[0.97]">{t('market.clear')}</button>}
              <button onClick={() => setMobileOpen(false)} className="flex-1 bg-violet-500 text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg shadow-violet-500/25 active:scale-[0.98]">
                {t('market.showResults')} ({resultCount})
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ═══ Empty states ═══ */
function StorefrontEmpty() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-violet-50 dark:bg-violet-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Package className="w-10 h-10 text-violet-300" />
      </div>
      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('market.storeEmpty')}</h3>
      <p className="text-gray-500 text-sm mb-6">{t('market.storeEmptyDesc')}</p>
    </div>
  );
}

function EmptyFilterState({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <SlidersHorizontal className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{t('market.noResults')}</h3>
      <p className="text-gray-500 text-sm mb-4">{t('market.noResultsDesc')}</p>
      <button onClick={onClear} className="text-violet-500 font-bold text-sm hover:text-violet-600">{t('market.filtersClear')}</button>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN CONTENT
═══════════════════════════════════════ */
function MarketplaceContent() {
  const { t, dir } = useTranslation();
  const mp = useMarketplace();
  const has = mp.allTemplates.length > 0;
  const selectedCatName = mp.selectedCategory
    ? mp.serviceCategories.find(c => c.id === mp.selectedCategory)?.[dir === 'rtl' ? 'name_ar' : 'name_en'] || mp.serviceCategories.find(c => c.id === mp.selectedCategory)?.name_ar
    : null;

  // Progressive loading — show 12 initially, load 12 more on scroll
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [mp.selectedCategory, mp.selectedSection, mp.debouncedSearch, mp.ratingFilter, mp.sortBy]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => prev + PAGE_SIZE);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mp.filteredTemplates.length]);

  const visibleTemplates = mp.filteredTemplates.slice(0, visibleCount);
  const hasMore = visibleCount < mp.filteredTemplates.length;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <Navbar />

      {/* Hero */}
      <MarketplaceHero
        templateCount={mp.allTemplates.length}
        sectionCount={mp.sections.length}
        categoryCount={mp.serviceCategories.length}
        allTemplates={mp.allTemplates}
      />

      {/* Category pills (الفئات) */}
      {mp.serviceCategories.length > 0 && (
        <CategoryPills categories={mp.serviceCategories} selected={mp.selectedCategory} onSelect={mp.selectCategory} />
      )}

      <div className="container mx-auto px-4 pb-12 space-y-4">
        {/* Filter bar */}
        {has && (
          <FilterBar
            groups={mp.sectionGroups} sections={mp.sections}
            selectedSection={mp.selectedSection} onSelectSection={mp.selectSection}
            ratingFilter={mp.ratingFilter} onSetRating={mp.setRatingFilter}
            sortBy={mp.sortBy} onSetSort={mp.setSortBy}
            searchQuery={mp.searchQuery} onSetSearch={mp.setSearchQuery}
            isFiltered={mp.isFiltered} onClear={mp.clearFilters}
            resultCount={mp.isFiltered ? mp.filteredTemplates.length : mp.allTemplates.length}
            activeFilterCount={mp.activeFilterCount}
            exactPhrase={mp.exactPhrase}
            onToggleExactPhrase={() => mp.setExactPhrase(!mp.exactPhrase)}
          />
        )}

        {/* Content */}
        {mp.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <TemplateCardSkeleton key={i} />)}
          </div>
        ) : !has ? (
          <StorefrontEmpty />
        ) : mp.isFiltered ? (
          /* ═══ FILTERED GRID (search/section/rating active) ═══ */
          <div className="pt-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">
                {mp.selectedSection
                  ? (dir === 'rtl' ? mp.sections.find(s => s.id === mp.selectedSection)?.name_ar : (mp.sections.find(s => s.id === mp.selectedSection)?.name_en || mp.sections.find(s => s.id === mp.selectedSection)?.name_ar))
                   : mp.debouncedSearch ? t('market.searchResults') : t('market.allTemplatesTitle')}
                {selectedCatName && <span className="text-violet-500 me-2">• {selectedCatName}</span>}
                <span className="text-sm font-normal text-gray-400 me-2">({mp.filteredTemplates.length})</span>
              </h2>
            </div>
            {mp.filteredTemplates.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {visibleTemplates.map((t, i) => (
                    <div key={t.id} className="anim-fade" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
                      <TemplateCard template={t} variant="marketplace" searchQuery={mp.debouncedSearch} />
                    </div>
                  ))}
                </div>
                {/* Infinite scroll sentinel */}
                {hasMore && (
                  <div ref={sentinelRef} className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </>
            ) : <EmptyFilterState onClear={mp.clearFilters} />}
          </div>
        ) : (
          /* ═══ STOREFRONT — Section carousels (filtered by category if selected) ═══ */
          <div className="space-y-10 pt-2">
            {/* Heading when category is selected */}
            {selectedCatName && (
              <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-900/10 rounded-2xl p-4 border border-violet-100 dark:border-violet-900/30">
                <span className="text-2xl">{getCategoryIcon(selectedCatName)}</span>
                <div>
                  <p className="text-sm font-black text-violet-700 dark:text-violet-300">{t('market.categorySections')} {selectedCatName}</p>
                  <p className="text-xs text-gray-500">{mp.sectionGroups.length} {t('market.section')} • {mp.sectionGroups.reduce((s, g) => s + g.count, 0)} {t('market.template')}</p>
                </div>
              </div>
            )}

            {/* Featured */}
            {!mp.selectedCategory && mp.featuredTemplates.length > 0 && (
              <StorefrontSection
                icon={<Sparkles className="w-4 h-4" />} title={t('market.featuredTemplates')}
                subtitle={t('market.featuredSubtitle')} gradient="from-violet-500 to-purple-600"
                templates={mp.featuredTemplates}
              />
            )}

            {/* Per-Section carousels */}
            {mp.sectionGroups.map(g => (
              <StorefrontSection
                key={g.section.id}
                icon={<span className="text-sm">{getSectionIcon(g.section.slug)}</span>}
                title={dir === 'rtl' ? g.section.name_ar : (g.section.name_en || g.section.name_ar)} subtitle={`${g.count} ${t('market.template')}`}
                gradient={getSectionGradient(g.section.slug)}
                templates={g.templates.slice(0, 12)}
                onViewAll={() => mp.selectSection(g.section.id)}
              />
            ))}

            {/* No sections have templates */}
            {mp.sectionGroups.length === 0 && !mp.selectedCategory && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-white">{t('market.allTemplates')}</h2>
                    <p className="text-xs text-gray-500">{mp.allTemplates.length} {t('market.statTemplates')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {mp.allTemplates.map((t, i) => (
                    <div key={t.id} className="anim-fade" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
                      <TemplateCard template={t} variant="marketplace" searchQuery="" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mp.sectionGroups.length === 0 && mp.selectedCategory && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{t('market.noResults')}</h3>
                <p className="text-gray-500 text-sm mb-4">{t('market.noResultsDesc')}</p>
                <button onClick={() => mp.selectCategory(mp.selectedCategory!)} className="text-violet-500 font-bold text-sm hover:text-violet-600">{t('market.viewAll')}</button>
              </div>
            )}

            {/* Best sellers (only when no category filter) */}
            {!mp.selectedCategory && mp.bestSellers.length > 0 && (
              <StorefrontSection
                icon={<Flame className="w-4 h-4" />} title={t('market.bestSellers')}
                subtitle={t('market.bestSellersDesc')} gradient="from-red-500 to-orange-600"
                templates={mp.bestSellers}
              />
            )}

            {/* CTA */}
            <section>
              <div className="bg-gradient-to-l from-violet-600 via-purple-600 to-fuchsia-700 rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.08)_0%,transparent_50%)]" />
                <div className="relative">
                  <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-70" />
                  <h3 className="text-2xl md:text-3xl font-black mb-3">{t('market.ctaTitle')}</h3>
                  <p className="text-white/70 text-base mb-6 max-w-md mx-auto">{t('market.ctaDesc')}</p>
                  <Link href="/contact">
                    <Button variant="secondary" size="lg" className="rounded-full px-10 py-6 font-black shadow-2xl text-base hover:scale-105 transition-transform" dir={dir}>
                      {t('market.ctaButton')}
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

/* ═══ PAGE ═══ */
export default function MarketplacePage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
          <p className="text-sm text-gray-400 font-bold">{t('market.loading')}</p>
        </div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
