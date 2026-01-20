'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchResult {
    id: string;
    type: 'user' | 'product' | 'order';
    title: string;
    subtitle: string;
    icon: string;
    href: string;
}

/**
 * GlobalSearch Component
 * 
 * A unified search bar that searches across Users, Products, and Orders
 * with keyboard navigation and real-time results.
 */
export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Debounced search
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            // Search users and products in parallel
            const [usersRes, productsRes] = await Promise.allSettled([
                api.getAdminUsers(1, searchQuery),
                api.getAdminProducts({ search: searchQuery }),
            ]);

            const combined: SearchResult[] = [];

            // Process users
            if (usersRes.status === 'fulfilled' && usersRes.value.data) {
                usersRes.value.data.slice(0, 4).forEach((user: any) => {
                    combined.push({
                        id: user.id,
                        type: 'user',
                        title: user.name,
                        subtitle: user.email,
                        icon: '👤',
                        href: `/admin/users?highlight=${user.id}`,
                    });
                });
            }

            // Process products
            if (productsRes.status === 'fulfilled' && productsRes.value.data) {
                productsRes.value.data.slice(0, 4).forEach((product: any) => {
                    combined.push({
                        id: product.id,
                        type: 'product',
                        title: product.name_ar,
                        subtitle: product.category?.name_ar || 'بدون تصنيف',
                        icon: '📋',
                        href: `/admin/templates/${product.id}/edit`,
                    });
                });
            }

            setResults(combined);
            setSelectedIndex(-1);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [query, performSearch]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            const selected = results[selectedIndex];
            if (selected) {
                router.push(selected.href);
                handleClose();
            }
        } else if (e.key === 'Escape') {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery('');
        setResults([]);
        setSelectedIndex(-1);
    };

    const handleOpen = () => {
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    // Keyboard shortcut (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) {
                    handleClose();
                } else {
                    handleOpen();
                }
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen]);

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'user': return 'مستخدم';
            case 'product': return 'منتج';
            case 'order': return 'طلب';
            default: return type;
        }
    };

    const getTypeBgColor = (type: string) => {
        switch (type) {
            case 'user': return 'bg-purple-100 text-purple-700';
            case 'product': return 'bg-blue-100 text-blue-700';
            case 'order': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <>
            {/* Search Button */}
            <button
                onClick={handleOpen}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                <MagnifyingGlassIcon className="w-4 h-4" />
                <span className="hidden sm:inline">بحث...</span>
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-xs bg-white dark:bg-gray-900 border dark:border-gray-700 rounded text-gray-500 dark:text-gray-400">
                    ⌘K
                </kbd>
            </button>

            {/* Search Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm">
                    <div
                        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden border dark:border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-800">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="ابحث عن المستخدمين، المنتجات، أو الطلبات..."
                                className="flex-1 text-lg outline-none placeholder:text-gray-400 bg-transparent text-gray-900 dark:text-white"
                                dir="rtl"
                            />
                            {isLoading && (
                                <div className="animate-spin text-gray-400">⏳</div>
                            )}
                            <button
                                onClick={handleClose}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-80 overflow-y-auto">
                            {results.length === 0 && query && !isLoading && (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <span className="text-3xl mb-2 block">🔍</span>
                                    لم يتم العثور على نتائج لـ "{query}"
                                </div>
                            )}

                            {results.length === 0 && !query && (
                                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                    <p className="text-sm">ابدأ بكتابة للبحث في:</p>
                                    <div className="flex justify-center gap-4 mt-3">
                                        <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-xs">👤 المستخدمين</span>
                                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">📦 المنتجات</span>
                                        <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-xs">🛒 الطلبات</span>
                                    </div>
                                </div>
                            )}

                            {results.map((result, index) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => {
                                        router.push(result.href);
                                        handleClose();
                                    }}
                                    className={`w-full flex items-center gap-4 px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedIndex === index ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                        }`}
                                >
                                    <span className="text-2xl">{result.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                            {result.title}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {result.subtitle}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBgColor(result.type)}`}>
                                        {getTypeLabel(result.type)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-4">
                            <span>↑↓ للتنقل</span>
                            <span>↵ للفتح</span>
                            <span>Esc للإغلاق</span>
                        </div>
                    </div>

                    {/* Backdrop click to close */}
                    <div
                        className="absolute inset-0 -z-10"
                        onClick={handleClose}
                    />
                </div>
            )}
        </>
    );
}
