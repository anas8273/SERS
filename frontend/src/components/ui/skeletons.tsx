'use client';

/**
 * ProductCardSkeleton
 * 
 * Skeleton loading state that matches ProductCard layout
 * Provides visual feedback during data loading
 */
export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            {/* Image Skeleton */}
            <div className="aspect-[4/3] bg-gray-200" />

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
                {/* Category */}
                <div className="h-3 w-16 bg-gray-200 rounded" />

                {/* Title */}
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                </div>

                {/* Price and Button */}
                <div className="flex items-center justify-between pt-2">
                    <div className="h-5 w-20 bg-gray-200 rounded" />
                    <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

/**
 * ProductGridSkeleton
 * 
 * Grid of ProductCardSkeleton for page loading states
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * DashboardStatSkeleton
 * 
 * Skeleton for dashboard stat cards
 */
export function DashboardStatSkeleton() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="h-8 w-28 bg-gray-200 rounded" />
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-xl" />
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
                    <div className="h-4 bg-gray-200 rounded w-full" />
                </td>
            ))}
        </tr>
    );
}

export default ProductCardSkeleton;
