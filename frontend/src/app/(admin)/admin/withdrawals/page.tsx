'use client';

/**
 * Admin Withdrawal Management Page
 * /admin/withdrawals
 *
 * Allows admin to:
 *  - View all withdrawal requests with filtering by status
 *  - Approve (bank transfer or wallet credit) or Reject with reason
 *  - See live stats (pending count, total amounts by status)
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Wallet, CheckCircle2, XCircle, Clock, AlertCircle,
    Loader2, RefreshCw, ChevronDown, Building2, CreditCard,
    Filter, Users, TrendingUp, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

// ── Types ─────────────────────────────────────────────────────────────
interface Withdrawal {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    amount: number;
    method: 'bank' | 'wallet';
    account_details: Record<string, string>;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    admin_notes: string | null;
    created_at: string;
    processed_at: string | null;
}

interface WithdrawalStats {
    pending:    { count: number; total: number };
    processing: { count: number; total: number };
    completed:  { count: number; total: number };
    rejected:   { count: number; total: number };
}

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'rejected';

// ── Helpers ───────────────────────────────────────────────────────────
const formatAmount = (n: number) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) =>
    new Date(d).toLocaleString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const STATUS_CONFIG = {
    pending:    { label: ta('قيد الانتظار', 'Pending'),   bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
    processing: { label: ta('قيد المعالجة', 'Processing'),   bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Loader2 },
    completed:  { label: ta('مكتمل', 'Completed'),           bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle2 },
    rejected:   { label: ta('مرفوض', 'Rejected'),           bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle },
} as const;

// ── Reject Modal ──────────────────────────────────────────────────────
function RejectModal({
    withdrawal,
    onConfirm,
    onClose,
    isLoading,
}: {
    withdrawal: Withdrawal;
    onConfirm: (reason: string) => void;
    onClose: () => void;
    isLoading: boolean;
}) {
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-xl">
                        <XCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{ta('رفض طلب السحب', 'Reject Withdrawal Request')}</h3>
                        <p className="text-sm text-gray-500">{withdrawal.user_name} — {formatAmount(withdrawal.amount)}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {ta('سبب الرفض', 'Rejection Reason')}<span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-red-300"
                        placeholder={ta('اكتب سبب الرفض ليصل إلى المستخدم...', 'Write rejection reason for the user...')}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {ta('إلغاء', 'Cancel')}
                    </Button>
                    <Button
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                        onClick={() => onConfirm(reason.trim())}
                        disabled={!reason.trim() || isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        رفض الطلب
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function AdminWithdrawalsPage() {
    const { dir } = useTranslation();
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [stats, setStats] = useState<WithdrawalStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<Withdrawal | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // ── Fetch ─────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [wRes, sRes] = await Promise.allSettled([
                api.getWithdrawals({
                    status: statusFilter === 'all' ? undefined : statusFilter,
                    page: currentPage,
                    per_page: 15,
                }),
                api.getWithdrawalStats(),
            ]);

            if (wRes.status === 'fulfilled' && wRes.value?.success) {
                const paginatedData = wRes.value.data;
                setWithdrawals(paginatedData?.data ?? paginatedData ?? []);
                setTotalPages(paginatedData?.last_page ?? 1);
            }
            if (sRes.status === 'fulfilled' && sRes.value?.success) {
                setStats(sRes.value.data);
            }
        } catch {
            toast.error(ta('حدث خطأ في تحميل طلبات السحب', 'Error loading withdrawals'));
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, currentPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Approve ───────────────────────────────────────────────────────
    const handleApprove = async (w: Withdrawal) => {
        setActionLoading(w.id);
        try {
            const res = await api.approveWithdrawal(w.id);
            if (res?.success) {
                toast.success(ta('تمت الموافقة على طلب السحب ✅', 'Withdrawal approved'));
                fetchData();
            }
        } catch (err: any) {
            toast.error(err.message ?? ta('فشلت عملية الموافقة', 'Approval failed'));
        } finally {
            setActionLoading(null);
        }
    };

    // ── Reject ────────────────────────────────────────────────────────
    const handleReject = async (reason: string) => {
        if (!rejectModal) return;
        setActionLoading(rejectModal.id);
        try {
            const res = await api.rejectWithdrawal(rejectModal.id, reason);
            if (res?.success) {
                toast.success(ta('تم رفض الطلب وإعادة الرصيد للمستخدم', 'Request rejected and balance refunded'));
                setRejectModal(null);
                fetchData();
            }
        } catch (err: any) {
            toast.error(err.message ?? ta('فشلت عملية الرفض', 'Rejection failed'));
        } finally {
            setActionLoading(null);
        }
    };

    // ── Filtered ──────────────────────────────────────────────────────
    const filtered = withdrawals.filter(w =>
        !search ||
        w.user_name.toLowerCase().includes(search.toLowerCase()) ||
        w.user_email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div dir={dir} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Wallet className="h-7 w-7 text-green-500" />
                        {ta('إدارة طلبات السحب', 'Manage Withdrawal Requests')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{ta('مراجعة وإدارة طلبات سحب أرباح الإحالة', 'Review and manage referral earnings withdrawal requests')}</p>
                </div>
                <Button variant="outline" onClick={fetchData} className="gap-2" disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {ta('تحديث', 'Update')}
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { key: 'pending',    label: ta('قيد الانتظار', 'Pending'), icon: Clock,
                          activeBorder: 'border-yellow-400', activeBg: 'bg-yellow-50', iconColor: 'text-yellow-500', countColor: 'text-yellow-600', totalColor: 'text-yellow-600' },
                        { key: 'processing', label: ta('قيد المعالجة', 'Processing'), icon: Loader2,
                          activeBorder: 'border-blue-400', activeBg: 'bg-blue-50', iconColor: 'text-blue-500', countColor: 'text-blue-600', totalColor: 'text-blue-600' },
                        { key: 'completed',  label: ta('مكتملة', 'Completed'), icon: CheckCircle2,
                          activeBorder: 'border-green-400', activeBg: 'bg-green-50', iconColor: 'text-green-500', countColor: 'text-green-600', totalColor: 'text-green-600' },
                        { key: 'rejected',   label: ta('مرفوضة', 'Rejected'), icon: XCircle,
                          activeBorder: 'border-red-400', activeBg: 'bg-red-50', iconColor: 'text-red-500', countColor: 'text-red-600', totalColor: 'text-red-600' },
                    ].map(({ key, label, icon: Icon, activeBorder, activeBg, iconColor, countColor, totalColor }) => {
                        const s = stats[key as keyof WithdrawalStats];
                        return (
                            <button
                                key={key}
                                onClick={() => { setStatusFilter(key as StatusFilter); setCurrentPage(1); }}
                                className={`p-4 rounded-xl border-2 text-start transition-all hover:scale-[1.02] ${
                                    statusFilter === key
                                        ? `${activeBorder} ${activeBg}`
                                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Icon className={`h-5 w-5 ${iconColor}`} />
                                    <span className={`text-2xl font-bold ${countColor}`}>{s.count}</span>
                                </div>
                                <p className="text-xs text-gray-500">{label}</p>
                                <p className={`text-sm font-semibold ${totalColor} mt-1`}>
                                    {formatAmount(s.total)}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Filters + Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={ta('ابحث بالاسم أو البريد الإلكتروني...', 'Search by name or email...')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pr-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400 shrink-0" />
                    {(['all', 'pending', 'completed', 'rejected'] as StatusFilter[]).map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                statusFilter === s
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {s === 'all' ? ta('الكل', 'All') : STATUS_CONFIG[s].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                        <p className="text-sm">{ta('جاري تحميل الطلبات...', 'Loading orders...')}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                        <Wallet className="h-12 w-12 opacity-30" />
                        <p className="font-medium text-gray-600">{ta('لا توجد طلبات سحب', 'No withdrawals')}</p>
                        <p className="text-sm">
                            {statusFilter === 'pending' ? ta('جميع الطلبات تمت معالجتها ✅', 'All requests processed ✅') : ta('لا توجد طلبات بهذا الفلتر', 'No orders match this filter') }
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-sm border-b dark:border-gray-700">
                                <tr>
                                    <th className="text-start p-4 font-semibold">{ta('المستخدم', 'User')}</th>
                                    <th className="text-start p-4 font-semibold">{ta('المبلغ', 'Amount')}</th>
                                    <th className="text-start p-4 font-semibold">{ta('طريقة السحب', 'Method')}</th>
                                    <th className="text-start p-4 font-semibold">{ta('تفاصيل الحساب', 'Account Details')}</th>
                                    <th className="text-start p-4 font-semibold">{ta('الحالة', 'Status')}</th>
                                    <th className="text-start p-4 font-semibold">{ta('التاريخ', 'Date')}</th>
                                    <th className="text-start p-4 font-semibold">{ta('الإجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(w => {
                                    const statusCfg = STATUS_CONFIG[w.status];
                                    const StatusIcon = statusCfg.icon;
                                    const isAction = actionLoading === w.id;

                                    return (
                                        <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                                            {/* User */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                        {w.user_name?.charAt(0) ?? '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-800">{w.user_name}</p>
                                                        <p className="text-xs text-gray-400">{w.user_email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Amount */}
                                            <td className="p-4">
                                                <span className="text-lg font-bold text-green-600">
                                                    {formatAmount(w.amount)}
                                                </span>
                                            </td>

                                            {/* Method */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {w.method === 'bank'
                                                        ? <Building2 className="h-4 w-4 text-blue-500" />
                                                        : <CreditCard className="h-4 w-4 text-purple-500" />
                                                    }
                                                    <span className="text-sm text-gray-700">
                                                        {w.method === 'bank' ? ta('تحويل بنكي', 'Bank Transfer') : ta('محفظة SERS', 'SERS Wallet') }
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Account Details */}
                                            <td className="p-4">
                                                {w.method === 'bank' && w.account_details ? (
                                                    <div className="text-xs text-gray-500 space-y-0.5">
                                                        {w.account_details.iban && (
                                                            <p className="font-mono">IBAN: {w.account_details.iban}</p>
                                                        )}
                                                        {w.account_details.account_holder && (
                                                            <p>اسم صاحب الحساب: {w.account_details.account_holder}</p>
                                                        )}
                                                        {w.account_details.bank_name && (
                                                            <p>البنك: {w.account_details.bank_name}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">{ta('محفظة SERS الداخلية', 'Internal Wallet')}</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                                    <StatusIcon className="h-3.5 w-3.5" />
                                                    {statusCfg.label}
                                                </span>
                                                {w.admin_notes && (
                                                    <p className="text-xs text-gray-400 mt-1 max-w-[160px] truncate" title={w.admin_notes}>
                                                        {w.admin_notes}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="p-4">
                                                <p className="text-xs text-gray-500">{formatDate(w.created_at)}</p>
                                                {w.processed_at && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        عُولج: {formatDate(w.processed_at)}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4">
                                                {w.status === 'pending' ? (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8 px-3"
                                                            onClick={() => handleApprove(w)}
                                                            disabled={isAction}
                                                        >
                                                            {isAction
                                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                : <CheckCircle2 className="h-3.5 w-3.5" />
                                                            }
                                                            موافقة
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5 h-8 px-3"
                                                            onClick={() => setRejectModal(w)}
                                                            disabled={isAction}
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            {ta('رفض', 'Reject')}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
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
                    <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-gray-500">
                            صفحة {currentPage} من {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                {ta('السابق', 'Previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                {ta('التالي', 'Next')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModal && (
                <RejectModal
                    withdrawal={rejectModal}
                    onConfirm={handleReject}
                    onClose={() => setRejectModal(null)}
                    isLoading={actionLoading === rejectModal.id}
                />
            )}
        </div>
    );
}
