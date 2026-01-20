'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardStatSkeleton } from '@/components/ui/skeletons';

interface DashboardStats {
    total_revenue: number;
    total_orders: number;
    total_users: number;
    total_products: number;
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
    top_products: Array<{
        id: string;
        name_ar: string;
        name_en: string;
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

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, chartRes] = await Promise.all([
                    api.getAdminStats(),
                    api.getAdminChart(),
                ]);

                if (statsRes.success) {
                    setStats(statsRes.data);
                }
                if (chartRes.success) {
                    setChartData(chartRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate max revenue for chart scaling
    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">نظرة عامة على أداء المتجر</p>
                </div>
                <Link href="/admin/templates/create">
                    <Button className="btn-primary">
                        + إضافة قالب
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    <>
                        <DashboardStatSkeleton />
                        <DashboardStatSkeleton />
                        <DashboardStatSkeleton />
                        <DashboardStatSkeleton />
                    </>
                ) : (
                    <>
                        {/* Total Revenue */}
                        <div className="stat-card">
                            <div className="flex items-center gap-4">
                                <div className="stat-icon stat-icon-green">
                                    <span>💰</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الإيرادات</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {formatPrice(stats?.total_revenue || 0)}
                                    </h3>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className={`font-medium ${(stats?.revenue_trend || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {(stats?.revenue_trend || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.revenue_trend || 0)}%
                                </span>
                                <span className="text-gray-400 dark:text-gray-500 mr-2">مقارنة بالشهر الماضي</span>
                            </div>
                        </div>

                        {/* Total Orders */}
                        <div className="stat-card">
                            <div className="flex items-center gap-4">
                                <div className="stat-icon stat-icon-blue">
                                    <span>🛒</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">الطلبات المكتملة</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats?.total_orders || 0}
                                    </h3>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <span className="text-blue-600 dark:text-blue-400 font-medium">{stats?.today_orders || 0}</span>
                                <span className="mr-2">طلب اليوم</span>
                            </div>
                        </div>

                        {/* Total Users */}
                        <div className="stat-card">
                            <div className="flex items-center gap-4">
                                <div className="stat-icon stat-icon-purple">
                                    <span>👥</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">المستخدمون</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats?.total_users || 0}
                                    </h3>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <span className="text-purple-600 dark:text-purple-400 font-medium">+{stats?.new_users_this_month || 0}</span>
                                <span className="mr-2">هذا الشهر</span>
                            </div>
                        </div>

                        {/* Total Products */}
                        <div className="stat-card">
                            <div className="flex items-center gap-4">
                                <div className="stat-icon stat-icon-orange">
                                    <span>📦</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">المنتجات</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats?.total_products || 0}
                                    </h3>
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                منتج في المتجر
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Charts & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 admin-card">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        الإيرادات (آخر 7 أيام)
                    </h2>

                    {isLoading ? (
                        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                        <div className="h-64 flex items-end justify-between gap-2">
                            {chartData.map((item, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full relative">
                                        <div
                                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500"
                                            style={{
                                                height: `${Math.max((item.revenue / maxRevenue) * 200, 4)}px`,
                                            }}
                                        />
                                        {item.revenue > 0 && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {formatPrice(item.revenue)}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        {item.day}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Orders by Status */}
                <div className="admin-card">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        حالة الطلبات
                    </h2>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <span className="text-yellow-700 dark:text-yellow-400">⏳ قيد الانتظار</span>
                                <span className="font-bold text-yellow-800 dark:text-yellow-300">
                                    {stats?.orders_by_status.pending || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span className="text-green-700 dark:text-green-400">✅ مكتملة</span>
                                <span className="font-bold text-green-800 dark:text-green-300">
                                    {stats?.orders_by_status.completed || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <span className="text-red-700 dark:text-red-400">❌ ملغاة</span>
                                <span className="font-bold text-red-800 dark:text-red-300">
                                    {stats?.orders_by_status.cancelled || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <span className="text-purple-700 dark:text-purple-400">↩️ مستردة</span>
                                <span className="font-bold text-purple-800 dark:text-purple-300">
                                    {stats?.orders_by_status.refunded || 0}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Orders & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="admin-card">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        آخر الطلبات
                    </h2>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                            ))}
                        </div>
                    ) : stats?.recent_orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            لا توجد طلبات بعد
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats?.recent_orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold">
                                            {order.user_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {order.user_name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {order.items_count} منتج • {order.time_ago}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {formatPrice(order.total)}
                                        </div>
                                        <div className={`text-xs ${order.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                                            order.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                                                'text-gray-500 dark:text-gray-400'
                                            }`}>
                                            {order.status === 'completed' ? '✅ مكتمل' :
                                                order.status === 'pending' ? '⏳ قيد الانتظار' :
                                                    order.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Products */}
                <div className="admin-card">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        المنتجات الأكثر مبيعاً
                    </h2>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                            ))}
                        </div>
                    ) : stats?.top_products.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            لا توجد مبيعات بعد
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats?.top_products.map((product, index) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-lg font-bold text-gray-500 dark:text-gray-300">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                {product.name_ar}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {product.sales_count} مبيعة
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-green-600 dark:text-green-400">
                                        {formatPrice(product.revenue)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
