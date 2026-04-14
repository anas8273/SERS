'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardStatSkeleton } from '@/components/ui/skeletons';
import { formatPrice, cn } from '@/lib/utils';
import { useAdminAI } from '@/hooks/useAdminAI';
import {
    DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
    Plus, Eye, Clock, CheckCircle2, XCircle, RotateCcw,
    ArrowUpRight, ArrowDownRight, BarChart3, FileText,
    Sparkles, Zap, Calendar, CreditCard, Star,
    FolderOpen, Tag, Settings, Activity, Gift,
    ChevronLeft, ExternalLink, Loader2, BookOpen,
    Bot, Send, Lightbulb, X as XIcon, MessageSquare,
} from 'lucide-react';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
    total_revenue: number;
    total_orders: number;
    total_users: number;
    total_templates: number;
    monthly_revenue: number;
    revenue_trend: number;
    new_users_this_month: number;
    today_orders: number;
    today_revenue: number;
    orders_by_status: {
        pending: number;
        completed: number;
        cancelled: number;
        refunded: number;
    };
    recent_orders: Array<{
        id: string;
        user_name: string;
        total: number;
        status: string;
        items_count: number;
        time_ago: string;
    }>;
    top_templates: Array<{
        id: string;
        name_ar: string;
        thumbnail_url: string | null;
        sales_count: number;
        revenue: number;
    }>;
}

interface ChartData {
    date: string;
    day: string;
    revenue: number;
}

export default function AdminDashboardPage() {
    const { dir, t } = useTranslation();
    const [stats, setStats] = useState<DashboardStats | null>(null);

    // Quick action cards for admin
    const QUICK_ACTIONS = [
        { label: t('admin.addTemplate'), href: '/admin/templates/create', icon: Plus, color: 'from-blue-500 to-indigo-600', desc: t('admin.action.addTemplateDesc') || ta('قالب جديد للمتجر', 'New Store Template') },
        { label: t('admin.orders'), href: '/admin/orders', icon: ShoppingCart, color: 'from-emerald-500 to-green-600', desc: t('admin.action.ordersDesc') || ta('عرض ومعالجة الطلبات', 'View & Process Orders') },
        { label: t('admin.users'), href: '/admin/users', icon: Users, color: 'from-violet-500 to-purple-600', desc: t('admin.action.usersDesc') || ta('إدارة الحسابات', 'Account Management') },
        { label: t('admin.reports'), href: '/admin/reports', icon: BarChart3, color: 'from-amber-500 to-orange-600', desc: t('admin.action.reportsDesc') || ta('تقارير الأداء', 'Performance Reports') },
        { label: t('admin.educationalServices'), href: '/admin/educational-services', icon: BookOpen, color: 'from-violet-600 to-purple-700', desc: ta('إدارة الخدمات التعليمية', 'Educational Services Management') },
        { label: t('admin.categories'), href: '/admin/categories', icon: Tag, color: 'from-rose-500 to-pink-600', desc: ta('فئات النظام', 'System Categories') },
        { label: t('admin.sections'), href: '/admin/sections', icon: FolderOpen, color: 'from-sky-500 to-blue-600', desc: ta('أقسام النظام', 'System Sections') },
        { label: t('admin.settings'), href: '/admin/settings', icon: Settings, color: 'from-gray-500 to-slate-600', desc: t('admin.action.settingsDesc') || ta('إعدادات النظام', 'System Settings') },
    ];
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Admin AI Agent state
    const [aiInput, setAiInput] = useState('');
    const [chatOpen, setChatOpen] = useState(false);
    const aiInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, chartRes] = await Promise.all([
                    api.getAdminStats({ _silentError: true } as any),
                    api.getAdminChart({ _silentError: true } as any),
                ]);
                if (statsRes.success) setStats(statsRes.data);
                if (chartRes.success && Array.isArray(chartRes.data)) setChartData(chartRes.data);
            } catch {
                // Stats will remain null → skeleton/empty UI shown gracefully
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const safeChartData = Array.isArray(chartData) ? chartData : [];
    // [AUDIT-FIX] Removed dead maxRevenue variable that was computed but never used
    const trendPositive = (stats?.revenue_trend || 0) >= 0;

    // Admin AI Agent
    const adminAI = useAdminAI(stats as any);

    const orderStatusItems = [
        { key: 'pending',   label: t('orders.status.pending'),   icon: Clock,        color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',   ring: 'ring-amber-200 dark:ring-amber-800' },
        { key: 'completed', label: t('orders.status.completed'), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-emerald-200 dark:ring-emerald-800' },
        { key: 'cancelled', label: t('orders.status.cancelled'), icon: XCircle,      color: 'text-red-600 dark:text-red-400',        bg: 'bg-red-50 dark:bg-red-900/20',       ring: 'ring-red-200 dark:ring-red-800' },
        { key: 'refunded',  label: t('orders.status.refunded'),  icon: RotateCcw,    color: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-900/20',  ring: 'ring-violet-200 dark:ring-violet-800' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">

            {/* ═══ Header ═══ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('admin.dashboard')}</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.reports.salesDesc')}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/marketplace" target="_blank">
                        <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs font-bold">
                            <Eye className="w-3.5 h-3.5" />
                            {t('admin.viewStore')}
                        </Button>
                    </Link>
                    <Link href="/admin/templates/create">
                        <Button size="sm" className="rounded-xl gap-2 text-xs font-bold bg-gradient-to-l from-primary to-purple-600 hover:opacity-90 shadow-lg shadow-primary/20">
                            <Plus className="w-3.5 h-3.5" />
                            {t('admin.addTemplate')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ═══ Stats Grid — 4 Cards ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                {isLoading ? (
                    <>{[1, 2, 3, 4].map(i => <DashboardStatSkeleton key={i} />)}</>
                ) : (
                    <>
                        {/* Revenue */}
                        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 group hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                            <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-x-6 -translate-y-6" />
                            <div className="relative flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{ta('إجمالي الإيرادات', 'Total Revenue')}</p>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">{formatPrice(stats?.total_revenue || 0)}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md",
                                            trendPositive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400")}>
                                            {trendPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {Math.abs(stats?.revenue_trend || 0)}%
                                        </span>
                                        <span className="text-[10px] text-gray-400">{ta('هذا الشهر', 'This Month')}</span>
                                    </div>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Orders */}
                        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 group hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                            <div className="absolute top-0 left-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-x-6 -translate-y-6" />
                            <div className="relative flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{ta('الطلبات المكتملة', 'Completed Orders')}</p>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats?.total_orders || 0}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md">
                                            <Zap className="w-3 h-3" />
                                            {stats?.today_orders || 0} {ta('اليوم', 'Today')}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    <ShoppingCart className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Users */}
                        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 group hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all">
                            <div className="absolute top-0 left-0 w-20 h-20 bg-violet-500/5 rounded-full -translate-x-6 -translate-y-6" />
                            <div className="relative flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{ta('المستخدمون', 'Users')}</p>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats?.total_users || 0}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-1.5 py-0.5 rounded-md">
                                            <TrendingUp className="w-3 h-3" />
                                            +{stats?.new_users_this_month || 0} {ta('جديد', 'new')}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Products */}
                        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 group hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-800 transition-all">
                            <div className="absolute top-0 left-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-x-6 -translate-y-6" />
                            <div className="relative flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{ta('القوالب في المتجر', 'Store Templates')}</p>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats?.total_templates || 0}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md">
                                            <Package className="w-3 h-3" />
                                            {ta('قالب جاهز', 'Ready template')}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ═══ Quick Actions Grid ═══ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h2 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    {ta('إجراءات سريعة', 'Quick Actions')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {QUICK_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link key={action.href} href={action.href}
                                className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all text-center">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform", action.color)}>
                                    <Icon className="w-4.5 h-4.5" />
                                </div>
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">{action.label}</span>
                                <span className="text-[9px] text-gray-400 leading-tight">{action.desc}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* ═══ Charts & Orders Status ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                            {ta('الإيرادات (آخر 7 أيام)', 'Revenue (Last 7 Days)')}
                        </h2>
                        {stats && (
                            <div className="text-start">
                                <p className="text-lg font-black text-gray-900 dark:text-white">{formatPrice(stats.monthly_revenue || 0)}</p>
                                <p className="text-[10px] text-gray-400">{ta('إيرادات الشهر الحالي', 'Current Month Revenue')}</p>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="h-56 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                    ) : (
                        <div className="h-64 mt-4" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={safeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                        formatter={(value: number | undefined) => [formatPrice(value ?? 0), ta('الإيرادات', 'Revenue')]}
                                        labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Order Status */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                    <h2 className="text-sm font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-500" />
                        {ta('حالة الطلبات', 'Order Status')}
                    </h2>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orderStatusItems.map((item) => {
                                const StatusIcon = item.icon;
                                const count = stats?.orders_by_status[item.key as keyof typeof stats.orders_by_status] || 0;
                                return (
                                    <div key={item.key} className={cn("flex items-center justify-between p-3.5 rounded-xl ring-1 transition-all hover:shadow-sm", item.bg, item.ring)}>
                                        <div className="flex items-center gap-3">
                                            <StatusIcon className={cn("w-4.5 h-4.5", item.color)} />
                                            <span className={cn("text-sm font-bold", item.color)}>{item.label}</span>
                                        </div>
                                        <span className={cn("text-lg font-black", item.color)}>{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Recent Orders & Top Products ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Orders */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-500" />
                            {ta('آخر الطلبات', 'Recent Orders')}
                        </h2>
                        <Link href="/admin/orders" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                            {ta('عرض الكل', 'View All')} <ChevronLeft className="w-3 h-3" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="p-5 space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
                    ) : stats?.recent_orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ShoppingCart className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{ta('لا توجد طلبات بعد', 'No orders yet')}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {stats?.recent_orders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm">
                                            {order.user_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{order.user_name}</p>
                                            <p className="text-[10px] text-gray-400">{order.items_count} {ta('قالب', 'template')} • {order.time_ago}</p>
                                        </div>
                                    </div>
                                    <div className="text-start">
                                        <p className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
                                        <p className={cn("text-[10px] font-bold",
                                            order.status === 'completed' ? 'text-emerald-500' :
                                                order.status === 'pending' ? 'text-amber-500' : 'text-gray-400')}>
                                            {order.status === 'completed' ? ta('✓ مكتمل', '✓ Completed') :
                                                order.status === 'pending' ? ta('⏳ قيد الانتظار', '⏳ Pending') :
                                                    order.status === 'cancelled' ? ta('✕ ملغي', '✕ Cancelled') : order.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Products */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            {ta('الأكثر مبيعاً', 'Best Sellers')}
                        </h2>
                        <Link href="/admin/templates" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                            {ta('كل القوالب', 'All Templates')} <ChevronLeft className="w-3 h-3" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="p-5 space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
                    ) : (stats?.top_templates?.length ?? 0) === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Package className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{ta('لا توجد مبيعات بعد', 'No sales yet')}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {stats?.top_templates?.map((product, index) => {
                                const medal = index === 0 ? 'from-amber-400 to-yellow-500' : index === 1 ? 'from-gray-300 to-slate-400' : index === 2 ? 'from-orange-400 to-amber-600' : 'from-gray-200 to-gray-300';
                                return (
                                    <div key={product.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm bg-gradient-to-br", medal)}>
                                                {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[180px] group-hover:text-primary transition-colors">{product.name_ar}</p>
                                                <p className="text-[10px] text-gray-400">{product.sales_count} {ta('مبيعة', 'sold')}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatPrice(product.revenue)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Admin AI Agent Panel ═══ */}
            {!isLoading && stats && (
                <div className="bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950 rounded-2xl border border-violet-800/40 overflow-hidden shadow-xl shadow-violet-900/20">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/40">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-white flex items-center gap-2">
                                    {ta('مستشار SERS الذكي', 'SERS Smart Advisor')}
                                    <span className="text-[9px] font-bold bg-violet-500/30 text-violet-300 px-2 py-0.5 rounded-full">{ta('مرتبط بالبيانات الحقيقية', 'Linked to real data')}</span>
                                </h2>
                                <p className="text-[10px] text-white/40">{ta('تحليلات حية بناءً على إحصائيات المنصة الآن', 'Live analytics based on current platform statistics')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setChatOpen(v => !v); setTimeout(() => aiInputRef.current?.focus(), 200); }}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                chatOpen
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                            )}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {chatOpen ? ta('إغلاق', 'Close') : ta('محادثة', 'Conversation') }
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Dynamic insights from real stats */}
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                <Lightbulb className="w-3 h-3" /> {ta('رؤى مبنية على بياناتك الحقيقية', 'Insights based on your real data')}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {adminAI.insights.map((insight, i) => (
                                    <div key={i} className="bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/5 transition-all cursor-default">
                                        <p className="text-xs text-white/80 leading-relaxed">{insight}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick action prompts */}
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                <Zap className="w-3 h-3" /> {ta('أوامر سريعة', 'Quick Commands')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {adminAI.quickPrompts.map((qp) => (
                                    <button
                                        key={qp.label}
                                        onClick={() => { adminAI.sendQuickPrompt(qp.prompt); setChatOpen(true); }}
                                        disabled={adminAI.isLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white/70 hover:bg-violet-500/30 hover:text-violet-200 border border-white/10 hover:border-violet-500/50 transition-all disabled:opacity-40"
                                    >
                                        {qp.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat interface */}
                        {(chatOpen || adminAI.messages.length > 0) && (
                            <div className="border border-white/10 rounded-xl overflow-hidden">
                                {/* Messages */}
                                <div className="max-h-[280px] overflow-y-auto p-3 space-y-3 bg-black/20">
                                    {adminAI.messages.length === 0 ? (
                                        <p className="text-xs text-white/30 text-center py-6">{ta('اكتب سؤالاً أو استخدم الأوامر أعلاه', 'Type a question or use the commands above')}<br />{ta('مثلاً: «كم عدد الطلبات المعلقة؟»', 'Example: "How many pending orders?"')}</p>
                                    ) : (
                                        adminAI.messages.map(msg => (
                                            <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                                                <div className={cn(
                                                    'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white',
                                                    msg.role === 'user' ? 'bg-violet-500' : 'bg-indigo-500'
                                                )}>
                                                    {msg.role === 'user' ? <Users className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                                </div>
                                                <div className={cn(
                                                    'max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                                                    msg.role === 'user'
                                                        ? 'bg-violet-600 text-white rounded-tr-sm'
                                                        : 'bg-white/10 text-white/90 rounded-tl-sm'
                                                )}>
                                                    {msg.isLoading ? (
                                                        <div className="flex gap-1 items-center py-0.5">
                                                            {[0,1,2].map(i => (
                                                                <div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                                                            ))}
                                                        </div>
                                                    ) : msg.content}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Input row */}
                                <div className="flex items-center gap-2 p-3 border-t border-white/10 bg-black/10">
                                    <input
                                        ref={aiInputRef}
                                        type="text"
                                        value={aiInput}
                                        onChange={e => setAiInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && aiInput.trim() && !adminAI.isLoading) { adminAI.sendMessage(aiInput); setAiInput(''); } }}
                                        placeholder={ta('اسأل عن الإحصائيات أو اطلب تقريراً...', 'Ask about statistics or request a report...')}
                                        dir={dir}
                                        className="flex-1 bg-white/10 text-white placeholder:text-white/30 text-xs rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-violet-500/50"
                                    />
                                    <button
                                        onClick={() => { if (aiInput.trim() && !adminAI.isLoading) { adminAI.sendMessage(aiInput); setAiInput(''); } }}
                                        disabled={!aiInput.trim() || adminAI.isLoading}
                                        className="w-8 h-8 rounded-lg bg-violet-500 hover:bg-violet-400 text-white flex items-center justify-center transition-all disabled:opacity-40"
                                    >
                                        {adminAI.isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    </button>
                                    {adminAI.messages.length > 0 && (
                                        <button onClick={adminAI.clearMessages} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/40 hover:text-white/70 flex items-center justify-center transition-all" title={ta('مسح المحادثة', 'Clear Chat')}>
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ Today Summary Bar ═══ */}
            {!isLoading && stats && (
                <div className="bg-gradient-to-l from-primary/5 via-purple-500/5 to-blue-500/5 rounded-2xl border border-primary/10 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-xs font-black text-gray-900 dark:text-white">{ta('ملخص اليوم', "Today's Summary")}</p>
                                <p className="text-[10px] text-gray-400">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-lg font-black text-primary">{stats.today_orders || 0}</p>
                                <p className="text-[10px] text-gray-400">{ta('طلب', 'orders')}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                            <div className="text-center">
                                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatPrice(stats.today_revenue || 0)}</p>
                                <p className="text-[10px] text-gray-400">{ta('إيرادات', 'Revenue')}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                            <div className="text-center">
                                <p className="text-lg font-black text-violet-600 dark:text-violet-400">+{stats.new_users_this_month || 0}</p>
                                <p className="text-[10px] text-gray-400">{ta('مستخدم جديد', 'New User')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
