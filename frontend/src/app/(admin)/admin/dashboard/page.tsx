'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardStatSkeleton, TableRowSkeleton } from '@/components/ui/skeletons';
import {
    CurrencyDollarIcon,
    ShoppingCartIcon,
    UsersIcon,
    CubeIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
    total_revenue: number;
    total_orders: number;
    total_users: number;
    total_products: number;
    monthly_revenue: number;
    revenue_trend: number;
    today_orders: number;
    today_revenue: number;
    new_users_this_month: number;
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
        thumbnail_url: string;
        sales_count: number;
        revenue: number;
    }>;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.getAdminStats();
                if (response.success) {
                    setStats(response.data);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'فشل تحميل الإحصائيات';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

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
            <div className="text-center py-16">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
                <p className="text-gray-500">نظرة عامة على أداء المتجر</p>
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
                        {/* Revenue */}
                        <StatCard
                            title="إجمالي الإيرادات"
                            value={formatCurrency(stats.total_revenue)}
                            icon={<CurrencyDollarIcon className="w-6 h-6" />}
                            trend={stats.revenue_trend}
                            bgColor="bg-green-50"
                            iconColor="text-green-600"
                        />

                        {/* Orders */}
                        <StatCard
                            title="الطلبات المكتملة"
                            value={stats.total_orders.toString()}
                            icon={<ShoppingCartIcon className="w-6 h-6" />}
                            subtitle={`${stats.today_orders} اليوم`}
                            bgColor="bg-blue-50"
                            iconColor="text-blue-600"
                        />

                        {/* Users */}
                        <StatCard
                            title="المستخدمون"
                            value={stats.total_users.toString()}
                            icon={<UsersIcon className="w-6 h-6" />}
                            subtitle={`+${stats.new_users_this_month} هذا الشهر`}
                            bgColor="bg-purple-50"
                            iconColor="text-purple-600"
                        />

                        {/* Products */}
                        <StatCard
                            title="المنتجات"
                            value={stats.total_products.toString()}
                            icon={<CubeIcon className="w-6 h-6" />}
                            bgColor="bg-orange-50"
                            iconColor="text-orange-600"
                        />
                    </>
                )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">آخر الطلبات</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-right">العميل</th>
                                    <th className="px-4 py-3 text-right">المبلغ</th>
                                    <th className="px-4 py-3 text-right">الحالة</th>
                                    <th className="px-4 py-3 text-right">الوقت</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <>
                                        <TableRowSkeleton cols={4} />
                                        <TableRowSkeleton cols={4} />
                                        <TableRowSkeleton cols={4} />
                                    </>
                                ) : stats?.recent_orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {order.user_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {order.time_ago}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">المنتجات الأكثر مبيعاً</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {isLoading ? (
                            <div className="p-4 space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4 animate-pulse">
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : stats?.top_products.map((product, index) => (
                            <div key={product.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                                <span className="text-2xl font-bold text-gray-300 w-6">
                                    {index + 1}
                                </span>
                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                    {product.thumbnail_url && (
                                        <img
                                            src={product.thumbnail_url}
                                            alt={product.name_ar}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{product.name_ar}</p>
                                    <p className="text-sm text-gray-500">
                                        {product.sales_count} مبيعات
                                    </p>
                                </div>
                                <span className="font-semibold text-green-600">
                                    {formatCurrency(product.revenue)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    icon,
    trend,
    subtitle,
    bgColor = 'bg-gray-50',
    iconColor = 'text-gray-600',
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: number;
    subtitle?: string;
    bgColor?: string;
    iconColor?: string;
}) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>

                    {trend !== undefined && (
                        <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {trend >= 0 ? (
                                <ArrowTrendingUpIcon className="w-4 h-4 ml-1" />
                            ) : (
                                <ArrowTrendingDownIcon className="w-4 h-4 ml-1" />
                            )}
                            <span>{Math.abs(trend)}% عن الشهر الماضي</span>
                        </div>
                    )}

                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
                    )}
                </div>

                <div className={`p-3 rounded-xl ${bgColor} ${iconColor}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
        refunded: 'bg-gray-100 text-gray-700',
    };

    const labels: Record<string, string> = {
        pending: 'قيد الانتظار',
        completed: 'مكتمل',
        cancelled: 'ملغي',
        refunded: 'مسترد',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
            {labels[status] || status}
        </span>
    );
}
