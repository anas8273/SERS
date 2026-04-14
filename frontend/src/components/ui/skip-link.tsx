'use client';
import { ta } from '@/i18n/auto-translations';

/**
 * SkipLink — WCAG 2.1 Skip Navigation Component
 *
 * [F-03] Invisible link that appears on keyboard Tab press,
 * letting screen reader users skip the navigation menu and
 * jump directly to the main content (#main-content).
 *
 * Usage: Place <SkipLink /> as the first child of <body>.
 */
export default function SkipLink() {
    return (
        <a
            href="#main-content"
            className="
                sr-only focus:not-sr-only
                fixed top-2 left-2 z-[9999]
                bg-primary text-white
                px-4 py-2 rounded-lg
                text-sm font-bold
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                transition-all
            "
        >
            {ta('تخطي إلى المحتوى الرئيسي', 'Skip to main content')}
        </a>
    );
}
