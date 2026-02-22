'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';
import GlobalSearch from '@/components/admin/GlobalSearch';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

const sidebarItems = [
    { label: 'لوحة التحكم', href: '/admin', icon: '📊', group: 'main' },
    { label: 'القوالب', href: '/admin/templates', icon: '📋', group: 'main' },
    { label: 'التصنيفات', href: '/admin/categories', icon: '🗂️', group: 'main' },
    { label: 'المستخدمون', href: '/admin/users', icon: '👥', group: 'main' },
    { label: 'الطلبات', href: '/admin/orders', icon: '🛒', group: 'main' },
    { label: 'أكواد الخصم', href: '/admin/coupons', icon: '🎟️', group: 'main' },
    { label: 'التقييمات', href: '/admin/reviews', icon: '⭐', group: 'main' },
    { label: 'الخدمات التعليمية', href: '/admin/services', icon: '🎓', group: 'services' },
    { label: 'التحليلات', href: '/admin/analyses', icon: '📈', group: 'services' },
    { label: 'الشهادات', href: '/admin/certificates', icon: '🏆', group: 'services' },
    { label: 'الخطط التعليمية', href: '/admin/plans', icon: '📝', group: 'services' },
    { label: 'التقارير', href: '/admin/reports', icon: '📑', group: 'services' },
    { label: 'الذكاء الاصطناعي', href: '/admin/ai-management', icon: '🤖', group: 'system' },
    { label: 'سجل النشاطات', href: '/admin/activity-logs', icon: '📋', group: 'system' },
    { label: 'الإعدادات', href: '/admin/settings', icon: '⚙️', group: 'system' },
];

// Dynamic page titles based on route
const pageTitles: Record<string, string> = {
    '/admin': 'لوحة التحكم',
    '/admin/templates': 'إدارة القوالب',
    '/admin/categories': 'إدارة التصنيفات',
    '/admin/users': 'إدارة المستخدمين',
    '/admin/coupons': 'إدارة أكواد الخصم',
    '/admin/orders': 'إدارة الطلبات',
    '/admin/reviews': 'إدارة التقييمات',
    '/admin/services': 'إدارة الخدمات التعليمية',
    '/admin/analyses': 'إدارة التحليلات',
    '/admin/certificates': 'إدارة الشهادات',
    '/admin/plans': 'إدارة الخطط التعليمية',
    '/admin/reports': 'التقارير',
    '/admin/ai-management': 'إدارة الذكاء الاصطناعي',
    '/admin/activity-logs': 'سجل النشاطات',
    '/admin/settings': 'إعدادات النظام',
};

/**
 * Admin Layout
 * 
 * Layout with sidebar navigation for admin pages
 */
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Get the current page title dynamically
    const getCurrentTitle = () => {
        // Check for exact match first
        if (pageTitles[pathname]) {
            return pageTitles[pathname];
        }
        // Check for partial matches (for nested routes like /admin/templates/create)
        for (const [path, title] of Object.entries(pageTitles)) {
            if (path !== '/admin' && pathname.startsWith(path)) {
                return title;
            }
        }
        return 'لوحة الإدارة';
    };

    const currentTitle = getCurrentTitle();

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
                {/* Admin Header */}
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center gap-4">
                                <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-2">
                                    <span>📚</span>
                                    <span>SERS</span>
                                </Link>
                                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded">
                                    {currentTitle}
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Global Search */}
                                <GlobalSearch />

                                <Link
                                    href="/"
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm flex items-center gap-1"
                                >
                                    ← العودة للموقع
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex">
                    {/* Sidebar */}
                    <aside className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 min-h-[calc(100vh-64px)] sticky top-16 hidden lg:block overflow-y-auto">
                        <nav className="p-4 space-y-1">
                            {/* Main Group */}
                            {sidebarItems.filter(i => i.group === 'main').map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/admin' && pathname.startsWith(item.href));
                                return (
                                    <Link key={item.href} href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
                                        )}>
                                        <span className="text-lg">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}

                            {/* Services Group */}
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="px-4 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">الخدمات التعليمية</p>
                            </div>
                            {sidebarItems.filter(i => i.group === 'services').map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/admin' && pathname.startsWith(item.href));
                                return (
                                    <Link key={item.href} href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
                                        )}>
                                        <span className="text-lg">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}

                            {/* System Group */}
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="px-4 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">النظام</p>
                            </div>
                            {sidebarItems.filter(i => i.group === 'system').map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/admin' && pathname.startsWith(item.href));
                                return (
                                    <Link key={item.href} href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
                                        )}>
                                        <span className="text-lg">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Quick Stats */}
                        <div className="p-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
                                <h4 className="font-semibold mb-1">مساعدة سريعة</h4>
                                <p className="text-xs text-white/80 mb-3">
                                    استخدم Ctrl+K للبحث السريع في النظام
                                </p>
                                <Link
                                    href="/admin/templates/create"
                                    className="inline-block bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                >
                                    ➕ إضافة قالب
                                </Link>
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Navigation */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 overflow-x-auto">
                        <div className="flex">
                            {sidebarItems.slice(0, 5).map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/admin' && pathname.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                                            isActive
                                                ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
                                                : "text-gray-500 dark:text-gray-400"
                                        )}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content with Error Boundary */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </main>
                </div>
            </div>
        </AdminGuard>
    );
}

