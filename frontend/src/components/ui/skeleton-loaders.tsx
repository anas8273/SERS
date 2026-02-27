'use client';

import { cn } from '@/lib/utils';

// Base skeleton pulse
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800', className)}
            {...props}
        />
    );
}

// Stat card skeleton
export function StatCardSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        </div>
    );
}

// Quick action card skeleton
export function QuickActionSkeleton() {
    return (
        <div className="rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse h-[160px]" />
    );
}

// Record list skeleton
export function RecordListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="p-6 space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full" />
                </div>
            ))}
        </div>
    );
}

// Full dashboard skeleton (stats + cards)
export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-200">
            {/* Welcome skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-48" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-24 rounded-full" />
                    <Skeleton className="h-10 w-28 rounded-full" />
                </div>
            </div>

            {/* Quick actions skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <QuickActionSkeleton key={i} />
                ))}
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

export { Skeleton };
