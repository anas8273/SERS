'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/utils';

interface TopNavBarProps {
    title?: string;
    showBack?: boolean;
    backHref?: string;
}

/**
 * Sub-page Navigation Bar — Smart & Dynamic:
 * - Shows when user scrolls UP (returning to top)
 * - Hides when user scrolls DOWN (reading content)
 * - Always visible at the very top (scrollY < 80)
 * - Smooth transitions with GPU compositing
 * - RTL/LTR aware arrow direction
 * - Icon-only on xs, icon+label on sm+
 * - Uses transform for hiding instead of display:none (better perf)
 */
export function TopNavBar({ title, showBack = true, backHref }: TopNavBarProps) {
    const router = useRouter();
    const { dir } = useTranslation();
    const [hidden, setHidden] = useState(false);
    const lastScrollYRef = useRef(0);

    const handleBack = () => {
        if (backHref) {
            router.push(backHref);
        } else {
            router.back();
        }
    };

    // Smart scroll detection: hide on scroll down, show on scroll up
    const handleScroll = useCallback(() => {
        const currentY = window.scrollY;

        // Always show when near top of page
        if (currentY < 80) {
            setHidden(false);
            lastScrollYRef.current = currentY;
            return;
        }

        // Scrolling down → hide (threshold: 8px to avoid jitter)
        if (currentY > lastScrollYRef.current + 8) {
            setHidden(true);
        }
        // Scrolling up → show (threshold: 5px)
        else if (currentY < lastScrollYRef.current - 5) {
            setHidden(false);
        }

        lastScrollYRef.current = currentY;
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

    return (
        <div
            className={cn(
                "sticky z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300"
            )}
            dir={dir}
            style={{
                top: '4rem', /* matches navbar h-16 */
                transform: hidden ? 'translateY(-100%) translateZ(0)' : 'translateY(0) translateZ(0)',
                WebkitTransform: hidden ? 'translateY(-100%) translateZ(0)' : 'translateY(0) translateZ(0)',
            }}
        >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="h-12 flex items-center justify-between gap-2">

                    {/* Back button + Title */}
                    <div className="flex items-center gap-2 min-w-0">
                        {showBack && (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                                aria-label="رجوع"
                            >
                                <BackIcon className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm font-medium">
                                    {dir === 'rtl' ? 'رجوع' : 'Back'}
                                </span>
                            </button>
                        )}
                        {title && (
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {title}
                            </h2>
                        )}
                    </div>

                    {/* Dashboard link — icon on xs, icon+text on sm+ */}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1.5 shrink-0 px-2 sm:px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors text-xs font-bold"
                    >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                            {dir === 'rtl' ? 'لوحة التحكم' : 'Dashboard'}
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
