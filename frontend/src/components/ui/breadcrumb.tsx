'use client';
import { ta } from '@/i18n/auto-translations';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Map of path segments to Arabic labels */
const SEGMENT_LABELS: Record<string, string> = {
  marketplace: 'متجر القوالب',
  services: 'الخدمات التعليمية',
  about: 'من نحن',
  contact: 'تواصل معنا',
  cart: 'سلة المشتريات',
  checkout: 'الدفع',
  faq: 'الأسئلة الشائعة',
  dashboard: 'لوحة التحكم',
  settings: 'الإعدادات',
  orders: 'مشترياتي',
  wishlist: 'المفضلة',
  notifications: 'الإشعارات',
  analyses: 'تحليل النتائج',
  certificates: 'الشهادات',
  plans: 'الخطط التعليمية',
  achievements: 'الإنجازات',
  portfolio: 'ملف الإنجاز',
  'ai-assistant': 'المساعد الذكي',
  'my-templates': 'سجلاتي',
  'my-library': 'مشترياتي',
  'work-evidence': 'شواهد الأداء',
  'follow-up-log': 'سجل المتابعة',
  'knowledge-production': 'الإنتاج المعرفي',
  distributions: 'التوزيعات',
  tests: 'الاختبارات',
  'batch-generate': 'إنشاء جماعي',
  'order-success': 'تأكيد الطلب',
  admin: 'الإدارة',
  templates: 'القوالب',
  categories: 'التصنيفات',
  sections: 'الأقسام',
  coupons: 'الخصومات',
  users: 'المستخدمون',
  reports: 'التقارير',
  reviews: 'التقييمات',
  'activity-logs': 'سجل النشاطات',
  'ai-management': 'الذكاء الاصطناعي',
  privacy: 'الخصوصية',
  terms: 'الشروط',
};

interface BreadcrumbProps {
  className?: string;
  /** Override labels for dynamic segments like [id] */
  overrideLabels?: Record<string, string>;
}

export function Breadcrumbs({ className, overrideLabels }: BreadcrumbProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label =
      overrideLabels?.[segment] ||
      SEGMENT_LABELS[segment] ||
      decodeURIComponent(segment);
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="breadcrumb" className={cn('flex items-center gap-1.5 text-sm', className)}>
      <Link
        href="/"
        className="flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronLeft className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
          {crumb.isLast ? (
            <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-gray-400 dark:text-gray-500 hover:text-primary transition-colors truncate max-w-[150px]"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Simple breadcrumb for dashboard pages — backwards compatible with existing usage.
 * Usage: <PageBreadcrumb pageName="الإعدادات" />
 */
export function PageBreadcrumb({ pageName, parentName, parentHref }: { pageName: string; parentName?: string; parentHref?: string }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>{ta('الرئيسية', 'Home')}</span>
      </Link>
      {parentName && parentHref && (
        <>
          <ChevronLeft className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
          <Link
            href={parentHref}
            className="text-gray-400 dark:text-gray-500 hover:text-primary transition-colors"
          >
            {parentName}
          </Link>
        </>
      )}
      <ChevronLeft className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
      <span className="font-bold text-gray-900 dark:text-white">
        {pageName}
      </span>
    </nav>
  );
}

