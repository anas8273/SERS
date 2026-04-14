'use client';

import { cn } from '@/lib/utils';

/**
 * LoadingSpinner
 * 
 * Reusable spinner component (consolidated from loading.tsx)
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

export function LoadingSpinner({
  size = 'md',
  className,
  color = 'primary',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-300 border-t-gray-600',
  };

  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}

/**
 * TemplateCardSkeleton
 * 
 * Skeleton loading state that matches TemplateCard layout
 * Provides visual feedback during data loading
 */
export function TemplateCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-pulse border border-gray-100 dark:border-gray-700 relative">
            {/* Image Skeleton */}
            <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
                {/* Category */}
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />

                {/* Title */}
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>

                {/* Price and Button */}
                <div className="flex items-center justify-between pt-2">
                    <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
            </div>

            {/* Shimmer overlay */}
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>
    );
}

// Alias for backward compatibility
export const ProductCardSkeleton = TemplateCardSkeleton;

/**
 * TemplateGridSkeleton
 * 
 * Grid of TemplateCardSkeleton for page loading states
 */
export function TemplateGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <TemplateCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Alias for backward compatibility
export const ProductGridSkeleton = TemplateGridSkeleton;

/**
 * DashboardStatSkeleton
 * 
 * Skeleton for dashboard stat cards
 */
export function DashboardStatSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
        </div>
    );
}

/**
 * TableRowSkeleton
 * 
 * Skeleton for table rows
 */
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </td>
            ))}
        </tr>
    );
}

/**
 * PageLoadingSkeleton
 * 
 * Full page loading skeleton
 */
export function PageLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
            {/* Header Skeleton */}
            <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700" />
            
            {/* Content Skeleton */}
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * FormSkeleton
 * 
 * Skeleton for form loading states
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
    return (
        <div className="space-y-6 animate-pulse">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
            ))}
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
    );
}

/**
 * StatCardSkeleton (consolidated from skeleton-loaders.tsx)
 */
export function StatCardSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl animate-pulse bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-2 flex-1">
                    <div className="h-6 w-16 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="h-3 w-24 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

/**
 * QuickActionSkeleton
 */
export function QuickActionSkeleton() {
    return (
        <div className="rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse h-[160px]" />
    );
}

/**
 * RecordListSkeleton
 */
export function RecordListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="p-6 space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    </div>
                    <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-800" />
                </div>
            ))}
        </div>
    );
}

/**
 * DashboardSkeleton — Full dashboard skeleton (stats + cards)
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                    <div className="h-10 w-64 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="h-5 w-48 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl" />
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-24 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
                    <div className="h-10 w-28 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <QuickActionSkeleton key={i} />
                ))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

export default TemplateCardSkeleton;
