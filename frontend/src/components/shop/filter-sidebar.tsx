'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import { api } from '@/lib/api';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

export function FilterSidebar() {
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.getCategories();
                if (response.success) {
                    setCategories(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return (
        <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
            {/* Categories Section */}
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 flex-row-reverse">
                    <Icons.LayoutGrid className="w-4 h-4" />
                    التصنيفات
                </h3>
                <nav className="space-y-2">
                    <Link
                        href="/marketplace"
                        className={cn(
                            "flex items-center justify-between p-2 rounded-lg text-sm transition-colors flex-row-reverse",
                            !currentCategory 
                                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        )}
                    >
                        <span className="flex items-center gap-2 flex-row-reverse">
                            <Icons.Layers className="w-4 h-4" />
                            الكل
                        </span>
                    </Link>

                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-9 bg-gray-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
                        ))
                    ) : (
                        categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/marketplace?category=${category.slug}`}
                                className={cn(
                                    "flex items-center justify-between p-2 rounded-lg text-sm transition-colors group flex-row-reverse",
                                    currentCategory === category.slug
                                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                )}
                            >
                                <span className="flex items-center gap-2 flex-row-reverse">
                                    <Icons.Circle className="w-3 h-3 group-hover:text-primary-500 transition-colors" />
                                    {category.name_ar}
                                </span>
                            </Link>
                        ))
                    )}
                </nav>
            </div>

            {/* Price Range Section (UI Only) */}
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 flex-row-reverse">
                    <Icons.Tag className="w-4 h-4" />
                    نطاق السعر
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 flex-row-reverse">
                        <span>0 ر.س</span>
                        <span>500+ ر.س</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="500"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-primary-600"
                    />
                    <div className="flex gap-2">
                        <div className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-center">
                            0 ر.س
                        </div>
                        <div className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-center">
                            500+ ر.س
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
