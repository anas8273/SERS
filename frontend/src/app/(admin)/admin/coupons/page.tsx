'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ta, tDate } from '@/i18n/auto-translations';
import {
    Ticket,
    Plus,
    Trash2,
    Copy,
    Percent,
    DollarSign,
    Calendar,
    CheckCircle,
    XCircle,
    TrendingUp,
    Clock,
    Loader2,
    Search,
    Hash,
    Users,
    X,
} from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses: number;
    used_count: number;
    expires_at: string | null;
    is_active: boolean;
}

export default function AdminCouponsPage() {
  const { dir } = useTranslation();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newCoupon, setNewCoupon] = useState<{
        code: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: string;
        max_uses: string;
        expires_at: string;
    }>({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        max_uses: '',
        expires_at: '',
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await api.getAdminCoupons();
            // null-safe: backend may wrap in data.data or return array directly
            const list = res?.data?.data ?? res?.data ?? [];
            setCoupons(Array.isArray(list) ? list : []);
        } catch (error) {
            toast.error(ta('فشل تحميل الكوبونات', 'Failed to load coupons'));
        } finally {
            setIsLoading(false);
        }
    };


    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createCoupon({
                ...newCoupon,
                discount_value: Number(newCoupon.discount_value),
                max_uses: newCoupon.max_uses ? Number(newCoupon.max_uses) : undefined,
            });
            toast.success(ta('تم إنشاء الكوبون بنجاح 🎉', 'Coupon created successfully 🎉'));
            setIsCreating(false);
            setNewCoupon({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', expires_at: '' });
            fetchCoupons();
        } catch (error: any) {
            toast.error(error.response?.data?.message || ta('فشل إنشاء الكوبون', 'Failed to create coupon'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(ta('هل أنت متأكد من حذف هذا الكوبون؟', 'Are you sure you want to delete this coupon?'))) return;
        try {
            await api.deleteCoupon(id);
            toast.success(ta('تم حذف الكوبون', 'Coupon deleted'));
            setCoupons(coupons.filter(c => c.id !== id));
        } catch (error) {
            toast.error(ta('فشل حذف الكوبون', 'Failed to delete coupon'));
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(ta(`تم نسخ الكود: ${code}`, `Code copied: ${code}`));
    };

    // Stats
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.is_active).length;
    const totalUsed = coupons.reduce((sum, c) => sum + c.used_count, 0);
    const expiredCoupons = coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length;

    // Filter
    const filteredCoupons = coupons.filter(c =>
        !searchQuery || c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* ===== Premium Header ===== */}
            <div className="relative overflow-hidden bg-gradient-to-l from-violet-500/5 via-purple-500/5 to-indigo-500/5 dark:from-violet-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl translate-x-8 translate-y-8" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <span className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-violet-500/20">
                                <Ticket className="w-5 h-5" />
                            </span>
                            {ta('أكواد الخصم', 'Discount Codes')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            {ta('إنشاء وإدارة أكواد الخصم', 'Create and manage discount codes')} ({totalCoupons} {ta('كوبون', 'coupons')})
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreating(!isCreating)}
                        className={isCreating
                            ? 'bg-gray-500 hover:bg-gray-600 text-white rounded-xl gap-2'
                            : 'bg-gradient-to-l from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5 rounded-xl gap-2'
                        }
                    >
                        {isCreating ? <><X className="w-4 h-4" /> {ta('إلغاء', 'Cancel')}</> : <><Plus className="w-4 h-4" />{ta('كوبون جديد', 'New Coupon')}</>}
                    </Button>
                </div>
            </div>

            {/* ===== Stats Grid ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-violet-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                        <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{totalCoupons}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('إجمالي الكوبونات', 'Total Coupons')}</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-green-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{activeCoupons}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('كوبونات نشطة', 'Active Coupons')}</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-blue-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{totalUsed}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('مرات الاستخدام', 'Total Uses')}</p>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-red-500/5 transition-all hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{expiredCoupons}</p>
                        <p className="text-xs text-gray-500 font-medium">{ta('منتهية الصلاحية', 'Expired')}</p>
                    </div>
                </div>
            </div>

            {/* ===== Create Form ===== */}
            {isCreating && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-violet-200 dark:border-violet-900/50 p-6 shadow-lg shadow-violet-500/5 animate-fade-in">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-violet-500" />
                        {ta('إنشاء كوبون جديد', 'Create New Coupon')}
                    </h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                                <Hash className="w-3.5 h-3.5 text-gray-400" /> {ta('الكود', 'Code')}
                            </label>
                            <Input
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                placeholder="SAVE20"
                                required
                                dir="ltr"
                                className="font-mono font-bold dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                                <Percent className="w-3.5 h-3.5 text-gray-400" /> {ta('النوع', 'Type')}
                            </label>
                            <select
                                className="w-full h-10 px-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                value={newCoupon.discount_type}
                                onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value as any })}
                            >
                                <option value="percentage">{ta('نسبة مئوية (%)', 'Percentage (%)')}</option>
                                <option value="fixed">{ta('مبلغ ثابت (ر.س)', 'Fixed Amount (SAR)')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-gray-400" /> {ta('القيمة', 'Value')}
                            </label>
                            <Input
                                type="number"
                                value={newCoupon.discount_value}
                                onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                placeholder="20"
                                required
                                className="dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" /> {ta('تاريخ الانتهاء', 'Expiry Date')}
                            </label>
                            <Input
                                type="date"
                                value={newCoupon.expires_at}
                                onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                                className="dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" className="w-full bg-gradient-to-l from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl gap-2 h-10">
                                <CheckCircle className="w-4 h-4" /> {ta('حفظ', 'Save')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* ===== Search ===== */}
            <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder={ta('بحث بكود الخصم...', 'Search by coupon code...' )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl h-11"
                />
            </div>

            {/* ===== Coupons List ===== */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-5 animate-pulse">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
                    <Ticket className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{ta('لا توجد أكواد خصم', 'No discount codes found')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{ta('أنشئ كوبون جديد للبدء', 'Create a new coupon to get started')}</p>
                    <Button onClick={() => setIsCreating(true)} className="rounded-xl gap-2">
                        <Plus className="w-4 h-4" /> {ta('إنشاء كوبون', 'Create Coupon')}
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCoupons.map((coupon) => {
                        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                        return (
                            <div
                                key={coupon.id}
                                className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
                                    !coupon.is_active || isExpired
                                        ? 'border-gray-200 dark:border-gray-700 opacity-75'
                                        : 'border-violet-100 dark:border-violet-900/30'
                                }`}
                            >
                                {/* Color Bar */}
                                <div className={`h-1 ${coupon.is_active && !isExpired ? 'bg-gradient-to-l from-violet-500 to-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`} />

                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${
                                                coupon.discount_type === 'percentage'
                                                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20'
                                                    : 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/20'
                                            }`}>
                                                {coupon.discount_type === 'percentage' ? (
                                                    <Percent className="w-5 h-5" />
                                                ) : (
                                                    <DollarSign className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-mono font-black text-lg text-gray-900 dark:text-white" dir="ltr">
                                                        {coupon.code}
                                                    </h3>
                                                    <button
                                                        onClick={() => copyCode(coupon.code)}
                                                        className="p-1 text-gray-400 hover:text-violet-500 transition-colors"
                                                        title={ta("نسخ الكود", "Copy Code")}
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
                                                    {ta('خصم', 'Discount')} {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} ${ta('ر.س', 'SAR')}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            {coupon.is_active && !isExpired ? (
                                                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold gap-1">
                                                    <CheckCircle className="w-3 h-3" /> {ta('نشط', 'Active')}
                                                </Badge>
                                            ) : isExpired ? (
                                                <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold gap-1">
                                                    <Clock className="w-3 h-3" /> {ta('منتهي', 'Expired')}
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold gap-1">
                                                    <XCircle className="w-3 h-3" /> {ta('معطّل', 'Disabled')}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Row */}
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {coupon.used_count} / {coupon.max_uses || '∞'} {ta('استخدام', 'uses')}
                                            </span>
                                            {coupon.expires_at && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {tDate(coupon.expires_at)}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteConfirmId(coupon.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl h-7 px-2 gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" /> {ta('حذف', 'Delete')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        
            <ConfirmDialog
                open={!!deleteConfirmId}
                title={ta('تأكيد الحذف', 'Confirm Delete')}
                message={ta('هل أنت متأكد من حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure you want to permanently delete this item? This action cannot be undone.')}
                confirmLabel={ta('حذف نهائياً', 'Delete Permanently')}
                onConfirm={() => {
                    if (deleteConfirmId) handleDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                }}
                onCancel={() => setDeleteConfirmId(null)}
            />
        </div>
    );
}
