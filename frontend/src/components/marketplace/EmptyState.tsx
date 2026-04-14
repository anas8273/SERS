'use client';
import { ta } from '@/i18n/auto-translations';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * EmptyState
 * 
 * Friendly "no results found" component with clear filters action.
 */
interface EmptyStateProps {
  onClearFilters: () => void;
}

export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-gray-300" />
      </div>
      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
        {ta('لا توجد نتائج', 'No results')}
      </h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs">
        {ta('جرّب تغيير الفلاتر أو البحث بكلمات مختلفة', 'Try changing filters or search with different keywords')}
      </p>
      <Button
        onClick={onClearFilters}
        variant="outline"
        size="sm"
        className="rounded-full px-5 font-bold gap-2"
      >
        <X className="w-3.5 h-3.5" />
        {ta('مسح الفلاتر', 'Clear Filters')}
      </Button>
    </div>
  );
}
