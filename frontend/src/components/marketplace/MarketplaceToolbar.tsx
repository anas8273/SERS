'use client';
import { ta } from '@/i18n/auto-translations';

import { cn } from '@/lib/utils';
import { getSectionIcon } from './MegaMenu';
import { MegaMenu } from './MegaMenu';
import { SORT_OPTIONS, type SortOption, getSectionColor } from '@/hooks/useMarketplace';
import {
  LayoutGrid, ChevronDown, SlidersHorizontal,
  Filter, X,
} from 'lucide-react';
import type { Section, Category } from '@/types';
import type { SectionGroup } from '@/hooks/useMarketplace';

/**
 * MarketplaceToolbar
 * 
 * Sticky toolbar with section tabs, sort dropdown, filter toggle,
 * and sub-category row when a section is selected.
 */
interface MarketplaceToolbarProps {
  sections: Section[];
  sectionGroups: SectionGroup[];
  sectionCategories: Category[];
  categories: Category[];
  selectedSection: string | null;
  selectedCategory: string | null;
  sortBy: SortOption;
  isFiltered: boolean;
  activeFilterCount: number;
  isSortOpen: boolean;
  isMegaMenuOpen: boolean;
  isSidebarOpen: boolean;
  megaMenuData: Array<Section & { rootCategories: Category[]; templateCount: number }>;
  // Actions
  onSelectSection: (id: string) => void;
  onSelectCategory: (id: string | null) => void;
  onSetSortBy: (sort: SortOption) => void;
  onSetIsSortOpen: (open: boolean) => void;
  onSetIsMegaMenuOpen: (open: boolean) => void;
  onSetIsSidebarOpen: (open: boolean) => void;
  onSetIsMobileFilterOpen: (open: boolean) => void;
  onClearFilters: () => void;
}

export function MarketplaceToolbar({
  sections, sectionGroups, sectionCategories,
  selectedSection, selectedCategory, sortBy,
  isFiltered, activeFilterCount,
  isSortOpen, isMegaMenuOpen, isSidebarOpen, megaMenuData,
  onSelectSection, onSelectCategory, onSetSortBy,
  onSetIsSortOpen, onSetIsMegaMenuOpen, onSetIsSidebarOpen,
  onSetIsMobileFilterOpen, onClearFilters,
}: MarketplaceToolbarProps) {
  return (
    <section className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Section tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            <button
              onClick={onClearFilters}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5',
                !isFiltered
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {ta('الرئيسية', 'Home')}
            </button>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 shrink-0" />

            {sections.slice(0, 5).map(s => (
              <button
                key={s.id}
                onClick={() => onSelectSection(s.id)}
                className={cn(
                  'px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5',
                  selectedSection === s.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {getSectionIcon(s.slug)}
                {s.name_ar}
              </button>
            ))}

            {/* Mega Menu trigger */}
            {sections.length > 5 && (
              <div className="relative shrink-0">
                <button
                  onClick={() => onSetIsMegaMenuOpen(!isMegaMenuOpen)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all',
                    isMegaMenuOpen
                      ? 'bg-primary text-white'
                      : 'text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                  )}
                >
                  {ta('المزيد', 'More')}
                  <ChevronDown className={cn('w-3 h-3 transition-transform', isMegaMenuOpen && 'rotate-180')} />
                </button>
              </div>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                مسح ({activeFilterCount})
              </button>
            )}

            {/* Desktop sidebar toggle */}
            <button
              onClick={() => onSetIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                'hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all',
                isSidebarOpen
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              {ta('فلترة', 'Filter')}
            </button>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => onSetIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <ChevronDown className={cn('w-3 h-3 transition-transform', isSortOpen && 'rotate-180')} />
              </button>
              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => onSetIsSortOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400">{ta('الترتيب', 'Sort Order')}</div>
                    {SORT_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { onSetSortBy(o.value); onSetIsSortOpen(false); }}
                        className={cn(
                          'w-full px-3 py-2 text-xs font-medium text-start transition-colors',
                          sortBy === o.value
                            ? 'bg-primary/5 text-primary font-bold'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Mobile filter */}
            <button
              onClick={() => onSetIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-600 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sub-categories when section selected */}
        {selectedSection && sectionCategories.length > 0 && (
          <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-hide border-t border-gray-100 dark:border-gray-800 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="text-[10px] font-bold text-gray-400 shrink-0">{ta('التصنيفات:', 'Categories:')}</span>
            <button
              onClick={() => onSelectCategory(null)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all',
                !selectedCategory ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {ta('الكل', 'All')}
            </button>
            {sectionCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all',
                  selectedCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                {cat.name_ar}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mega Menu */}
      <MegaMenu
        isOpen={isMegaMenuOpen}
        onClose={() => onSetIsMegaMenuOpen(false)}
        sections={megaMenuData}
        onSelectSection={onSelectSection}
        onSelectCategory={(sectionId, categoryId) => {
          onSelectSection(sectionId);
          onSelectCategory(categoryId);
          onSetIsMegaMenuOpen(false);
        }}
      />
    </section>
  );
}
