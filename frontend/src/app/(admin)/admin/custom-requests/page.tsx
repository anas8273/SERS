'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import {
    ShoppingBag,
    Search,
    RefreshCcw,
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    MessageSquare,
    User,
    Calendar,
    Filter,
    ChevronDown,
    Inbox,
} from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

// ── Types ─────────────────────────────────────────────────────────────
interface CustomRequest {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
    votes_count: number;
    attachments: { path: string; name: string; type: string }[];
    created_at: string;
    updated_at: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
    category?: {
        id: string;
        name: string;
    };
    assigned_to?: string;
    admin_notes?: string;
}

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'rejected';

// ── Helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; darkBg: string; darkText: string; icon: typeof Clock }> = {
    pending:     { label: ta('قيد الانتظار', 'Pending'),  bg: 'bg-yellow-100', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-400', icon: Clock },
    in_progress: { label: ta('قيد التنفيذ', 'In Progress'),   bg: 'bg-blue-100',   text: 'text-blue-700',   darkBg: 'dark:bg-blue-900/30',   darkText: 'dark:text-blue-400',   icon: Loader2 },
    completed:   { label: ta('مكتمل', 'Completed'),          bg: 'bg-green-100',  text: 'text-green-700',  darkBg: 'dark:bg-green-900/30',  darkText: 'dark:text-green-400',  icon: CheckCircle2 },
    rejected:    { label: ta('مرفوض', 'Rejected'),          bg: 'bg-red-100',    text: 'text-red-700',    darkBg: 'dark:bg-red-900/30',    darkText: 'dark:text-red-400',    icon: XCircle },
    cancelled:   { label: ta('ملغي', 'Cancelled'),           bg: 'bg-gray-100',   text: 'text-gray-600',   darkBg: 'dark:bg-gray-700',      darkText: 'dark:text-gray-400',   icon: XCircle },
};

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Detail Modal ──────────────────────────────────────────────────────
function DetailModal({
    request,
    onClose,
    onStatusUpdate,
    isUpdating,
}: {
    request: CustomRequest;
    onClose: () => void;
    onStatusUpdate: (id: string, status: string, notes?: string) => void;
    isUpdating: boolean;
}) {
    const [notes, setNotes] = useState(request.admin_notes || '');
    const cfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
    const StatusIcon = cfg.icon;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border dark:border-gray-700">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">{ta('تفاصيل الطلب', 'Request Details')}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.darkBg} ${cfg.darkText}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {cfg.label}
                    </span>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{request.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{request.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{ta('مقدم الطلب', 'Applicant')}</p>
                            <p className="font-bold text-gray-900 dark:text-white">{request.user?.name || '—'}</p>
                            <p className="text-xs text-gray-400">{request.user?.email || ''}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{ta('التصنيف', 'Category')}</p>
                            <p className="font-bold text-gray-900 dark:text-white">{request.category?.name || 'بدون تصنيف'}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{ta('التصويتات', 'Votes')}</p>
                            <p className="font-bold text-gray-900 dark:text-white">{request.votes_count} صوت</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{ta('تاريخ الإنشاء', 'Creation Date')}</p>
                            <p className="font-bold text-gray-900 dark:text-white text-xs">{formatDate(request.created_at)}</p>
                        </div>
                    </div>

                    {/* Attachments */}
                    {request.attachments && request.attachments.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">المرفقات ({request.attachments.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {request.attachments.map((att, i) => (
                                    <a
                                        key={i}
                                        href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${att.path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                    >
                                        📎 {att.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            {ta('ملاحظات المشرف', 'Admin Notes')}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30 text-gray-900 dark:text-white"
                            placeholder={ta('ملاحظات إدارية (اختياري)...', 'Admin notes (optional)...')}
                        />
                    </div>

                    {/* Status Update Actions */}
                    {request.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                onClick={() => onStatusUpdate(request.id, 'in_progress', notes)}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                                بدء التنفيذ
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                                onClick={() => onStatusUpdate(request.id, 'rejected', notes)}
                                disabled={isUpdating || !notes.trim()}
                            >
                                <XCircle className="h-4 w-4" />
                                {ta('رفض', 'Reject')}
                            </Button>
                        </div>
                    )}
                    {request.status === 'in_progress' && (
                        <div className="flex gap-2 pt-2">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                                onClick={() => onStatusUpdate(request.id, 'completed', notes)}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                إكمال الطلب
                            </Button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <Button variant="outline" onClick={onClose} className="w-full dark:text-gray-200 dark:border-gray-600">
                        {ta('إغلاق', 'Close')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function AdminCustomRequestsPage() {
    const { dir } = useTranslation();
    const [requests, setRequests] = useState<CustomRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [search, setSearch] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // ── Fetch ─────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number> = { page: currentPage, per_page: 15 };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (search) params.search = search;

            const res = await api.get('/admin/custom-requests', { params }) as any;
            const data = res?.data;
            if (data) {
                setRequests((data as any)?.data ?? data ?? []);
                setTotalPages(data?.last_page ?? 1);
            }
        } catch (error) {
            logger.error('Error fetching custom requests:', error);
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, currentPage, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Status Update ─────────────────────────────────────────────────
    const handleStatusUpdate = async (id: string, status: string, notes?: string) => {
        setIsUpdating(true);
        try {
            const res = await api.put(`/admin/custom-requests/${id}/status`, { 
                status, 
                admin_notes: notes || undefined 
            }) as any;
            if ((res as any)?.success !== false) {
                toast.success(
                    status === 'completed' ? ta('تم إكمال الطلب بنجاح ✅', 'Request completed successfully ✅') :
                    status === 'rejected' ? ta('تم رفض الطلب', 'Request rejected') :
                    status === 'in_progress' ? ta('تم بدء التنفيذ', 'Implementation started') :
                    'تم تحديث الحالة'
                );
                setSelectedRequest(null);
                fetchData();
            }
        } catch (err: any) {
            toast.error(err?.message || ta('فشل في تحديث حالة الطلب', 'Failed to update status'));
        } finally {
            setIsUpdating(false);
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        in_progress: requests.filter(r => r.status === 'in_progress').length,
        completed: requests.filter(r => r.status === 'completed').length,
    };

    // ── Filtered ──────────────────────────────────────────────────────
    const filtered = requests.filter(r =>
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div dir={dir} className="space-y-6">
            {/* ===== Header ===== */}
            <div className="relative overflow-hidden bg-gradient-to-l from-orange-500/5 via-amber-500/5 to-yellow-500/5 dark:from-orange-500/10 dark:via-amber-500/10 dark:to-yellow-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl translate-x-8 translate-y-8 pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <span className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl text-white shadow-lg shadow-orange-500/20">
                                <ShoppingBag className="w-5 h-5" />
                            </span>
                            {ta('الطلبات المخصصة', 'Custom Requests')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            إدارة ومتابعة طلبات المستخدمين المخصصة ({stats.total} طلب)
                        </p>
                    </div>
                    <Button onClick={fetchData} variant="outline" className="rounded-xl gap-2 hover:-translate-y-0.5 transition-all" disabled={isLoading}>
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        {ta('تحديث', 'Update')}
                    </Button>
                </div>
            </div>

            {/* ===== Stats Grid ===== */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: ta('إجمالي الطلبات', 'Total Orders'), value: stats.total, icon: Inbox, gradient: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/20' },
                    { label: ta('قيد الانتظار', 'Pending'), value: stats.pending, icon: Clock, gradient: 'from-yellow-500 to-amber-600', shadow: 'shadow-yellow-500/20' },
                    { label: ta('قيد التنفيذ', 'In Progress'), value: stats.in_progress, icon: Loader2, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
                    { label: ta('مكتملة', 'Completed'), value: stats.completed, icon: CheckCircle2, gradient: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/20' },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5">
                            <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform shrink-0`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ===== Search & Filter ===== */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder={ta('البحث بالعنوان أو اسم المستخدم...', 'Search by subject or username...')}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="pe-10 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl h-11"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400 shrink-0" />
                    {(['all', 'pending', 'in_progress', 'completed', 'rejected'] as StatusFilter[]).map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                statusFilter === s
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {s === 'all' ? ta('الكل', 'All') : STATUS_CONFIG[s]?.label || s}
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== Table ===== */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                        <p className="text-sm">{ta('جاري تحميل الطلبات...', 'Loading orders...')}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<Inbox className="w-12 h-12 text-gray-400" />}
                        title={ta("لا توجد طلبات مخصصة", "No requests")}
                        description={statusFilter === 'all' ? ta('لم يتم تقديم أي طلبات مخصصة بعد', 'No custom requests submitted yet') : ta('لا توجد طلبات بهذا الفلتر', 'No orders match this filter') }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400">{ta('العنوان', 'Title')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400">{ta('مقدم الطلب', 'Applicant')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400">{ta('التصنيف', 'Category')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400">{ta('التصويتات', 'Votes')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400">{ta('الحالة', 'Status')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400">{ta('التاريخ', 'Date')}</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-600 dark:text-gray-400">{ta('الإجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filtered.map((req) => {
                                    const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                                    const StatusIcon = cfg.icon;
                                    return (
                                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="py-4 px-4">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 max-w-[200px]">
                                                    {req.title}
                                                </p>
                                                <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">
                                                    {req.description}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {req.user?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.user?.name || '—'}</p>
                                                        <p className="text-xs text-gray-400">{req.user?.email || ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                                    {req.category?.name || ta('عام', 'General')}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {req.votes_count}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.darkBg} ${cfg.darkText}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(req.created_at)}</p>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => setSelectedRequest(req)}
                                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title={ta("عرض التفاصيل", "View Details")}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            صفحة {currentPage} من {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="dark:border-gray-600 dark:text-gray-300"
                            >
                                {ta('السابق', 'Previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="dark:border-gray-600 dark:text-gray-300"
                            >
                                {ta('التالي', 'Next')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== Detail Modal ===== */}
            {selectedRequest && (
                <DetailModal
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onStatusUpdate={handleStatusUpdate}
                    isUpdating={isUpdating}
                />
            )}
        </div>
    );
}
