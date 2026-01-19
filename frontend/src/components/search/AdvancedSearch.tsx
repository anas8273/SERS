'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchFilter {
  id: string;
  label: string;
  type: 'select' | 'range' | 'checkbox' | 'date';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

interface AdvancedSearchProps {
  placeholder?: string;
  filters?: SearchFilter[];
  onSearch: (query: string, filters: Record<string, any>) => void;
  onAISuggest?: (query: string) => Promise<string[]>;
  className?: string;
  showAI?: boolean;
}

export function AdvancedSearch({
  placeholder = 'ابحث...',
  filters = [],
  onSearch,
  onAISuggest,
  className = '',
  showAI = true,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Get AI suggestions when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2 && showAI && onAISuggest) {
      setIsLoadingSuggestions(true);
      onAISuggest(debouncedQuery)
        .then(setSuggestions)
        .catch(console.error)
        .finally(() => setIsLoadingSuggestions(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, showAI, onAISuggest]);

  // Trigger search when query or filters change
  useEffect(() => {
    onSearch(debouncedQuery, activeFilters);
  }, [debouncedQuery, activeFilters, onSearch]);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      // Save to recent searches
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
    onSearch(query, activeFilters);
    setShowSuggestions(false);
  }, [query, activeFilters, recentSearches, onSearch]);

  const handleFilterChange = useCallback((filterId: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: value,
    }));
  }, []);

  const clearFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => {
      const updated = { ...prev };
      delete updated[filterId];
      return updated;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  const selectSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch();
  }, [handleSearch]);

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute right-3 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={placeholder}
            className="pr-10 pl-24"
          />
          <div className="absolute left-2 flex items-center gap-1">
            {showAI && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                onClick={() => onAISuggest?.(query)}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 px-2 ${activeFilterCount > 0 ? 'text-blue-600' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="mr-1 text-xs bg-blue-100 text-blue-600 rounded-full px-1.5">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (query.length > 0 || recentSearches.length > 0) && (
          <div className="absolute top-full right-0 left-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
            {/* AI Suggestions */}
            {isLoadingSuggestions && (
              <div className="p-3 text-center text-gray-500">
                <Sparkles className="h-4 w-4 animate-pulse inline-block ml-2" />
                جاري البحث الذكي...
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs text-gray-500 px-2 mb-1 flex items-center">
                  <Sparkles className="h-3 w-3 ml-1 text-purple-500" />
                  اقتراحات ذكية
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-right px-3 py-2 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && query.length === 0 && (
              <div className="p-2 border-t">
                <div className="text-xs text-gray-500 px-2 mb-1">عمليات البحث الأخيرة</div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="w-full text-right px-3 py-2 hover:bg-gray-100 rounded-md text-sm flex items-center justify-between"
                    onClick={() => selectSuggestion(search)}
                  >
                    <span>{search}</span>
                    <X
                      className="h-4 w-4 text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = recentSearches.filter((_, i) => i !== index);
                        setRecentSearches(updated);
                        localStorage.setItem('recentSearches', JSON.stringify(updated));
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700">فلاتر البحث</h4>
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700"
              >
                مسح الكل
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-1">
                <label className="text-sm text-gray-600">{filter.label}</label>
                
                {filter.type === 'select' && (
                  <select
                    value={activeFilters[filter.id] || ''}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="">الكل</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === 'range' && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="من"
                      min={filter.min}
                      max={filter.max}
                      value={activeFilters[filter.id]?.min || ''}
                      onChange={(e) =>
                        handleFilterChange(filter.id, {
                          ...activeFilters[filter.id],
                          min: e.target.value,
                        })
                      }
                      className="w-1/2"
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="number"
                      placeholder="إلى"
                      min={filter.min}
                      max={filter.max}
                      value={activeFilters[filter.id]?.max || ''}
                      onChange={(e) =>
                        handleFilterChange(filter.id, {
                          ...activeFilters[filter.id],
                          max: e.target.value,
                        })
                      }
                      className="w-1/2"
                    />
                  </div>
                )}

                {filter.type === 'checkbox' && (
                  <div className="space-y-1">
                    {filter.options?.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters[filter.id]?.includes(option.value) || false}
                          onChange={(e) => {
                            const current = activeFilters[filter.id] || [];
                            const updated = e.target.checked
                              ? [...current, option.value]
                              : current.filter((v: string) => v !== option.value);
                            handleFilterChange(filter.id, updated.length > 0 ? updated : undefined);
                          }}
                          className="rounded"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}

                {filter.type === 'date' && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={activeFilters[filter.id]?.from || ''}
                      onChange={(e) =>
                        handleFilterChange(filter.id, {
                          ...activeFilters[filter.id],
                          from: e.target.value,
                        })
                      }
                      className="w-1/2"
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="date"
                      value={activeFilters[filter.id]?.to || ''}
                      onChange={(e) =>
                        handleFilterChange(filter.id, {
                          ...activeFilters[filter.id],
                          to: e.target.value,
                        })
                      }
                      className="w-1/2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find(f => f.id === key);
            if (!filter || !value) return null;

            let displayValue = '';
            if (filter.type === 'select') {
              displayValue = filter.options?.find(o => o.value === value)?.label || value;
            } else if (filter.type === 'range') {
              displayValue = `${value.min || '0'} - ${value.max || '∞'}`;
            } else if (filter.type === 'checkbox') {
              displayValue = Array.isArray(value) ? value.length + ' محدد' : value;
            } else if (filter.type === 'date') {
              displayValue = `${value.from || ''} - ${value.to || ''}`;
            }

            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {filter.label}: {displayValue}
                <button onClick={() => clearFilter(key)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdvancedSearch;
