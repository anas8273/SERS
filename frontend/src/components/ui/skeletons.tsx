'use client';

/**
 * TemplateCardSkeleton
 * 
 * Skeleton loading state that matches TemplateCard layout
 * Provides visual feedback during data loading
 */
export function TemplateCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-pulse border border-gray-100 dark:border-gray-700">
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

export default TemplateCardSkeleton;
