'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SafeImage } from '@/components/ui/safe-image';
import { Search, X, Loader2, FileText, ArrowLeft, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';
import type { Template } from '@/types';

/**
 * MeilisearchHeroSearch
 * 
 * Premium instant-search bar that queries the backend Meilisearch endpoint.
 * Falls back to client-side fuzzy search if Meilisearch is unavailable.
 * Features: typo-tolerance, real-time results, recent searches, keyboard navigation.
 */

interface MeilisearchHeroSearchProps {
  /** Optional: all templates for client-side fallback */
  allTemplates?: Template[];
  className?: string;
}

const STORAGE_KEY = 'sers-recent-searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter(s => s !== query);
  recent.unshift(query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function MeilisearchHeroSearch({ allTemplates = [], className }: MeilisearchHeroSearchProps) {
  const router = useRouter();
  const { t, dir } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load recent searches
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

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

  // Search via backend Meilisearch endpoint
  const searchBackend = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const response = await api.searchTemplates({ query: q, limit: 6 });
      const hits = response.data?.data || response.data || response || [];
      setResults(Array.isArray(hits) ? hits.slice(0, 6) : []);
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return;
      // Fallback: client-side filter
      if (allTemplates.length > 0) {
        const lower = q.toLowerCase();
        const fallback = allTemplates
          .filter(t =>
            t.name_ar.toLowerCase().includes(lower) ||
            (t.description_ar || '').toLowerCase().includes(lower)
          )
          .slice(0, 6);
        setResults(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  }, [allTemplates]);

  // Debounced search (250ms for real-time feel)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(() => searchBackend(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchBackend]);

  const handleSelect = (template: Template) => {
    addRecentSearch(query);
    setRecentSearches(getRecentSearches());
    setIsFocused(false);
    setQuery('');
    router.push(`/marketplace/${template.slug}`);
  };

  const handleSubmit = () => {
    if (query.trim()) {
      addRecentSearch(query);
      setRecentSearches(getRecentSearches());
      setIsFocused(false);
      // Navigate to marketplace with search param
      router.push(`/marketplace?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleRecentClick = (q: string) => {
    setQuery(q);
    setIsFocused(true);
    inputRef.current?.focus();
  };

  // Keyboard navigation
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
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = isFocused && (query.trim().length > 0 || recentSearches.length > 0);
  const showResults = query.trim().length > 0;

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-2xl mx-auto', className)}>
      {/* Search Input */}
      <div className={cn(
        'flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl px-5 py-4 transition-all duration-300 border',
        isFocused
          ? 'border-white/40 bg-white/15 shadow-2xl shadow-black/20 ring-2 ring-white/20'
          : 'border-white/10 hover:border-white/25 hover:bg-white/12'
      )}>
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-white/60 animate-spin shrink-0" />
        ) : (
          <Search className={cn(
            'w-5 h-5 shrink-0 transition-colors',
            isFocused ? 'text-white' : 'text-white/50'
          )} />
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIndex(-1); }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('market.searchPlaceholder')}
          className="flex-1 bg-transparent text-base text-white placeholder-white/40 outline-none min-w-0 font-medium"
          dir={dir}
          autoComplete="off"
        />

        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        )}

        {query.trim() && (
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl transition-all shrink-0"
          >
            {t('market.searchButton')}
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
                {/* Search Results */}
                {results.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {results.map((template, i) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelect(template)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 text-start transition-colors',
                          activeIndex === i
                            ? 'bg-primary/5 dark:bg-primary/10'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        )}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                          <SafeImage
                            src={template.thumbnail_url}
                            alt={template.name_ar}
                            fill
                            className="object-cover"
                            sizes="48px"
                            fallback={
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-400" />
                              </div>
                            }
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                            {template.name_ar}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {template.category?.name_ar || template.section?.name_ar || ''}
                          </p>
                        </div>

                        {/* Price */}
                        <span className="text-sm font-black text-primary shrink-0">
                          {formatPrice(template.discount_price || template.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : !isLoading ? (
                  <div className="py-8 text-center">
                    <Search className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {t('market.noResultsFor')} &quot;{query}&quot;
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{t('market.tryDifferentKeywords')}</p>
                  </div>
                ) : null}

                {results.length > 0 && (
                  <button
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors border-t border-gray-100 dark:border-gray-700"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('market.viewAllResultsFor')} &quot;{query}&quot;
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              /* Recent Searches */
              recentSearches.length > 0 && (
                <>
                  <div className="px-4 py-2.5 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                    <Clock className="w-3 h-3" />
                    {t('market.recentSearches')}
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
  );
}
