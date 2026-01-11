'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface AdminOrder {
    id: string;
    order_number: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    items: {
        id: string;
        product_id: string;
        product_name: string;
        price: number;
    }[];
    subtotal: number;
    discount: number;
    total: number;
    status: string;
    payment_method: string;
    created_at: string;
    paid_at: string | null;
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
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function OrderStatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
        processing: { label: 'قيد المعالجة', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
        completed: { label: 'مكتمل', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
        failed: { label: 'فشل', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
        refunded: { label: 'مسترد', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
        cancelled: { label: 'ملغي', className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
    };
    const cfg = config[status] || config.pending;
    return <span className={`px-2 py-1 rounded text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            // Using the existing getOrders with admin context
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });
            const data = await response.json();
            setOrders(data.data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            // Fallback to simulated data for demo
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter((order) => {
        const matchesSearch = !searchQuery ||
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success('تم تحديث حالة الطلب ✅');
                setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
                setSelectedOrder(null);
            } else {
                toast.error(data.message || 'فشل في تحديث حالة الطلب');
            }
        } catch (error) {
            toast.error('فشل في تحديث حالة الطلب');
        }
    };

    const stats = {
        total: orders.length,
        pending: orders.filter((o) => o.status === 'pending').length,
        completed: orders.filter((o) => o.status === 'completed').length,
        revenue: orders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
    };

    // Export orders to CSV
    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const csvContent = [
                ['رقم الطلب', 'العميل', 'البريد', 'الإجمالي', 'الحالة', 'التاريخ'].join(','),
                ...filteredOrders.map(order => [
                    order.order_number,
                    order.user?.name || 'زائر',
                    order.user?.email || '-',
                    order.total,
                    order.status,
                    new Date(order.created_at).toLocaleDateString('ar-SA')
                ].join(','))
            ].join('\n');

            const bom = '\uFEFF';
            const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('تم تصدير الطلبات بنجاح ✅');
        } catch (error) {
            toast.error('فشل في تصدير البيانات');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الطلبات 🛒</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">عرض وإدارة طلبات العملاء</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={isExporting || filteredOrders.length === 0}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                    {isExporting ? (
                        <><span className="animate-spin">⏳</span> جاري التصدير...</>
                    ) : (
                        <><span>📥</span> تصدير CSV</>
                    )}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الطلبات</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{stats.pending}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">قيد الانتظار</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.completed}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">مكتملة</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(stats.revenue)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">الإيرادات</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 بحث برقم الطلب أو اسم العميل..."
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                >
                    <option value="">جميع الحالات</option>
                    <option value="pending">قيد الانتظار</option>
                    <option value="processing">قيد المعالجة</option>
                    <option value="completed">مكتملة</option>
                    <option value="failed">فاشلة</option>
                    <option value="refunded">مستردة</option>
                    <option value="cancelled">ملغاة</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl mb-4">⏳</div>
                        <p className="text-gray-600 dark:text-gray-400">جاري تحميل الطلبات...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد طلبات</h3>
                        <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على طلبات مطابقة</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                <tr>
                                    <th className="text-right py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">رقم الطلب</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">العميل</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">المنتجات</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">الإجمالي</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">التاريخ</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <code className="font-mono text-primary-600 dark:text-primary-400 font-bold">
                                                {order.order_number}
                                            </code>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{order.user?.name || '-'}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{order.user?.email || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                                            {order.items?.length || 0} منتج
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(order.total)}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <OrderStatusBadge status={order.status} />
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            >
                                                👁️ عرض
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto border dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">تفاصيل الطلب</h2>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">رقم الطلب</span>
                                <code className="font-mono font-bold text-primary-600 dark:text-primary-400">{selectedOrder.order_number}</code>
                            </div>
                            <div className="flex justify-between py-2 border-b dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">العميل</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.user?.name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">البريد</span>
                                <span className="text-gray-900 dark:text-gray-100">{selectedOrder.user?.email}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">الإجمالي</span>
                                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{formatPrice(selectedOrder.total)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b dark:border-gray-700 items-center">
                                <span className="text-gray-600 dark:text-gray-400">الحالة</span>
                                <OrderStatusBadge status={selectedOrder.status} />
                            </div>

                            <div className="pt-4">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">المنتجات:</h4>
                                <ul className="space-y-2">
                                    {selectedOrder.items?.map((item, i) => (
                                        <li key={i} className="flex justify-between text-sm py-2 border-b dark:border-gray-700">
                                            <span className="text-gray-900 dark:text-gray-200">{item.product_name}</span>
                                            <span className="text-gray-500 dark:text-gray-400">{formatPrice(item.price)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Status Update */}
                            <div className="pt-4">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">تحديث الحالة:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {['processing', 'completed', 'cancelled'].map((status) => (
                                        <Button
                                            key={status}
                                            onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                                            disabled={selectedOrder.status === status}
                                            variant={selectedOrder.status === status ? 'outline' : 'default'}
                                            className="text-sm dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700 disabled:opacity-50"
                                        >
                                            {status === 'processing' && '🔄 معالجة'}
                                            {status === 'completed' && '✅ إكمال'}
                                            {status === 'cancelled' && '🚫 إلغاء'}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Button onClick={() => setSelectedOrder(null)} className="w-full dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700" variant="outline">
                                إغلاق
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
