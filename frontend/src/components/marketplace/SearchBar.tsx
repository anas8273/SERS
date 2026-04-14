'use client';
import { ta } from '@/i18n/auto-translations';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SearchBar
 * 
 * Smart search input with dropdown suggestions, recent searches,
 * and instant visual feedback.
 */
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  className?: string;
}

const STORAGE_KEY = 'sers-marketplace-recent-searches';
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

export function SearchBar({ value, onChange, resultCount, className }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = useCallback((query: string) => {
    if (query.trim()) {
      addRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
    }
    setIsFocused(false);
    inputRef.current?.blur();
  }, []);

  const showDropdown = isFocused && !value && recentSearches.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className={cn(
        'flex items-center gap-2 bg-white dark:bg-gray-800 border rounded-xl px-3 py-2 transition-all duration-200',
        isFocused
          ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
      )}>
        <Search className={cn(
          'w-4 h-4 transition-colors shrink-0',
          isFocused ? 'text-primary' : 'text-gray-400'
        )} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSubmit(value);
            if (e.key === 'Escape') { setIsFocused(false); inputRef.current?.blur(); }
          }}
          placeholder={ta('ابحث عن قوالب، سجلات، شهادات...', 'Search templates, records, certificates...')}
          className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none min-w-0"
          dir="rtl"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Result count indicator */}
      {value && resultCount !== undefined && (
        <div className="absolute -bottom-5 right-0 text-[10px] text-gray-400">
          {resultCount} نتيجة
        </div>
      )}

      {/* Recent searches dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 border-b border-gray-100 dark:border-gray-700">
            <Clock className="w-3 h-3" />
            {ta('عمليات بحث سابقة', 'Previous Searches')}
          </div>
          {recentSearches.map((q, i) => (
            <button
              key={i}
              onClick={() => { onChange(q); handleSubmit(q); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-start"
            >
              <TrendingUp className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{q}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
