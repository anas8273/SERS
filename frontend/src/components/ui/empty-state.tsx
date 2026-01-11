'use client';

import { ReactNode } from 'react';

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
        <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
            {/* Icon */}
            {icon && (
                <div className="text-gray-300 mb-4">
                    {icon}
                </div>
            )}

            {/* Default Icon if none provided */}
            {!icon && (
                <div className="text-6xl mb-4 opacity-50">📭</div>
            )}

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-700 mb-2 text-center">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-gray-500 text-center max-w-md mb-6">
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

export function NoProductsEmpty() {
    return (
        <EmptyState
            icon={<span className="text-6xl">📦</span>}
            title="لا توجد منتجات"
            description="لم يتم إضافة أي منتجات بعد. ابدأ بإضافة منتجك الأول!"
            action={
                <a
                    href="/admin/products/create"
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    إضافة منتج جديد
                </a>
            }
        />
    );
}

export function NoOrdersEmpty() {
    return (
        <EmptyState
            icon={<span className="text-6xl">🛒</span>}
            title="لا توجد طلبات"
            description="لم تقم بأي عملية شراء بعد. تصفح المتجر واكتشف منتجاتنا!"
            action={
                <a
                    href="/marketplace"
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    تصفح المتجر
                </a>
            }
        />
    );
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
    return (
        <EmptyState
            icon={<span className="text-6xl">🔍</span>}
            title="لا توجد نتائج"
            description={`لم نجد أي منتجات تطابق "${query}". جرب كلمات بحث مختلفة.`}
        />
    );
}

export function NoLibraryEmpty() {
    return (
        <EmptyState
            icon={<span className="text-6xl">📚</span>}
            title="مكتبتك فارغة"
            description="المنتجات التي تشتريها ستظهر هنا للوصول السريع."
            action={
                <a
                    href="/marketplace"
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    استكشف المنتجات
                </a>
            }
        />
    );
}

export default EmptyState;
