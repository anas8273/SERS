'use client';

import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  variant?: 'default' | 'horizontal' | 'compact';
  showImage?: boolean;
  showBadge?: boolean;
  showActions?: boolean;
  lines?: number;
}

export function SkeletonCard({
  className,
  variant = 'default',
  showImage = true,
  showBadge = true,
  showActions = true,
  lines = 2,
}: SkeletonCardProps) {
  if (variant === 'horizontal') {
    return (
      <div className={cn('flex gap-4 p-4 border rounded-xl animate-pulse', className)}>
        {showImage && (
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
        )}
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
              style={{ width: `${100 - i * 15}%` }}
            />
          ))}
          {showActions && (
            <div className="flex gap-2 pt-2">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('p-3 border rounded-lg animate-pulse', className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border rounded-xl overflow-hidden animate-pulse', className)}>
      {showImage && (
        <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
      )}
      <div className="p-4 space-y-3">
        {showBadge && (
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        )}
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
            style={{ width: `${100 - i * 20}%` }}
          />
        ))}
        {showActions && (
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
  variant?: 'default' | 'horizontal' | 'compact';
  className?: string;
}

export function SkeletonList({ count = 6, variant = 'default', className }: SkeletonListProps) {
  const gridClass = variant === 'horizontal' || variant === 'compact'
    ? 'space-y-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <div className={cn(gridClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 5, className }: SkeletonTableProps) {
  return (
    <div className={cn('border rounded-xl overflow-hidden animate-pulse', className)}>
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="p-4 flex gap-4 border-t border-gray-100 dark:border-gray-800"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"
              style={{ opacity: 1 - rowIndex * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonStatsProps {
  count?: number;
  className?: string;
}

export function SkeletonStats({ count = 4, className }: SkeletonStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-2" />
        </div>
      ))}
    </div>
  );
}

interface SkeletonChartProps {
  className?: string;
  type?: 'bar' | 'line' | 'pie';
}

export function SkeletonChart({ className, type = 'bar' }: SkeletonChartProps) {
  if (type === 'pie') {
    return (
      <div className={cn('flex items-center justify-center p-8 animate-pulse', className)}>
        <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn('p-4 animate-pulse', className)}>
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    </div>
  );
}
