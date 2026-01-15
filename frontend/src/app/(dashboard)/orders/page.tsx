'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Order } from '@/types';

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
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function OrderStatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
        pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
        processing: { label: 'قيد المعالجة', className: 'bg-blue-100 text-blue-700', icon: '🔄' },
        completed: { label: 'مكتمل', className: 'bg-green-100 text-green-700', icon: '✅' },
        failed: { label: 'فشل', className: 'bg-red-100 text-red-700', icon: '❌' },
        refunded: { label: 'مسترد', className: 'bg-purple-100 text-purple-700', icon: '↩️' },
        cancelled: { label: 'ملغي', className: 'bg-gray-100 text-gray-700', icon: '🚫' },
    };
    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!isAuthenticated) return;

            try {
                const response = await api.getOrders();
                setOrders(response.data || []);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchOrders();
        }
    }, [isAuthenticated]);

    const handleDownload = async (orderItemId: string) => {
        try {
            const response = await api.downloadFile(orderItemId);
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
            <Navbar />

            <main className="flex-1 pt-8 pb-16">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">طلباتي 📦</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{orders.length} طلب</p>
                        </div>
                        <Link href="/marketplace">
                            <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                                مواصلة التسوق
                            </Button>
                        </Link>
                    </div>

                    {/* Orders List */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                                    <div className="flex justify-between mb-4">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                    </div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                            <div className="text-6xl mb-4">📭</div>
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                لا توجد طلبات حتى الآن
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                ابدأ بتصفح المتجر واكتشف المنتجات التعليمية الرائعة
                            </p>
                            <Link href="/marketplace">
                                <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                                    تصفح المتجر
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {/* Order Header */}
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-mono font-bold text-primary-600 dark:text-primary-400">
                                                {order.order_number}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {formatDate(order.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <OrderStatusBadge status={order.status} />
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                                {formatPrice(order.total)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="p-6">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                            المنتجات ({order.items?.length || 0})
                                        </h4>
                                        <div className="space-y-3">
                                            {order.items?.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center text-xl">
                                                            📚
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {item.template_name || item.template?.name_ar}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {formatPrice(item.price)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {order.status === 'completed' && (
                                                        <Button
                                                            onClick={() => handleDownload(item.id)}
                                                            className="bg-green-600 hover:bg-green-700 text-white text-sm animate-bounce-short shadow-md hover:shadow-lg"
                                                            size="lg"
                                                        >
                                                            ⬇️ تحميل الملف
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-gray-400">المجموع الفرعي</span>
                                            <span className="text-gray-900 dark:text-white">{formatPrice(order.subtotal)}</span>
                                        </div>
                                        {order.discount > 0 && (
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-green-600 dark:text-green-400">الخصم</span>
                                                <span className="text-green-600 dark:text-green-400">-{formatPrice(order.discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                                            <span className="text-gray-900 dark:text-white">الإجمالي</span>
                                            <span className="text-primary-600 dark:text-primary-400">{formatPrice(order.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
