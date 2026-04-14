'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';
import GlobalSearch from '@/components/admin/GlobalSearch';
import { GlobalAIAssistant } from '@/components/admin/GlobalAIAssistant';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcherCompact } from '@/components/language/LanguageSwitcher';
import { PageTransition } from '@/components/ui/page-transition';
import { AutoTranslateProvider } from '@/components/admin/AutoTranslateProvider';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import type { TranslationKey } from '@/i18n/translations';
import {
    LayoutDashboard,
    FileText,
    FolderTree,
    GraduationCap,
    Users,
    ShoppingCart,
    ShoppingBag,
    Ticket,
    Star,
    BarChart3,
    Bot,
    Activity,
    Settings,
    ChevronRight,
    Sparkles,
    Menu,
    X,
    Layers,
    ExternalLink,
    Globe,
    ArrowDownToLine,
    Mail,
    BookOpen,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarItem {
    labelKey: TranslationKey;
    href: string;
    icon: LucideIcon;
    group: 'dashboard' | 'store' | 'services' | 'tools' | 'system';
    badge?: string;
    siteLink?: string;
}

const sidebarItems: SidebarItem[] = [
    { labelKey: 'admin.dashboard',          href: '/admin',                          icon: LayoutDashboard, group: 'dashboard' },
    { labelKey: 'admin.templates',           href: '/admin/templates',                icon: FileText,        group: 'store',    siteLink: '/marketplace' },
    { labelKey: 'admin.sections',            href: '/admin/sections',                 icon: Layers,          group: 'store' },
    { labelKey: 'admin.categories',          href: '/admin/categories',               icon: FolderTree,      group: 'store' },
    { labelKey: 'admin.orders',              href: '/admin/orders',                   icon: ShoppingCart,    group: 'store' },
    { labelKey: 'admin.withdrawals',         href: '/admin/withdrawals',              icon: ArrowDownToLine, group: 'store' },
    { labelKey: 'admin.coupons',             href: '/admin/coupons',                  icon: Ticket,          group: 'store' },
    // [AUDIT-FIX] Removed duplicate /admin/analyses entry — analyses data is accessible
    // within /admin/educational-services under the "Analysis & Tests" group
    { labelKey: 'admin.educationalServices', href: '/admin/educational-services',     icon: BookOpen,        group: 'services', siteLink: '/services' },
    { labelKey: 'admin.reviews',             href: '/admin/reviews',                  icon: Star,            group: 'services' },
    { labelKey: 'admin.users',               href: '/admin/users',                    icon: Users,           group: 'tools' },
    { labelKey: 'admin.reports',             href: '/admin/reports',                  icon: BarChart3,       group: 'tools' },
    { labelKey: 'admin.aiManagement',        href: '/admin/ai-management',            icon: Bot,             group: 'tools',  badge: 'AI' },
    { labelKey: 'admin.activityLogs',        href: '/admin/activity-logs',            icon: Activity,        group: 'system' },
    { labelKey: 'admin.customRequests',      href: '/admin/custom-requests',          icon: ShoppingBag,     group: 'system' },
    { labelKey: 'admin.contactMessages',     href: '/admin/contact-messages',         icon: Mail,            group: 'system' },
    { labelKey: 'admin.settings',            href: '/admin/settings',                 icon: Settings,        group: 'system' },
];

interface GroupConfig {
    labelKey: TranslationKey;
    icon: LucideIcon;
    color: string;
}

const groupConfigs: Record<string, GroupConfig> = {
    store:    { labelKey: 'admin.group.store',    icon: ShoppingBag,   color: 'text-blue-500' },
    services: { labelKey: 'admin.group.services', icon: GraduationCap, color: 'text-purple-500' },
    tools:    { labelKey: 'admin.group.tools',    icon: BarChart3,     color: 'text-amber-500' },
    system:   { labelKey: 'admin.group.system',   icon: Settings,      color: 'text-gray-400' },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { dir, t } = useTranslation();

    const renderSidebarGroup = (group: 'dashboard' | 'store' | 'services' | 'tools' | 'system') => {
        const items = sidebarItems.filter(i => i.group === group);
        const config = groupConfigs[group];

        return (
            <div key={group}>
                {config ? (
                    <div className={group === 'store' ? 'pt-4 mt-2' : 'pt-4 mt-3 border-t border-gray-100 dark:border-gray-700/50'}>
                        <div className="flex items-center gap-2 px-4 py-2">
                            <config.icon className={cn("w-3.5 h-3.5", config.color)} />
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">
                                {t(config.labelKey)}
                            </p>
                        </div>
                    </div>
                ) : null}
                <div className="space-y-0.5">
                    {items.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <div key={item.href} className="relative group/item">
                                <Link
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-gradient-to-l from-primary/10 to-primary/5 text-primary font-bold"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-l-full" />
                                    )}
                                    <Icon className={cn("w-[18px] h-[18px] shrink-0 transition-colors", isActive ? "text-primary" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
                                    <span className="flex-1">{t(item.labelKey)}</span>
                                    {item.badge && (
                                        <span className="px-1.5 py-0.5 text-[9px] font-black bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md uppercase">
                                            {item.badge}
                                        </span>
                                    )}
                                    {isActive && (
                                        <ChevronRight className="w-3.5 h-3.5 text-primary/50" />
                                    )}
                                </Link>
                                {item.siteLink && (
                                    <Link
                                        href={item.siteLink}
                                        target="_blank"
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity text-gray-400 hover:text-primary hover:bg-primary/10"
                                        title={t('admin.viewInSite')}
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-background transition-colors duration-300" dir={dir}>
                {/* Header — Ultra Premium Glassmorphic */}
                <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50 shadow-sm transition-all duration-300">
                    <div className="h-0.5 bg-gradient-to-l from-violet-500 via-purple-500 to-fuchsia-500" />
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-14">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </button>

                                <Link href="/admin" className="flex items-center gap-2 group">
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-lg font-black text-gray-900 dark:text-white hidden sm:block">SERS</span>
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 hidden sm:block">Admin</span>
                                </Link>
                            </div>

                            <div className="flex items-center gap-2">
                                <GlobalSearch />
                                <LanguageSwitcherCompact />
                                <ThemeToggle />

                                <Link
                                    href="/"
                                    target="_blank"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{t('admin.viewSite')}</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex">
                    {/* Desktop Sidebar */}
                    <aside className="w-64 bg-card border-l border-border min-h-[calc(100vh-57px)] sticky top-[57px] hidden lg:flex flex-col">
                        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
                            {renderSidebarGroup('dashboard')}
                            {renderSidebarGroup('store')}
                            {renderSidebarGroup('services')}
                            {renderSidebarGroup('tools')}
                            {renderSidebarGroup('system')}
                        </nav>

                        {/* Version footer */}
                        <div className="p-4 border-t border-border">
                            <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
                                <span className="font-bold">SERS Platform</span>
                                <span>v2.0</span>
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Sidebar Overlay */}
                    {mobileMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                                onClick={() => setMobileMenuOpen(false)}
                            />
                            <aside className="fixed top-[57px] right-0 bottom-0 w-72 bg-card border-l border-border z-50 lg:hidden overflow-y-auto animate-fade-in">
                                <nav className="p-3 space-y-0.5">
                                    {renderSidebarGroup('dashboard')}
                                    {renderSidebarGroup('store')}
                                    {renderSidebarGroup('services')}
                                    {renderSidebarGroup('tools')}
                                    {renderSidebarGroup('system')}
                                </nav>
                            </aside>
                        </>
                    )}

                    {/* Main Content — overflow-x: clip (NOT hidden) to avoid stacking context breaking fixed/sticky */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-57px)]" style={{ overflowX: 'clip' }}>
                        {/* Inline Smart Insights Banner */}
                        <GlobalAIAssistant />

                        <ErrorBoundary>
                            <AutoTranslateProvider>
                                <PageTransition>
                                    {children}
                                </PageTransition>
                            </AutoTranslateProvider>
                        </ErrorBoundary>
                    </main>
                </div>
            </div>
        </AdminGuard>
    );
}
