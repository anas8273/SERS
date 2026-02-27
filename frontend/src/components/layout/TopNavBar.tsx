'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopNavBarProps {
    title?: string;
    showBack?: boolean;
    showHome?: boolean;
    backHref?: string;
}

/**
 * Universal Top Navigation Bar with Back & Home buttons.
 * Used on inner pages (editor, analytics, AI assistant, etc.)
 * to ensure users never get "trapped" on a page.
 */
export function TopNavBar({ title, showBack = true, showHome = true, backHref }: TopNavBarProps) {
    const router = useRouter();

    const handleBack = () => {
        if (backHref) {
            router.push(backHref);
        } else {
            router.back();
        }
    };

    return (
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-14 flex items-center justify-between gap-4">
                    {/* Right side: Back + Title */}
                    <div className="flex items-center gap-3">
                        {showBack && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBack}
                                className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"
                            >
                                <ArrowRight className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm font-medium">رجوع</span>
                            </Button>
                        )}
                        {title && (
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
                                {title}
                            </h2>
                        )}
                    </div>

                    {/* Left side: Home */}
                    <div className="flex items-center gap-2">
                        {showHome && (
                            <Link href="/">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"
                                >
                                    <Home className="w-4 h-4" />
                                    <span className="hidden sm:inline text-sm font-medium">الرئيسية</span>
                                </Button>
                            </Link>
                        )}
                        <Link href="/dashboard">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 rounded-full text-xs font-bold border-primary/20 text-primary hover:bg-primary/5"
                            >
                                لوحة التحكم
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
