'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Order, Product } from '@/types';
import { Button } from '@/components/ui/button';

interface DashboardStats {
    orders_count: number;
    wishlist_count: number;
    reviews_count: number;
    total_spent: number;
}

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function OrderStatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-700' },
        processing: { label: 'قيد المعالجة', className: 'bg-blue-100 text-blue-700' },
        completed: { label: 'مكتمل', className: 'bg-green-100 text-green-700' },
        failed: { label: 'فشل', className: 'bg-red-100 text-red-700' },
        refunded: { label: 'مسترد', className: 'bg-gray-100 text-gray-700' },
        cancelled: { label: 'ملغي', className: 'bg-gray-100 text-gray-700' },
    };
    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
}

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats>({
        orders_count: 0,
        wishlist_count: 0,
        reviews_count: 0,
        total_spent: 0,
    });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!isAuthenticated) return;

            try {
                // Fetch orders
                const ordersRes = await api.getOrders();
                const orders = ordersRes.data || [];
                setRecentOrders(orders.slice(0, 5));

                // Calculate stats
                const completedOrders = orders.filter((o: Order) => o.status === 'completed');
                const totalSpent = completedOrders.reduce((sum: number, o: Order) => sum + o.total, 0);

                // Fetch wishlist count
                let wishlistCount = 0;
                try {
                    const wishlistRes = await api.getWishlistIds();
                    wishlistCount = wishlistRes.data?.length || 0;
                } catch (e) {
                    // Wishlist might not exist
                }

                setStats({
                    orders_count: orders.length,
                    wishlist_count: wishlistCount,
                    reviews_count: 0, // Would need a dedicated endpoint
                    total_spent: totalSpent,
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
            fetchDashboardData();
        }
    }, [isAuthenticated, authLoading]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const quickLinks = [
        { label: 'المتجر', href: '/marketplace', icon: '🛍️', color: 'from-blue-500 to-blue-600' },
        { label: 'طلباتي', href: '/orders', icon: '📦', color: 'from-purple-500 to-purple-600' },
        { label: 'المفضلة', href: '/wishlist', icon: '❤️', color: 'from-red-500 to-red-600' },
        { label: 'الإعدادات', href: '/settings', icon: '⚙️', color: 'from-gray-500 to-gray-600' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-1 pt-8 pb-16">
                <div className="max-w-6xl mx-auto px-4">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            مرحباً، {user?.name || 'المستخدم'} 👋
                        </h1>
                        <p className="text-gray-600 mt-1">
                            إليك ملخص نشاطك على المنصة
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                                    📦
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.orders_count}</p>
                                    <p className="text-sm text-gray-500">إجمالي الطلبات</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">
                                    ❤️
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.wishlist_count}</p>
                                    <p className="text-sm text-gray-500">في المفضلة</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">
                                    ⭐
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.reviews_count}</p>
                                    <p className="text-sm text-gray-500">تقييماتي</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                                    💰
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.total_spent)}</p>
                                    <p className="text-sm text-gray-500">إجمالي الإنفاق</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`bg-gradient-to-br ${link.color} text-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1`}
                            >
                                <span className="text-3xl mb-2 block">{link.icon}</span>
                                <span className="font-semibold">{link.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Recent Orders */}
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            <div className="p-6 border-b flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">آخر الطلبات</h2>
                                <Link href="/orders" className="text-primary-600 hover:underline text-sm">
                                    عرض الكل ←
                                </Link>
                            </div>

                            {isLoading ? (
                                <div className="p-6 space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentOrders.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-5xl mb-4">📭</div>
                                    <p className="text-gray-500 mb-4">لا توجد طلبات حتى الآن</p>
                                    <Link
                                        href="/marketplace"
                                        className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        تصفح المتجر
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {recentOrders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/orders/${order.id}`}
                                            className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                                📦
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {order.order_number}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-left flex flex-col items-end gap-2">
                                                <p className="font-bold text-gray-900">
                                                    {formatPrice(order.total)}
                                                </p>
                                                <OrderStatusBadge status={order.status} />

                                                {order.status === 'completed' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            // For now, download the first item or handle multiple
                                                            // Ideally this should list downloadable items
                                                            if (order.items && order.items.length > 0) {
                                                                const itemId = order.items[0].id; // Simple default
                                                                // Trigger download
                                                                window.location.href = `/orders/${order.id}`;
                                                                // Redirect to details to see individual downloads
                                                            }
                                                        }}
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 p-0 h-auto font-normal text-xs"
                                                    >
                                                        ⬇️ تحميل الملفات
                                                    </Button>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Account Info */}
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-bold text-gray-900">معلومات الحساب</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-600">
                                        {user?.name?.charAt(0) || '؟'}
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{user?.name}</p>
                                        <p className="text-gray-500">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between py-3 border-b">
                                        <span className="text-gray-600">نوع الحساب</span>
                                        <span className="font-medium text-gray-900">
                                            {user?.role === 'admin' ? '👑 مدير' : '👤 مستخدم'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-3 border-b">
                                        <span className="text-gray-600">حالة الحساب</span>
                                        <span className="font-medium text-green-600">✅ نشط</span>
                                    </div>
                                </div>

                                <Link
                                    href="/settings"
                                    className="block w-full text-center py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                                >
                                    تعديل الملف الشخصي
                                </Link>

                                {user?.role === 'admin' && (
                                    <Link
                                        href="/admin"
                                        className="block w-full text-center py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                                    >
                                        🎛️ لوحة الإدارة
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
