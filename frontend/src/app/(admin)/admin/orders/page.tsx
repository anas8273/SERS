'use client';

import { logger } from '@/lib/logger';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BulkActionBar } from '@/components/admin/BulkActionBar';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { ta, tDate } from '@/i18n/auto-translations';
import { formatPrice } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import {
    ShoppingCart,
    Clock,
    CheckCircle,
    TrendingUp,
    Search,
    Download,
    Loader2,
    Package,
    Eye,
    Filter,
} from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

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



function formatDate(date: string): string {
    return tDate(date);
}

function OrderStatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        pending: { label: ta('قيد الانتظار', 'Pending'), className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
        processing: { label: ta('قيد المعالجة', 'Processing'), className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
        completed: { label: ta('مكتمل', 'Completed'), className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
        failed: { label: ta('فشل', 'Failed'), className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
        refunded: { label: ta('مسترد', 'Refunded'), className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
        cancelled: { label: ta('ملغي', 'Cancelled'), className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
    };
    const cfg = config[status] || config.pending;
    return <span className={`px-2 py-1 rounded text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
}

export default function AdminOrdersPage() {
    const { dir } = useTranslation();
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/admin/orders') as any;
            setOrders(data.data || []);
        } catch (error) {
            logger.error('Failed to fetch orders:', error);
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
            const data = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus }) as any;
            if (data.success) {
                toast.success(ta('تم تحديث حالة الطلب ✅', 'Status updated'));
                setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
                setSelectedOrder(null);
            } else {
                toast.error(data.message || ta('فشل في تحديث حالة الطلب', 'Failed to update status'));
            }
        } catch (error) {
            toast.error(ta('فشل في تحديث حالة الطلب', 'Failed to update status'));
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
                [ta('رقم الطلب', 'Order #'), ta('العميل', 'Customer'), ta('البريد', 'Email'), ta('الإجمالي', 'Total'), ta('الحالة', 'Status'), ta('التاريخ', 'Date')].join(','),
                ...filteredOrders.map(order => [
                    order.order_number,
                    order.user?.name || ta('زائر', 'Guest'),
                    order.user?.email || '-',
                    order.total,
                    order.status,
                    tDate(order.created_at)
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
            toast.success(ta('تم تصدير الطلبات بنجاح ✅', 'Orders exported successfully ✅'));
        } catch (error) {
            toast.error(ta('فشل في تصدير البيانات', 'Failed to export'));
        } finally {
            setIsExporting(false);
        }
    };

    // Bulk operations
    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };
    const selectAll = () => setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    const deselectAll = () => setSelectedIds(new Set());
    const isAllSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.has(o.id));

    const handleBulkStatusUpdate = async (idsToUpdate?: Set<string>, status = 'completed') => {
        const ids = idsToUpdate ?? selectedIds;
        setIsBulkDeleting(true);
        let successCount = 0;
        await Promise.allSettled(
            Array.from(ids).map(async (id) => {
                try {
                    await api.put(`/admin/orders/${id}/status`, { status }) as any;
                    successCount++;
                } catch {}
            })
        );
        setSelectedIds(new Set());
        setShowBulkDeleteConfirm(false);
        setShowDeleteAllConfirm(false);
        setIsBulkDeleting(false);
        if (successCount > 0) {
            toast.success(ta(`تم تحديث حالة ${successCount} طلب بنجاح`, `Updated ${successCount} orders successfully`));
            fetchOrders();
        }
    };


    return (
        <div dir={dir} className="space-y-6 animate-fade-in">
            {/* ===== Premium Header ===== */}
            <div className="relative overflow-hidden bg-gradient-to-l from-sky-500/5 via-blue-500/5 to-indigo-500/5 dark:from-sky-500/10 dark:via-blue-500/10 dark:to-indigo-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl translate-x-8 translate-y-8" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <span className="p-2.5 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl text-white shadow-lg shadow-sky-500/20">
                                <ShoppingCart className="w-5 h-5" />
                            </span>
                            {ta('إدارة الطلبات', 'Orders Management')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            {ta('عرض وإدارة طلبات العملاء', 'View and manage customer orders')} ({stats.total} {ta('طلب', 'orders')})
                        </p>
                    </div>
                    <Button
                        onClick={handleExportCSV}
                        disabled={isExporting || filteredOrders.length === 0}
                        variant="outline"
                        className="rounded-xl gap-2 hover:-translate-y-0.5 transition-all"
                    >
                        {isExporting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> {ta('جاري التصدير...', 'Exporting')}</>
                        ) : (
                            <><Download className="w-4 h-4" /> {ta('تصدير CSV', 'Export CSV')}</>
                        )}
                    </Button>
                </div>
            </div>

            {/* ===== Stats Grid ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-sky-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('إجمالي الطلبات', 'Total Orders')}</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-yellow-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.pending}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('قيد الانتظار', 'Pending')}</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-green-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.completed}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('مكتملة', 'Completed')}</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-purple-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{formatPrice(stats.revenue)}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('الإيرادات', 'Revenue')}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={ta('بحث برقم الطلب أو اسم العميل...', 'Search by order # or customer name...')}
                        className="pe-10 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl h-11"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                >
                    <option value="">{ta('جميع الحالات', 'All Statuses')}</option>
                    <option value="pending">{ta('قيد الانتظار', 'Pending')}</option>
                    <option value="processing">{ta('قيد المعالجة', 'Processing')}</option>
                    <option value="completed">{ta('مكتملة', 'Completed')}</option>
                    <option value="failed">{ta('فاشلة', 'Failed')}</option>
                    <option value="refunded">{ta('مستردة', 'Refunded')}</option>
                    <option value="cancelled">{ta('ملغاة', 'Cancelled')}</option>
                </select>
            </div>

            {/* Bulk Actions */}
            <BulkActionBar
                selectedCount={selectedIds.size}
                totalCount={filteredOrders.length}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onDeleteSelected={() => setShowBulkDeleteConfirm(true)}
                onDeleteAll={() => setShowDeleteAllConfirm(true)}
                isAllSelected={isAllSelected}
                entityName={ta("طلب", "orders")}
            />

            {/* Orders Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl mb-4">⏳</div>
                        <p className="text-gray-600 dark:text-gray-400">{ta('جاري تحميل الطلبات...', 'Loading orders...')}</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <EmptyState
                        icon={<Search className="w-12 h-12 text-gray-400" />}
                        title={ta("لا توجد طلبات", "No orders")}
                        description={ta('لم يتم العثور على طلبات مطابقة', 'No matching orders found')}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                <tr>
                                    <th className="py-4 px-4 w-10">
                                        <input type="checkbox" checked={isAllSelected} onChange={isAllSelected ? deselectAll : selectAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer" />
                                    </th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">{ta('رقم الطلب', 'Order #')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">{ta('العميل', 'Customer')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">{ta('القوالب', 'Templates')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">{ta('الإجمالي', 'Total')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">{ta('الحالة', 'Status')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">{ta('التاريخ', 'Date')}</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-600 dark:text-gray-300">{ta('الإجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.has(order.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                        <td className="py-4 px-4">
                                            <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer" />
                                        </td>
                                        <td className="py-4 px-4">
                                            <code className="font-mono text-primary font-bold">
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
                                            {order.items?.length || 0} {ta('قالب', 'templates')}
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
                                                {ta('عرض', 'View')}
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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{ta('تفاصيل الطلب', 'Order Details')}</h2>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">{ta('رقم الطلب', 'Order #')}</span>
                                <code className="font-mono font-bold text-primary">{selectedOrder.order_number}</code>
                            </div>
                            <div className="flex justify-between py-2 border-b dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">{ta('العميل', 'Customer')}</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.user?.name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">{ta('البريد', 'Email')}</span>
                                <span className="text-gray-900 dark:text-gray-100">{selectedOrder.user?.email}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">{ta('الإجمالي', 'Total')}</span>
                                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{formatPrice(selectedOrder.total)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b dark:border-gray-700 items-center">
                                <span className="text-gray-600 dark:text-gray-400">{ta('الحالة', 'Status')}</span>
                                <OrderStatusBadge status={selectedOrder.status} />
                            </div>

                            <div className="pt-4">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{ta('القوالب:', 'Templates:')}</h4>
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
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{ta('تحديث الحالة:', 'Update Status:')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {['processing', 'completed', 'cancelled'].map((status) => (
                                        <Button
                                            key={status}
                                            onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                                            disabled={selectedOrder.status === status}
                                            variant={selectedOrder.status === status ? 'outline' : 'default'}
                                            className="text-sm dark:bg-primary dark:text-white dark:hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            {status === 'processing' && ta('🔄 معالجة', '🔄 Processing')}
                                            {status === 'completed' && ta('✅ إكمال', '✅ Complete')}
                                            {status === 'cancelled' && ta('🚫 إلغاء', '🚫 Cancel')}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Button onClick={() => setSelectedOrder(null)} className="w-full dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700" variant="outline">
                                {ta('إغلاق', 'Close')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Status Update Confirmations */}
            <ConfirmDialog
                open={showBulkDeleteConfirm}
                title={ta(`إكمال ${selectedIds.size} طلب`, `Complete ${selectedIds.size} orders`)}
                message={ta(`تحديث حالة ${selectedIds.size} طلب؟`, `Update ${selectedIds.size} orders?`)}
                confirmLabel={ta("إكمال المحدد", "Complete Selected")}
                isLoading={isBulkDeleting}
                onConfirm={() => handleBulkStatusUpdate()}
                onCancel={() => setShowBulkDeleteConfirm(false)}
            />
            <ConfirmDialog
                open={showDeleteAllConfirm}
                title={ta("إكمال جميع الطلبات", "Complete All Orders")}
                message={ta(`تحديث جميع الطلبات (${filteredOrders.length})؟`, `Update all (${filteredOrders.length}) orders?`)}
                confirmLabel={ta("إكمال الكل", "Complete All")}
                isLoading={isBulkDeleting}
                onConfirm={() => handleBulkStatusUpdate(new Set(filteredOrders.map(o => o.id)))}
                onCancel={() => setShowDeleteAllConfirm(false)}
            />
        </div>
    );
}
