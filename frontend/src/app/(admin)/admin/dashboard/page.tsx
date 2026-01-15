'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardStatSkeleton, TableRowSkeleton } from '@/components/ui/skeletons';
import {
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    TrendingUp,
    TrendingDown,
    Calendar,
    ArrowLeft,
    Clock,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    Star,
    BrainCircuit,
    Sparkles,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface DashboardStats {
    total_revenue: number;
    total_orders: number;
    total_users: number;
    total_templates: number;
    monthly_revenue: number;
    revenue_trend: number;
    today_orders: number;
    today_revenue: number;
    new_users_this_month: number;
    ai_insights: {
        predicted_revenue: number;
        growth_status: string;
        recommendation: string;
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
        thumbnail_url: string;
        sales_count: number;
        revenue: number;
    }>;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchStats = async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        try {
            const response = await api.getAdminStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'فشل تحميل الإحصائيات';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(refresh ? false : false);
            if (refresh) {
                setTimeout(() => setIsRefreshing(false), 500);
                toast.success('تم تحديث البيانات بنجاح');
            }
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">حدث خطأ ما</h3>
                    <p className="text-gray-500 dark:text-gray-400">{error}</p>
                </div>
                <Button onClick={() => fetchStats()} variant="outline" className="rounded-full">
                    إعادة المحاولة
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10" dir="rtl">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">لوحة التحكم</h1>
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                            مباشر
                        </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">نظرة شاملة على أداء منصة سيرز التعليمية 2026</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchStats(true)} 
                        disabled={isRefreshing}
                        className="rounded-full border-2 font-bold gap-2"
                    >
                        <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                        تحديث
                    </Button>
                    <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    <>
                        <DashboardStatSkeleton />
                        <DashboardStatSkeleton />
                        <DashboardStatSkeleton />
                        <DashboardStatSkeleton />
                    </>
                ) : stats && (
                    <>
                        <StatCard
                            title="إجمالي الإيرادات"
                            value={formatCurrency(stats.total_revenue)}
                            icon={<DollarSign className="w-6 h-6" />}
                            trend={stats.revenue_trend}
                            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
                            iconColor="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatCard
                            title="الطلبات المكتملة"
                            value={stats.total_orders.toString()}
                            icon={<ShoppingCart className="w-6 h-6" />}
                            subtitle={`${stats.today_orders} طلبات اليوم`}
                            bgColor="bg-blue-50 dark:bg-blue-900/20"
                            iconColor="text-blue-600 dark:text-blue-400"
                        />
                        <StatCard
                            title="المستخدمون"
                            value={stats.total_users.toString()}
                            icon={<Users className="w-6 h-6" />}
                            subtitle={`+${stats.new_users_this_month} مستخدم جديد`}
                            bgColor="bg-purple-50 dark:bg-purple-900/20"
                            iconColor="text-purple-600 dark:text-purple-400"
                        />
                        <StatCard
                            title="إجمالي القوالب"
                            value={stats.total_templates.toString()}
                            icon={<Package className="w-6 h-6" />}
                            bgColor="bg-orange-50 dark:bg-orange-900/20"
                            iconColor="text-orange-600 dark:text-orange-400"
                        />
                    </>
                )}
            </div>

            {/* AI Insights Banner */}
            {!isLoading && stats?.ai_insights && (
                <Card className="rounded-[2.5rem] border-none bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <BrainCircuit className="w-32 h-32 text-primary" />
                    </div>
                    <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-3xl shadow-xl flex items-center justify-center text-primary shrink-0">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-right">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">توقعات الذكاء الاصطناعي</h3>
                                <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-black rounded-full uppercase">جديد</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-2xl">
                                {stats.ai_insights.recommendation}
                            </p>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-1 shrink-0">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">الإيرادات المتوقعة (الشهر القادم)</span>
                            <div className="text-3xl font-black text-primary flex items-center gap-2">
                                {formatCurrency(stats.ai_insights.predicted_revenue)}
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                    <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">آخر الطلبات</h2>
                        </div>
                        <Link href="/admin/orders">
                            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-full">
                                عرض الكل <ArrowLeft className="mr-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-4 text-right font-black">العميل</th>
                                    <th className="px-8 py-4 text-right font-black">المبلغ</th>
                                    <th className="px-8 py-4 text-right font-black">الحالة</th>
                                    <th className="px-8 py-4 text-right font-black">الوقت</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {isLoading ? (
                                    <>
                                        <TableRowSkeleton cols={4} />
                                        <TableRowSkeleton cols={4} />
                                        <TableRowSkeleton cols={4} />
                                        <TableRowSkeleton cols={4} />
                                    </>
                                ) : stats?.recent_orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                                    {order.user_name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                    {order.user_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-black text-gray-900 dark:text-white">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-8 py-5">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-8 py-5 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            {order.time_ago}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Templates */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                    <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-600">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">الأكثر مبيعاً</h2>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                        {isLoading ? (
                            <div className="p-8 space-y-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center gap-4 animate-pulse">
                                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                                            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : stats?.top_templates.map((template) => (
                            <div key={template.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-4 group">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-600 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                    <img src={template.thumbnail_url} alt={template.name_ar} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                        {template.name_ar}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-bold text-gray-500">{template.sales_count} مبيعات</span>
                                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(template.revenue)}</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, subtitle, bgColor, iconColor }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", bgColor, iconColor)}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black",
                        trend >= 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{title}</h3>
                <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</div>
                {subtitle && <p className="text-xs font-bold text-gray-400 mt-2">{subtitle}</p>}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: any = {
        completed: { label: 'مكتمل', className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', icon: <CheckCircle2 className="w-3 h-3" /> },
        pending: { label: 'قيد الانتظار', className: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400', icon: <Clock className="w-3 h-3" /> },
        cancelled: { label: 'ملغي', className: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
    };

    const config = configs[status] || configs.pending;

    return (
        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", config.className)}>
            {config.icon}
            {config.label}
        </div>
    );
}
