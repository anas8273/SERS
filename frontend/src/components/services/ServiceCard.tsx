'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    color: string;
    features?: string[];
    badge?: string;
    isNew?: boolean;
    isAI?: boolean;
}

export function ServiceCard({
    title,
    description,
    icon: Icon,
    href,
    color,
    features = [],
    badge,
    isNew = false,
    isAI = false,
}: ServiceCardProps) {
    return (
        <Link
            href={href}
            className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex flex-col h-full overflow-hidden"
        >
            {/* Background Gradient on Hover */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                color
            )} />

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
                {isNew && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded-full">
                        جديد
                    </span>
                )}
                {isAI && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        ذكاء اصطناعي
                    </span>
                )}
                {badge && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                        {badge}
                    </span>
                )}
            </div>

            {/* Icon */}
            <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110",
                color
            )}>
                <Icon className="w-7 h-7" />
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1">
                {description}
            </p>

            {/* Features */}
            {features.length > 0 && (
                <ul className="space-y-2 mb-4">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                        </li>
                    ))}
                </ul>
            )}

            {/* Arrow */}
            <div className="flex items-center text-primary font-bold text-sm mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                <span>استخدم الخدمة</span>
                <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </div>
        </Link>
    );
}

export function ServiceCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-700 mb-4" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
    );
}
