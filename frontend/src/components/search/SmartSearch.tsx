'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  Star,
  Folder,
  Tag,
  History,
  Zap,
  Command,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'template' | 'category' | 'service';
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  price?: number;
  rating?: number;
  is_interactive?: boolean;
}

interface SmartSearchProps {
  placeholder?: string;
  className?: string;
  onSelect?: (result: SearchResult) => void;
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

const RECENT_SEARCHES_KEY = 'sers_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function SmartSearch({
  placeholder = 'ابحث عن القوالب، التصنيفات، الخدمات...',
  className,
  onSelect,
  showSuggestions = true,
  autoFocus = false,
}: SmartSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState([
    'ملف الإنجاز',
    'شهادة شكر',
    'سجل متابعة',
    'خطة علاجية',
    'تحليل نتائج',
  ]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // Invalid JSON
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Debounced search
  const performSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.searchTemplates({ query: searchQuery, limit: 10 });
      if (response.success && response.data) {
        const templates = response.data.map((t: any) => ({
          id: t.id,
          type: 'template' as const,
          title: t.name_ar || t.name,
          description: t.description_ar || t.description,
          thumbnail: t.thumbnail_url,
          category: t.category?.name_ar,
          price: t.price,
          rating: t.average_rating,
          is_interactive: t.is_interactive,
        }));
        setResults(templates);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    performSearch(value);
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(result.title);
    setIsOpen(false);
    setQuery('');

    if (onSelect) {
      onSelect(result);
    } else {
      // Navigate to template
      router.push(`/marketplace/${result.id}`);
    }
  };

  // Handle search term selection (from recent/popular)
  const handleSearchTermSelect = (term: string) => {
    setQuery(term);
    performSearch(term);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        } else if (query.trim()) {
          saveRecentSearch(query);
          router.push(`/marketplace?query=${encodeURIComponent(query)}`);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format price
  const formatPrice = (price: number) => {
    if (price === 0) return 'مجاني';
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pr-12 pl-4 h-14 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 focus:border-primary shadow-lg shadow-gray-100/50 dark:shadow-gray-900/50 text-base transition-all"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute inset-y-0 left-0 ml-2 my-auto h-8 w-8 rounded-full"
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {/* Keyboard shortcut hint */}
        <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
          <ScrollArea className="max-h-[400px]">
            {/* Results */}
            {results.length > 0 ? (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  نتائج البحث
                </div>
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'w-full p-3 flex items-center gap-4 rounded-xl transition-colors text-right',
                      selectedIndex === index
                        ? 'bg-primary/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shrink-0">
                      {result.thumbnail ? (
                        <img
                          src={result.thumbnail}
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FileText className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white truncate">
                          {result.title}
                        </h4>
                        {result.is_interactive && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            <Zap className="h-2.5 w-2.5 mr-1" />
                            تفاعلي
                          </Badge>
                        )}
                      </div>
                      {result.category && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Folder className="h-3 w-3" />
                          {result.category}
                        </p>
                      )}
                    </div>

                    {/* Price & Rating */}
                    <div className="text-left shrink-0">
                      {result.price !== undefined && (
                        <p className="font-bold text-primary">
                          {formatPrice(result.price)}
                        </p>
                      )}
                      {result.rating && result.rating > 0 && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {result.rating.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}

                {/* View all results */}
                <button
                  onClick={() => {
                    saveRecentSearch(query);
                    router.push(`/marketplace?query=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                  }}
                  className="w-full p-3 flex items-center justify-center gap-2 text-primary font-bold hover:bg-primary/5 rounded-xl transition-colors"
                >
                  عرض جميع النتائج
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : query ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Search className="h-6 w-6" />
                </div>
                <p className="text-gray-500 font-medium">لا توجد نتائج لـ "{query}"</p>
                <p className="text-sm text-gray-400 mt-1">جرب كلمات بحث مختلفة</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <History className="h-3 w-3" />
                        عمليات البحث الأخيرة
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        مسح الكل
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 px-3">
                      {recentSearches.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearchTermSelect(term)}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1.5"
                        >
                          <Clock className="h-3 w-3" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    الأكثر بحثاً
                  </div>
                  <div className="flex flex-wrap gap-2 px-3">
                    {popularSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchTermSelect(term)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full text-sm font-medium text-primary transition-colors flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default SmartSearch;
