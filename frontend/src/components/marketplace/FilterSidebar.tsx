'use client';

import { ta } from '@/i18n/auto-translations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getSectionIcon } from './MegaMenu';
import { SORT_OPTIONS, type SortOption } from '@/hooks/useMarketplace';
import { Filter, X, Star } from 'lucide-react';
import type { Section, Category, ServiceCategory } from '@/types';
import type { SectionGroup } from '@/hooks/useMarketplace';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * FilterSidebar
 * 
 * Desktop sidebar + mobile bottom sheet for advanced filtering.
 * Includes: sections, categories, price range, and rating stars.
 */
interface FilterSidebarProps {
  // Data
  sections: Section[];
  sectionGroups: SectionGroup[];
  sectionCategories: Category[];
  serviceCategories: ServiceCategory[];
  // Filter state
  selectedSection: string | null;
  selectedCategory: string | null;
  selectedServiceCategory: string | null;
  sortBy: SortOption;
  priceRange: [number, number];
  ratingFilter: number;
  // UI state
  isSidebarOpen: boolean;
  isMobileFilterOpen: boolean;
  // Actions
  onSelectSection: (id: string) => void;
  onSelectCategory: (id: string | null) => void;
  onSelectServiceCategory: (id: string) => void;
  onSetSortBy: (sort: SortOption) => void;
  onSetPriceRange: (range: [number, number]) => void;
  onSetRatingFilter: (rating: number) => void;
  onSetIsMobileFilterOpen: (open: boolean) => void;
  onClearFilters: () => void;
}

export function FilterSidebar({
  sections, sectionGroups, sectionCategories, serviceCategories,
  selectedSection, selectedCategory, selectedServiceCategory, sortBy,
  priceRange, ratingFilter,
  isSidebarOpen, isMobileFilterOpen,
  onSelectSection, onSelectCategory, onSelectServiceCategory, onSetSortBy,
  onSetPriceRange, onSetRatingFilter,
  onSetIsMobileFilterOpen, onClearFilters,
}: FilterSidebarProps) {
  const { t, localizedField } = useTranslation();

  const filterContent = (isMobile: boolean) => (
    <>
      {/* Sections */}
      <div className={isMobile ? 'mb-4' : ''}>
        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase">{t('market.categorySections')}</h4>
        <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'space-y-1'}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => {
                onSelectSection(s.id);
                if (isMobile) onSetIsMobileFilterOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 text-xs font-medium text-start transition-colors',
                isMobile
                  ? cn('px-3 py-2.5 rounded-xl font-bold',
                      selectedSection === s.id ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 hover:bg-gray-100')
                  : cn('w-full px-3 py-2 rounded-lg',
                      selectedSection === s.id ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700')
              )}
            >
              {getSectionIcon(s.slug)}
              <span className="truncate flex-1">{localizedField(s, 'name')}</span>
              {!isMobile && (
                <span className="text-[9px] text-gray-400">
                  {sectionGroups.find(g => g.section.id === s.id)?.count || 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Firestore Service Categories */}
      {serviceCategories.length > 0 && (
        <div className={isMobile ? 'mb-4' : ''}>
          <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase">{t('market.statCategories')}</h4>
          <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'space-y-1'}>
            {serviceCategories.map(sc => (
              <button
                key={sc.id}
                onClick={() => {
                  onSelectServiceCategory(sc.id);
                  if (isMobile) onSetIsMobileFilterOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 text-xs font-medium text-start transition-colors',
                  isMobile
                    ? cn('px-3 py-2.5 rounded-xl font-bold',
                        selectedServiceCategory === sc.id ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 hover:bg-gray-100')
                    : cn('w-full px-3 py-2 rounded-lg',
                        selectedServiceCategory === sc.id ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700')
                )}
              >
                <span className="text-sm">{sc.icon && sc.icon.length <= 4 ? sc.icon : '📁'}</span>
                <span className="truncate flex-1">{localizedField(sc, 'name')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories (desktop only, or when section is selected) */}
      {selectedSection && sectionCategories.length > 0 && !isMobile && (
        <div>
          <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase">{t('market.filtersTitle')}</h4>
          <div className="space-y-1">
            <button
              onClick={() => onSelectCategory(null)}
              className={cn(
                'w-full px-3 py-1.5 rounded-lg text-xs font-medium text-start',
                !selectedCategory ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              {t('market.all')}
            </button>
            {sectionCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  'w-full px-3 py-1.5 rounded-lg text-xs font-medium text-start truncate',
                  selectedCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'
                )}
              >
                {localizedField(cat, 'name')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div className={isMobile ? 'mb-4' : ''}>
        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase">{t('common.sar')}</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder={ta('من', 'From')}
            value={priceRange[0] || ''}
            onChange={e => onSetPriceRange([Number(e.target.value) || 0, priceRange[1]])}
            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 dark:text-white outline-none focus:border-primary transition-colors"
          />
          <span className="text-gray-400 text-xs">—</span>
          <input
            type="number"
            min="0"
            placeholder={ta('إلى', 'To')}
            value={priceRange[1] === 1000 ? '' : priceRange[1]}
            onChange={e => onSetPriceRange([priceRange[0], Number(e.target.value) || 1000])}
            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 dark:text-white outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Rating */}
      <div className={isMobile ? 'mb-5' : ''}>
        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase">{t('market.rating')}</h4>
        <div className="space-y-1">
          {[4, 3, 2, 1].map(r => (
            <button
              key={r}
              onClick={() => onSetRatingFilter(ratingFilter === r ? 0 : r)}
              className={cn(
                'w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                ratingFilter === r ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-bold' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn('w-3 h-3', i < r ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
              ))}
              <span className="mr-1">+</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {isSidebarOpen && (
        <aside className="hidden lg:block w-64 shrink-0 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sticky top-20 space-y-5">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> {t('market.filtersTitle')}
            </h3>
            {filterContent(false)}
            <Button onClick={onClearFilters} variant="outline" size="sm" className="w-full rounded-xl text-xs">
              <X className="w-3 h-3 me-1" /> {t('market.filtersClear')}
            </Button>
          </div>
        </aside>
      )}

      {/* Mobile filter sheet */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => onSetIsMobileFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-900 dark:text-white">{t('market.filtersAndSort')}</h3>
              <button
                onClick={() => onSetIsMobileFilterOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {filterContent(true)}

            {/* Sort (mobile) */}
            <div className="mb-5">
              <h4 className="text-[10px] font-bold text-gray-400 mb-2">{t('market.sortBy')}</h4>
              <div className="grid grid-cols-2 gap-2">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => onSetSortBy(o.value)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-bold transition-colors',
                      sortBy === o.value ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600'
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => { onClearFilters(); onSetIsMobileFilterOpen(false); }}
                variant="outline"
                className="flex-1 rounded-xl text-xs"
              >
                {t('market.clear')}
              </Button>
              <Button
                onClick={() => onSetIsMobileFilterOpen(false)}
                className="flex-1 rounded-xl text-xs"
              >
                {t('market.showResults')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => onSetIsMobileFilterOpen(true)}
        className="fixed bottom-6 left-6 lg:hidden z-40 w-12 h-12 bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Filter className="w-5 h-5" />
      </button>
    </>
  );
}
