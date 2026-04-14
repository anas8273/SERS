'use client';

import React from 'react';

/**
 * Custom SVG Section Icons — Flat vector style inspired by Freepik & Dribbble
 * Each icon uses a dual-tone design with a primary color and a lighter accent.
 * All icons are inline SVGs for zero external dependencies and full color control.
 */

interface SectionIconProps {
    slug: string;
    className?: string;
    size?: number;
}

const iconMap: Record<string, React.FC<{ size: number; className?: string }>> = {

    // 📁 ملفات الإنجاز — Achievement Portfolios
    'achievement-files': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="16" width="48" height="40" rx="4" fill="#3B82F6" opacity="0.15" />
            <rect x="12" y="12" width="40" height="40" rx="4" fill="#3B82F6" opacity="0.3" />
            <rect x="16" y="8" width="32" height="40" rx="4" fill="#3B82F6" />
            <path d="M24 22h16M24 30h12M24 38h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="44" cy="44" r="12" fill="#F59E0B" />
            <path d="M44 38v6l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40 40l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    // 🏆 شواهد الأداء الوظيفي — Performance Evidence
    'performance-evidence': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <path d="M32 4l6 12 14 2-10 10 2 14-12-6-12 6 2-14L12 18l14-2z" fill="#F59E0B" />
            <circle cx="32" cy="24" r="8" fill="#FBBF24" />
            <rect x="22" y="42" width="20" height="18" rx="3" fill="#3B82F6" />
            <path d="M28 48h8M28 54h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="24" r="4" fill="white" opacity="0.3" />
        </svg>
    ),

    // 📋 السجلات المدرسية — School Records
    'school-records': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="6" width="36" height="52" rx="4" fill="#10B981" />
            <rect x="14" y="14" width="28" height="6" rx="2" fill="white" opacity="0.3" />
            <path d="M18 28h20M18 36h16M18 44h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <rect x="38" y="30" width="20" height="28" rx="3" fill="#059669" />
            <path d="M44 38h8M44 44h6M44 50h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="48" cy="32" r="6" fill="#34D399" />
            <path d="M46 32h4M48 30v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),

    // ✅ الاختبارات — Tests & Exams
    'tests': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="8" width="44" height="48" rx="4" fill="#8B5CF6" />
            <rect x="16" y="16" width="32" height="8" rx="2" fill="white" opacity="0.2" />
            <circle cx="22" cy="32" r="3" fill="#C4B5FD" />
            <path d="M20 32l1.5 1.5 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="30" y="30" width="14" height="4" rx="1" fill="white" opacity="0.3" />
            <circle cx="22" cy="42" r="3" fill="#C4B5FD" />
            <path d="M20 42l1.5 1.5 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="30" y="40" width="14" height="4" rx="1" fill="white" opacity="0.3" />
            <circle cx="22" cy="52" r="3" fill="white" opacity="0.2" />
            <rect x="30" y="50" width="14" height="4" rx="1" fill="white" opacity="0.15" />
        </svg>
    ),

    // 📊 التقارير — Reports
    'reports': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="48" height="48" rx="6" fill="#0EA5E9" opacity="0.15" />
            <rect x="12" y="28" width="8" height="24" rx="2" fill="#0EA5E9" />
            <rect x="24" y="20" width="8" height="32" rx="2" fill="#3B82F6" />
            <rect x="36" y="12" width="8" height="40" rx="2" fill="#6366F1" />
            <rect x="48" y="24" width="8" height="28" rx="2" fill="#8B5CF6" />
            <path d="M14 26L28 18l12 8 12-10" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="14" cy="26" r="3" fill="#F59E0B" />
            <circle cx="28" cy="18" r="3" fill="#F59E0B" />
            <circle cx="40" cy="26" r="3" fill="#F59E0B" />
            <circle cx="52" cy="16" r="3" fill="#F59E0B" />
        </svg>
    ),

    // 💡 المبادرات — Initiatives
    'initiatives': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="28" r="18" fill="#F59E0B" opacity="0.15" />
            <path d="M32 6C22 6 14 14 14 24c0 8 5 14 12 16v6h12v-6c7-2 12-8 12-16 0-10-8-18-18-18z" fill="#F59E0B" />
            <path d="M26 50h12v4a4 4 0 01-4 4h-4a4 4 0 01-4-4v-4z" fill="#D97706" />
            <path d="M26 46h12" stroke="#D97706" strokeWidth="2" />
            <path d="M32 14v6M38 16l-3 5M26 16l3 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="28" r="6" fill="white" opacity="0.3" />
            <path d="M30 28l2 2 4-4" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    // 🎖️ الشهادات — Certificates
    'certificates': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="10" width="52" height="36" rx="4" fill="#EF4444" opacity="0.1" />
            <rect x="8" y="12" width="48" height="32" rx="3" fill="#EF4444" />
            <rect x="12" y="16" width="40" height="24" rx="2" fill="white" opacity="0.15" />
            <path d="M20 24h24M20 30h18M20 36h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="44" cy="46" r="12" fill="#F59E0B" />
            <path d="M44 38l2 4 4.5.5-3 3.5 1 4.5-4.5-2-4.5 2 1-4.5-3-3.5L42 42z" fill="white" />
            <rect x="40" y="52" width="2" height="8" rx="1" fill="#D97706" />
            <rect x="46" y="52" width="2" height="8" rx="1" fill="#D97706" />
        </svg>
    ),

    // 👥 ورش العمل — Workshops & Training
    'workshops-training': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="30" width="48" height="26" rx="4" fill="#6366F1" opacity="0.15" />
            <rect x="12" y="8" width="40" height="28" rx="4" fill="#6366F1" />
            <rect x="16" y="12" width="32" height="20" rx="2" fill="#818CF8" />
            <path d="M24 22h16M28 18h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="46" r="6" fill="#6366F1" />
            <circle cx="20" cy="44" r="3" fill="white" opacity="0.4" />
            <path d="M14 56c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#6366F1" strokeWidth="2" fill="#818CF8" />
            <circle cx="44" cy="46" r="6" fill="#6366F1" />
            <circle cx="44" cy="44" r="3" fill="white" opacity="0.4" />
            <path d="M38 56c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#6366F1" strokeWidth="2" fill="#818CF8" />
            <circle cx="32" cy="44" r="7" fill="#4F46E5" />
            <circle cx="32" cy="42" r="3.5" fill="white" opacity="0.4" />
            <path d="M25 54c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="#4F46E5" strokeWidth="2" fill="#6366F1" />
        </svg>
    ),

    // 🎬 الدروس التطبيقية — Applied Lessons
    'applied-lessons': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="10" width="56" height="36" rx="4" fill="#0EA5E9" />
            <rect x="8" y="14" width="48" height="28" rx="2" fill="#0284C7" />
            <polygon points="28,22 28,38 42,30" fill="white" />
            <rect x="18" y="50" width="28" height="4" rx="2" fill="#0EA5E9" opacity="0.5" />
            <rect x="24" y="54" width="16" height="6" rx="2" fill="#0EA5E9" opacity="0.3" />
            <circle cx="52" cy="18" r="4" fill="#EF4444" />
        </svg>
    ),

    // 🧠 الإنتاج المعرفي — Knowledge Production
    'knowledge-production': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="28" r="22" fill="#EC4899" opacity="0.1" />
            <path d="M32 8C20 8 12 16 12 26c0 6 3 11 8 14l-2 8h28l-2-8c5-3 8-8 8-14 0-10-8-18-20-18z" fill="#EC4899" />
            <path d="M22 26c0-5.5 4.5-10 10-10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <path d="M32 18v8l4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="32" cy="26" r="4" fill="white" opacity="0.3" />
            <rect x="22" y="50" width="20" height="4" rx="2" fill="#DB2777" />
            <rect x="24" y="56" width="16" height="4" rx="2" fill="#BE185D" />
            <circle cx="48" cy="16" r="6" fill="#F59E0B" />
            <path d="M48 12v4M46 14h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),

    // 📈 الخطط العلاجية والإثرائية — Remedial & Enrichment Plans
    'remedial-enrichment': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="48" height="48" rx="6" fill="#10B981" opacity="0.1" />
            <path d="M12 52L24 36l8 8 8-16 12-8" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="36" r="4" fill="#10B981" />
            <circle cx="32" cy="44" r="4" fill="#059669" />
            <circle cx="40" cy="28" r="4" fill="#10B981" />
            <circle cx="52" cy="20" r="4" fill="#059669" />
            <rect x="8" y="14" width="4" height="38" rx="1" fill="#10B981" opacity="0.3" />
            <rect x="8" y="52" width="48" height="4" rx="1" fill="#10B981" opacity="0.3" />
            <path d="M48 14l4-4 4 4" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M52 10v12" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    ),

    // 📅 الخطط — Plans & Distributions
    'plans': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="14" width="48" height="44" rx="4" fill="#6366F1" />
            <rect x="8" y="14" width="48" height="14" rx="4" fill="#4F46E5" />
            <rect x="18" y="8" width="4" height="12" rx="2" fill="#818CF8" />
            <rect x="42" y="8" width="4" height="12" rx="2" fill="#818CF8" />
            <rect x="14" y="34" width="8" height="8" rx="2" fill="white" opacity="0.2" />
            <rect x="26" y="34" width="8" height="8" rx="2" fill="white" opacity="0.2" />
            <rect x="38" y="34" width="8" height="8" rx="2" fill="#F59E0B" />
            <rect x="14" y="46" width="8" height="8" rx="2" fill="white" opacity="0.2" />
            <rect x="26" y="46" width="8" height="8" rx="2" fill="#10B981" />
            <rect x="38" y="46" width="8" height="8" rx="2" fill="white" opacity="0.2" />
            <path d="M40 36l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    // ⚠️ الفاقد التعليمي — Learning Loss
    'learning-loss': ({ size, className }) => (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="26" fill="#F97316" opacity="0.1" />
            <path d="M32 6L4 56h56L32 6z" fill="#F97316" />
            <path d="M32 10L8 54h48L32 10z" fill="#FB923C" />
            <rect x="30" y="24" width="4" height="16" rx="2" fill="white" />
            <circle cx="32" cy="46" r="3" fill="white" />
            <circle cx="50" cy="14" r="8" fill="#10B981" />
            <path d="M47 14l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

/**
 * SectionIcon — renders a custom SVG vector icon for each section
 * Falls back to a generic document icon if the slug isn't found.
 */
export function SectionIcon({ slug, className, size = 40 }: SectionIconProps) {
    const IconComponent = iconMap[slug];

    if (IconComponent) {
        return <IconComponent size={size} className={className} />;
    }

    // Fallback: generic document icon
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="8" width="40" height="48" rx="4" fill="#6B7280" />
            <path d="M20 20h24M20 28h20M20 36h16M20 44h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/**
 * Map of section slugs to their brand colors (for backgrounds)
 */
export const SECTION_COLORS: Record<string, string> = {
    'achievement-files': 'from-blue-500 to-blue-600',
    'performance-evidence': 'from-amber-500 to-yellow-500',
    'school-records': 'from-emerald-500 to-green-600',
    'tests': 'from-violet-500 to-purple-600',
    'reports': 'from-sky-500 to-blue-600',
    'initiatives': 'from-amber-400 to-orange-500',
    'certificates': 'from-red-500 to-rose-600',
    'workshops-training': 'from-indigo-500 to-violet-600',
    'applied-lessons': 'from-cyan-500 to-sky-600',
    'knowledge-production': 'from-pink-500 to-rose-600',
    'remedial-enrichment': 'from-emerald-400 to-teal-600',
    'plans': 'from-indigo-500 to-blue-600',
    'learning-loss': 'from-orange-500 to-amber-600',
};

export default SectionIcon;
