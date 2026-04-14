'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import { motion } from 'framer-motion';
import {
    PackageOpen,
    ShoppingBag,
    LibrarySquare,
    FileText,
    BellRing,
    SearchX,
    AlertTriangle,
} from 'lucide-react';

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
    const { dir } = useTranslation();
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
                "flex flex-col items-center justify-center py-16 px-4 max-w-lg mx-auto",
                className
            )}
            dir={dir}
        >
            {/* Icon */}
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="mb-6 relative"
            >
                <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-full blur-2xl scale-150" />
                <div className="relative bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl shadow-primary/5 border border-primary/10">
                    {icon || <PackageOpen className="w-12 h-12 text-primary opacity-50" />}
                </div>
            </motion.div>

            {/* Title */}
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 text-center">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-gray-500 dark:text-gray-400 text-center text-base mb-8 leading-relaxed">
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="w-full sm:w-auto"
                >
                    {action}
                </motion.div>
            )}
        </motion.div>
    );
}

/**
 * Pre-built Empty States
 */

export function NoTemplatesEmpty() {
    const { t } = useTranslation();
    return (
        <EmptyState
            icon={<PackageOpen className="w-12 h-12 text-violet-500" strokeWidth={1.5} />}
            title={t('empty.noTemplates.title')}
            description={t('empty.noTemplates.desc')}
            action={
                <Link
                    href="/admin/templates/create"
                    className="flex items-center justify-center px-8 py-3.5 bg-gradient-to-br from-violet-600 to-violet-500 text-white font-bold rounded-2xl hover:from-violet-700 hover:to-violet-600 hover:shadow-lg hover:shadow-violet-500/25 transition-all w-full sm:w-auto hover:scale-105 active:scale-95"
                >
                    {t('empty.noTemplates.action')}
                </Link>
            }
        />
    );
}

// Alias for backward compatibility
export const NoProductsEmpty = NoTemplatesEmpty;

export function NoOrdersEmpty() {
    const { t } = useTranslation();
    return (
        <EmptyState
            icon={<ShoppingBag className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />}
            title={t('empty.noOrders.title')}
            description={t('empty.noOrders.desc')}
            action={
                <Link
                    href="/marketplace"
                    className="flex items-center justify-center px-8 py-3.5 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl hover:from-emerald-700 hover:to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 transition-all w-full sm:w-auto hover:scale-105 active:scale-95"
                >
                    {t('empty.noOrders.action')}
                </Link>
            }
        />
    );
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
    const { t } = useTranslation();
    return (
        <EmptyState
            icon={<SearchX className="w-12 h-12 text-amber-500" strokeWidth={1.5} />}
            title={t('empty.noResults.title')}
            description={t('empty.noResults.desc').replace('{query}', query)}
        />
    );
}

export function NoLibraryEmpty() {
    const { t } = useTranslation();
    return (
        <EmptyState
            icon={<LibrarySquare className="w-12 h-12 text-blue-500" strokeWidth={1.5} />}
            title={t('empty.noLibrary.title')}
            description={t('empty.noLibrary.desc')}
            action={
                <Link
                    href="/marketplace"
                    className="flex items-center justify-center px-8 py-3.5 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all w-full sm:w-auto hover:scale-105 active:scale-95"
                >
                    {t('empty.noLibrary.action')}
                </Link>
            }
        />
    );
}

export function NoRecordsEmpty() {
    const { t } = useTranslation();
    return (
        <EmptyState
            icon={<FileText className="w-12 h-12 text-pink-500" strokeWidth={1.5} />}
            title={t('empty.noRecords.title')}
            description={t('empty.noRecords.desc')}
            action={
                <Link
                    href="/services"
                    className="flex items-center justify-center px-8 py-3.5 bg-gradient-to-br from-pink-600 to-pink-500 text-white font-bold rounded-2xl hover:from-pink-700 hover:to-pink-600 hover:shadow-lg hover:shadow-pink-500/25 transition-all w-full sm:w-auto hover:scale-105 active:scale-95"
                >
                    {t('empty.noRecords.action')}
                </Link>
            }
        />
    );
}

export function NoNotificationsEmpty() {
    const { t } = useTranslation();
    return (
        <EmptyState
            icon={<BellRing className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
            title={t('empty.noNotifications.title')}
            description={t('empty.noNotifications.desc')}
        />
    );
}

export function ErrorState({ 
    message,
    onRetry 
}: { 
    message?: string;
    onRetry?: () => void;
}) {
    const { t } = useTranslation();
    return (
        <EmptyState
            icon={<AlertTriangle className="w-12 h-12 text-red-500" strokeWidth={1.5} />}
            title={t('empty.error.title')}
            description={message || t('empty.error.defaultMessage')}
            action={onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center justify-center px-8 py-3.5 bg-gradient-to-br from-red-600 to-red-500 text-white font-bold rounded-2xl hover:from-red-700 hover:to-red-600 hover:shadow-lg hover:shadow-red-500/25 transition-all w-full sm:w-auto hover:scale-105 active:scale-95 cursor-pointer"
                >
                    {t('empty.error.action')}
                </button>
            )}
        />
    );
}

export default EmptyState;
