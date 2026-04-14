/**
 * useMarketplace.ts
 * 
 * Architecture (FINAL):
 *   - الفئات (Categories) = Firestore service_categories
 *     (المعلمين, الإدارة المدرسية, رياض الأطفال...)
 *     → Pill buttons for audience filtering
 *     → Templates link via category_id (Firestore doc ID)
 *
 *   - الأقسام (Sections) = MySQL sections table
 *     (ملفات الإنجاز, شواهد الأداء, الشهادات...)
 *     → Carousel sections for template type browsing
 *     → Templates link via section_id (MySQL UUID)
 *
 *   - NO sub-categories (MySQL categories table is not used)
 *
 *   Flow:
 *     1. User sees all sections as carousels
 *     2. User clicks a فئة → carousels filter to show only templates in that فئة
 *     3. Each section carousel shows its templates filtered by the selected فئة
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getServiceCategories } from '@/lib/firestore-service';
import { fuzzySearch, detectExactPhrase } from '@/lib/fuzzy-search';
import type { Template, Section, ServiceCategory } from '@/types';

// ── Types ──
export type SortOption = 'latest' | 'popular' | 'price_low' | 'price_high' | 'rating';

export const SORT_OPTIONS: { value: SortOption; label: string; icon: string; translationKey: string }[] = [
  { value: 'latest', label: 'الأحدث', icon: '🆕', translationKey: 'market.sort.latest' },
  { value: 'popular', label: 'الأكثر مبيعاً', icon: '🔥', translationKey: 'market.sort.popular' },
  { value: 'rating', label: 'الأعلى تقييماً', icon: '⭐', translationKey: 'market.sort.topRated' },
  { value: 'price_low', label: 'الأقل سعراً', icon: '💰', translationKey: 'market.sort.priceAsc' },
  { value: 'price_high', label: 'الأعلى سعراً', icon: '💎', translationKey: 'market.sort.priceDesc' },
];

// ── Section icon/gradient mappings ──
export const SECTION_ICONS: Record<string, string> = {
  'achievement-files': '📁', 'performance-evidence': '🏆', 'school-records': '📋',
  'tests': '✅', 'reports': '📊', 'initiatives': '💡', 'certificates': '🎖️',
  'workshops-training': '👥', 'applied-lessons': '🎬', 'knowledge-production': '🧠',
  'remedial-enrichment': '📈', 'plans': '📅', 'learning-loss': '⚠️',
};

export const SECTION_GRADIENTS: Record<string, string> = {
  'achievement-files': 'from-blue-500 to-indigo-600',
  'performance-evidence': 'from-amber-500 to-orange-600',
  'school-records': 'from-emerald-500 to-green-600',
  'tests': 'from-violet-500 to-purple-600',
  'reports': 'from-sky-500 to-cyan-600',
  'initiatives': 'from-yellow-500 to-amber-600',
  'certificates': 'from-rose-500 to-pink-600',
  'workshops-training': 'from-teal-500 to-emerald-600',
  'applied-lessons': 'from-indigo-500 to-blue-600',
  'knowledge-production': 'from-fuchsia-500 to-purple-600',
  'remedial-enrichment': 'from-red-500 to-rose-600',
  'plans': 'from-green-500 to-teal-600',
  'learning-loss': 'from-orange-500 to-red-600',
};

export const CATEGORY_ICONS: Record<string, string> = {
  'المعلمين والمعلمات': '👨‍🏫', 'الإدارة المدرسية': '🏫',
  'التوجيه والإرشاد': '🧭', 'النشاط الطلابي': '🎯',
  'رياض الأطفال': '🧒', 'التربية الخاصة': '♿', 'عام': '📋',
};

export function getSectionIcon(slug: string) { return SECTION_ICONS[slug] || '📁'; }
export function getSectionGradient(slug: string) { return SECTION_GRADIENTS[slug] || 'from-violet-500 to-purple-600'; }
export function getSectionColor(slug: string) {
  const colors: Record<string, string> = {
    'achievement-files': 'blue', 'performance-evidence': 'amber', 'school-records': 'emerald',
    'tests': 'violet', 'reports': 'sky', 'initiatives': 'yellow', 'certificates': 'rose',
    'workshops-training': 'teal', 'applied-lessons': 'indigo', 'knowledge-production': 'fuchsia',
    'remedial-enrichment': 'red', 'plans': 'green', 'learning-loss': 'orange',
  };
  return colors[slug] || 'blue';
}
export function getCategoryIcon(name: string) { return CATEGORY_ICONS[name] || '📁'; }

export interface SectionGroup {
  section: Section;
  templates: Template[];
  count: number;
}

// ══════════════════════════════════════
// Hook
// ══════════════════════════════════════
export function useMarketplace() {
  const searchParams = useSearchParams();

  // ── Data ──
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filters ──
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Firestore فئة
  const [selectedSection, setSelectedSection] = useState<string | null>(null);   // MySQL قسم
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [exactPhrase, setExactPhrase] = useState(false);

  // ── Debounce + auto-detect exact phrase ──
  useEffect(() => {
    const t = setTimeout(() => {
      const { isExact, phrase } = detectExactPhrase(searchQuery);
      // Auto-detect quotes — sync exactPhrase toggle with detected state
      if (isExact) setExactPhrase(true);
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Fetch ──
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [templatesRes, sectionsRes, cats] = await Promise.all([
          api.getTemplates({}).catch(() => ({ data: { data: [] } })),
          api.getSections().catch(() => ({ data: [] })),
          getServiceCategories().catch(() => []),
        ]);

        if (!isMounted) return;

        const td = templatesRes.data?.data || templatesRes.data || [];
        setAllTemplates(Array.isArray(td) ? td : []);

        const sd = sectionsRes.data?.data || sectionsRes.data || sectionsRes || [];
        setSections(Array.isArray(sd) ? sd : []);

        const active = (cats || []).filter((c: ServiceCategory) => c.is_active !== false);
        setServiceCategories(active.sort((a: ServiceCategory, b: ServiceCategory) => (a.sort_order || 0) - (b.sort_order || 0)));
      } catch {
        if (isMounted) setAllTemplates([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // ── Filtered templates (applies all active filters) ──
  const filteredTemplates = useMemo(() => {
    let result = [...allTemplates];

    // Firestore category filter
    if (selectedCategory) {
      result = result.filter(t => t.category_id === selectedCategory);
    }
    // MySQL section filter
    if (selectedSection) {
      result = result.filter(t => (t as any).section_id === selectedSection);
    }
    // Rating
    if (ratingFilter > 0) {
      result = result.filter(t => (Number(t.average_rating) || 0) >= ratingFilter);
    }
    // Search — smart: exact phrase or fuzzy with scoring
    if (debouncedSearch.trim()) {
      const { isExact, phrase } = detectExactPhrase(debouncedSearch);
      const hits = fuzzySearch(
        result,
        phrase,
        (t) => [
          ['name', t.name_ar],
          ['description', t.description_ar || ''],
          ['tags', (t as any).tags_ar || ''],
        ],
        { exactPhrase: exactPhrase || isExact }
      );
      result = hits.map(r => r.item);
    }
    // Sort (non-mutating — create new array)
    switch (sortBy) {
      case 'popular': return [...result].sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0));
      case 'rating':  return [...result].sort((a, b) => (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0));
      case 'price_low':  return [...result].sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
      case 'price_high': return [...result].sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
      default: return result;
    }
  }, [allTemplates, debouncedSearch, selectedCategory, selectedSection, ratingFilter, sortBy, exactPhrase]);

  // ── Featured ──
  const featuredTemplates = useMemo(() =>
    allTemplates.filter(t => t.is_featured).slice(0, 12),
    [allTemplates]
  );

  // ── Best sellers ──
  const bestSellers = useMemo(() =>
    [...allTemplates]
      .sort((a, b) => (b.sales_count || b.downloads_count || 0) - (a.sales_count || a.downloads_count || 0))
      .slice(0, 12),
    [allTemplates]
  );

  // ── Section groups (KEY: filtered by selectedCategory!) ──
  //    When a فئة is selected, each section carousel only shows
  //    templates that belong to BOTH that فئة AND that قسم.
  const sectionGroups = useMemo<SectionGroup[]>(() => {
    // Start from the active template pool (optionally filtered by category)
    let pool = allTemplates;
    if (selectedCategory) {
      pool = pool.filter(t => t.category_id === selectedCategory);
    }
    return sections
      .map(section => {
        const tpls = pool.filter(t => (t as any).section_id === section.id);
        return { section, templates: tpls, count: tpls.length };
      })
      .filter(g => g.count > 0);
  }, [sections, allTemplates, selectedCategory]);

  // ── Derived ──
  const isFiltered = !!(selectedSection || debouncedSearch || ratingFilter > 0);
  const activeFilterCount = [selectedSection, debouncedSearch, ratingFilter > 0 ? 'r' : null, exactPhrase ? 'ep' : null].filter(Boolean).length;

  // ── Actions ──
  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSection(null);
    setSearchQuery('');
    setDebouncedSearch('');
    setSortBy('latest');
    setRatingFilter(0);
    setExactPhrase(false);
  }, []);

  const selectCategory = useCallback((catId: string) => {
    setSelectedCategory(prev => prev === catId ? null : catId);
    setSelectedSection(null); // Reset section when switching category
  }, []);

  const selectSection = useCallback((sectionId: string) => {
    setSelectedSection(prev => prev === sectionId ? null : sectionId);
  }, []);

  return {
    allTemplates, sections, serviceCategories, isLoading,
    filteredTemplates, featuredTemplates, bestSellers, sectionGroups,
    selectedCategory, selectedSection,
    searchQuery, debouncedSearch, sortBy, ratingFilter,
    exactPhrase, setExactPhrase,
    isFiltered, activeFilterCount,
    setSearchQuery, setSortBy, setRatingFilter,
    setSelectedCategory, setSelectedSection,
    clearFilters, selectCategory, selectSection,
  };
}
