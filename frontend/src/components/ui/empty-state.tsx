'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

/**
 * EmptyState
 * 
 * Displays a friendly message when there's no data to show
 * Supports custom icons, titles, descriptions, and action buttons
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    className = ''
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-16 px-4",
            className
        )}>
            {/* Icon */}
            {icon && (
                <div className="text-gray-300 dark:text-gray-600 mb-4">
                    {icon}
                </div>
            )}

            {/* Default Icon if none provided */}
            {!icon && (
                <div className="text-6xl mb-4 opacity-50">📭</div>
            )}

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
}

/**
 * Pre-built Empty States
 */

export function NoTemplatesEmpty() {
    return (
        <EmptyState
            icon={<span className="text-6xl">📦</span>}
            title="لا توجد قوالب"
            description="لم يتم إضافة أي قوالب بعد. ابدأ بإضافة قالبك الأول!"
            action={
                <Link
                    href="/admin/templates/create"
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    إضافة قالب جديد
                </Link>
            }
        />
    );
}

// Alias for backward compatibility
export const NoProductsEmpty = NoTemplatesEmpty;

export function NoOrdersEmpty() {
    return (
        <EmptyState
            icon={<span className="text-6xl">🛒</span>}
            title="لا توجد طلبات"
            description="لم تقم بأي عملية شراء بعد. تصفح المتجر واكتشف قوالبنا!"
            action={
                <Link
                    href="/marketplace"
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    تصفح المتجر
                </Link>
            }
        />
    );
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
    return (
        <EmptyState
            icon={<span className="text-6xl">🔍</span>}
            title="لا توجد نتائج"
            description={`لم نجد أي قوالب تطابق "${query}". جرب كلمات بحث مختلفة.`}
        />
    );
}

export function NoLibraryEmpty() {
    return (
        <EmptyState
            icon={<span className="text-6xl">📚</span>}
            title="مكتبتك فارغة"
            description="القوالب التي تشتريها ستظهر هنا للوصول السريع."
            action={
                <Link
                    href="/marketplace"
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    استكشف القوالب
                </Link>
            }
        />
    );
}

export function NoRecordsEmpty() {
    return (
        <EmptyState
            icon={<span className="text-6xl">📝</span>}
            title="لا توجد سجلات"
            description="لم تقم بإنشاء أي سجلات تفاعلية بعد."
            action={
                <Link
                    href="/marketplace?type=interactive"
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    استكشف القوالب التفاعلية
                </Link>
            }
        />
    );
}

export function NoNotificationsEmpty() {
    return (
        <EmptyState
            icon={<span className="text-6xl">🔔</span>}
            title="لا توجد إشعارات"
            description="ستظهر هنا الإشعارات الجديدة عند وصولها."
        />
    );
}

export function ErrorState({ 
    message = "حدث خطأ غير متوقع",
    onRetry 
}: { 
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <EmptyState
            icon={<span className="text-6xl">⚠️</span>}
            title="حدث خطأ"
            description={message}
            action={onRetry && (
                <button
                    onClick={onRetry}
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    إعادة المحاولة
                </button>
            )}
        />
    );
}

export default EmptyState;
