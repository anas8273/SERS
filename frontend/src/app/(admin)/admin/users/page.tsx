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
import { EmptyState } from '@/components/ui/empty-state';
import {
    Users,
    Search,
    Download,
    Loader2,
    Shield,
    ShieldOff,
    UserCheck,
    UserX,
    Trash2,
    Edit,
    ChevronRight,
    ChevronLeft,
    Wallet,
} from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'user' | 'admin';
    is_active: boolean;
    wallet_balance: number;
    orders_count?: number;
    reviews_count?: number;
    created_at: string;
}

export default function AdminUsersPage() {
  const { dir } = useTranslation();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Wallet adjustment state
    const [walletModalUser, setWalletModalUser] = useState<AdminUser | null>(null);
    const [walletAmount, setWalletAmount] = useState('');
    const [walletType, setWalletType] = useState<'credit'|'debit'>('credit');
    const [walletDescription, setWalletDescription] = useState('');
    const [isAdjustingWallet, setIsAdjustingWallet] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.getAdminUsers(
                currentPage,
                searchQuery || '',
                roleFilter || ''
            );
            setUsers(response.data || []);
            setTotalPages(response.meta?.last_page || 1);
        } catch (error) {
            logger.error('Failed to fetch users:', error);
            toast.error(ta('فشل في جلب المستخدمين', 'Failed to fetch users'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [searchQuery, roleFilter, currentPage]);

    const handleToggleStatus = async (userId: string) => {
        try {
            const response = await api.toggleUserStatus(userId);
            if (response.success) {
                toast.success(response.message);
                setUsers(users.map((u) =>
                    u.id === userId ? { ...u, is_active: response.data.is_active } : u
                ));
            }
        } catch (error: any) {
            toast.error(error.message || ta('فشل في تغيير حالة المستخدم', 'Failed to change user status'));
        }
    };

    const handleToggleRole = async (userId: string) => {
        try {
            const response = await api.toggleUserRole(userId);
            if (response.success) {
                toast.success(response.message);
                setUsers(users.map((u) =>
                    u.id === userId ? { ...u, role: response.data.role } : u
                ));
            }
        } catch (error: any) {
            toast.error(error.message || ta('فشل في تغيير صلاحيات المستخدم', 'Failed to change user role'));
        }
    };

    const handleDelete = async (userId: string) => {
        try {
            const response = await api.deleteUser(userId);
            if (response.success) {
                toast.success(ta('تم حذف المستخدم بنجاح ✅', 'User deleted successfully ✅'));
                setUsers(users.filter((u) => u.id !== userId));
            }
        } catch (error: any) {
            toast.error(error.message || ta('فشل في حذف المستخدم', 'Failed to delete user'));
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleAdjustWallet = async () => {
        if (!walletModalUser || !walletAmount || Number(walletAmount) <= 0) {
            toast.error(ta('يرجى إدخال مبلغ صحيح', 'Please enter a valid amount'));
            return;
        }
        setIsAdjustingWallet(true);
        try {
            // Backend expects 'add'/'subtract', frontend uses 'credit'/'debit'
            const backendType = walletType === 'credit' ? 'add' : 'subtract';
            const response = await api.adjustUserWallet(walletModalUser.id, {
                amount: Number(walletAmount),
                type: backendType as any,
                description: walletDescription || (walletType === 'credit' ? ta('إضافة رصيد بواسطة الإدارة', 'Credit added by admin') : ta('خصم رصيد بواسطة الإدارة', 'Deducted by admin'))
            });
            if (response.success) {
                toast.success(ta('تم تعديل المحفظة بنجاح ✅', 'Wallet updated'));
                // Backend returns wallet_balance (not new_balance)
                const newBal = response.data?.wallet_balance ?? response.data?.new_balance;
                setUsers(users.map(u => 
                    u.id === walletModalUser.id 
                    ? { ...u, wallet_balance: newBal ?? u.wallet_balance } 
                    : u
                ));
                setWalletModalUser(null);
                setWalletAmount('');
                setWalletDescription('');
            } else {
                throw new Error(response.message);
            }
        } catch (error: any) {
            toast.error(error.message || ta('فشل في تعديل المحفظة', 'Failed to update wallet'));
        } finally {
            setIsAdjustingWallet(false);
        }
    };

    const formatDate = (date: string) => {
        return tDate(date);
    };

    // Export users to CSV
    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            // Create CSV content
            const csvContent = [
                [ta('الاسم', 'Name'), ta('البريد الإلكتروني', 'Email'), ta('الصلاحية', 'Role'), ta('الحالة', 'Status'), ta('عدد الطلبات', 'Order Count'), ta('تاريخ التسجيل', 'Registration')].join(','),
                ...users.map(user => [
                    user.name,
                    user.email,
                    user.role === 'admin' ? ta('مدير', 'Admin') : ta('مستخدم', 'User'),
                    user.is_active ? ta('نشط', 'Active') : ta('معطل', 'Disabled'),
                    user.orders_count ?? 0,
                    tDate(user.created_at)
                ].join(','))
            ].join('\n');

            // Add BOM for Arabic support
            const bom = '\uFEFF';
            const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success(ta('تم تصدير البيانات بنجاح ✅', 'Data exported'));
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
    const selectAll = () => setSelectedIds(new Set(users.map(u => u.id)));
    const deselectAll = () => setSelectedIds(new Set());
    const isAllSelected = users.length > 0 && users.every(u => selectedIds.has(u.id));

    const handleBulkDelete = async (idsToDelete?: Set<string>) => {
        const ids = idsToDelete ?? selectedIds;
        setIsBulkDeleting(true);
        let successCount = 0;
        await Promise.allSettled(
            Array.from(ids).map(async (id) => {
                try {
                    const response = await api.deleteUser(id);
                    if (response.success) successCount++;
                } catch {}
            })
        );
        setUsers(prev => prev.filter(u => !ids.has(u.id)));
        setSelectedIds(new Set());
        setShowBulkDeleteConfirm(false);
        setShowDeleteAllConfirm(false);
        setIsBulkDeleting(false);
        if (successCount > 0) toast.success(ta(`تم حذف ${successCount} مستخدم بنجاح`, `${successCount} users deleted`));
    };

    return (
        <div dir={dir} className="space-y-6 animate-fade-in">
            {/* ===== Premium Header ===== */}
            <div className="relative overflow-hidden bg-gradient-to-l from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50">
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl translate-x-8 translate-y-8" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <span className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                                <Users className="w-5 h-5" />
                            </span>
                            {ta('إدارة المستخدمين', 'User Management')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            عرض وإدارة جميع المستخدمين المسجلين ({users.length} مستخدم)
                        </p>
                    </div>
                    <Button
                        onClick={handleExportCSV}
                        disabled={isExporting || users.length === 0}
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

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={ta('بحث بالاسم أو البريد الإلكتروني...', 'Search by name or email...')}
                        className="pe-10 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl h-11"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="input-field max-w-[200px]"
                >
                    <option value="">{ta('جميع الصلاحيات', 'All Roles')}</option>
                    <option value="admin">{ta('المديرين فقط', 'Admins Only')}</option>
                    <option value="user">{ta('المستخدمين فقط', 'Users Only')}</option>
                </select>
            </div>

            {/* Bulk Actions */}
            <BulkActionBar
                selectedCount={selectedIds.size}
                totalCount={users.length}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onDeleteSelected={() => setShowBulkDeleteConfirm(true)}
                onDeleteAll={() => setShowDeleteAllConfirm(true)}
                isAllSelected={isAllSelected}
                entityName={ta("مستخدم", "users")}
            />

            {/* Users Table */}
            <div className="admin-card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-600 dark:text-gray-400">
                        <div className="animate-spin text-4xl mb-4">⏳</div>
                        <p>{ta('جاري تحميل المستخدمين...', 'Loading users...')}</p>
                    </div>
                ) : users.length === 0 ? (
                    <EmptyState
                        icon={<Users className="w-12 h-12 text-gray-400" />}
                        title={ta("لا يوجد مستخدمون", "No users")}
                        description="لم يتم العثور على مستخدمين مطابقين للبحث أو الفلتر"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="py-4 px-4 w-10">
                                        <input type="checkbox" checked={isAllSelected} onChange={isAllSelected ? deselectAll : selectAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer" />
                                    </th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{ta('المستخدم', 'User')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{ta('الصلاحية', 'Role')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{ta('الحالة', 'Status')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">{ta('الطلبات', 'Orders')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">{ta('الرصيد', 'Balance')}</th>
                                    <th className="text-start py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell">{ta('تاريخ التسجيل', 'Registration')}</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{ta('الإجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map((user) => (
                                    <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.has(user.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                        <td className="py-4 px-4">
                                            <input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer" />
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary flex-shrink-0">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-none">{user.name}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {user.role === 'admin' ? ta('👑 مدير', '👑 Admin') : ta('👤 مستخدم', '👤 User') }
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${user.is_active
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                }`}>
                                                {user.is_active ? ta('✅ نشط', '✅ Active') : ta('🚫 معطل', '🚫 Disabled') }
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">
                                            {user.orders_count ?? 0} طلب
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap hidden sm:table-cell">
                                            <span className={`font-bold text-sm ${Number(user.wallet_balance) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                {Number(user.wallet_balance || 0).toFixed(2)} ر.س
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1">
                                                {/* Toggle Status */}
                                                <button
                                                    onClick={() => handleToggleStatus(user.id)}
                                                    title={user.is_active ? ta('تعطيل', 'Deactivate') : ta('تفعيل', 'Activate') }
                                                    className={`p-2 rounded-lg transition-colors ${user.is_active
                                                        ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                        : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                        }`}
                                                >
                                                    {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                </button>

                                                {/* Toggle Role */}
                                                <button
                                                    onClick={() => handleToggleRole(user.id)}
                                                    title={user.role === 'admin' ? ta('تخفيض لمستخدم', 'Demote to User') : ta('ترقية لمدير', 'Promote to Admin') }
                                                    className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                >
                                                    {user.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                                </button>

                                                {/* Adjust Wallet */}
                                                <button
                                                    onClick={() => {
                                                        setWalletModalUser(user);
                                                        setWalletAmount('');
                                                        setWalletType('credit');
                                                    }}
                                                    title={ta("تعديل المحفظة", "Edit Wallet")}
                                                    className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                >
                                                    <Wallet className="w-4 h-4" />
                                                </button>

                                                {/* Delete */}
                                                {deleteConfirm === user.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                        >
                                                            {ta('تأكيد', 'Confirm')}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                                        >
                                                            {ta('إلغاء', 'Cancel')}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(user.id)}
                                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            {ta('السابق', 'Previous')}
                        </button>
                        <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
                            {currentPage} من {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            {ta('التالي', 'Next')}
                        </button>
                    </div>
                )}
            </div>

            {/* Bulk Delete Confirmations */}
            <ConfirmDialog
                open={showBulkDeleteConfirm}
                title={`حذف ${selectedIds.size} مستخدم`}
                message={`هل أنت متأكد من حذف ${selectedIds.size} مستخدم محدد؟ هذا الإجراء لا يمكن التراجع عنه.`}
                confirmLabel={ta("حذف المحدد", "Delete Selected")}
                variant="danger"
                isLoading={isBulkDeleting}
                onConfirm={handleBulkDelete}
                onCancel={() => setShowBulkDeleteConfirm(false)}
            />
            <ConfirmDialog
                open={showDeleteAllConfirm}
                title={ta("حذف جميع المستخدمين", "Delete All Users")}
                message={`هل أنت متأكد من حذف جميع المستخدمين (${users.length} مستخدم)؟ ⚠️ هذا الإجراء خطير جداً!`}
                confirmLabel={ta("حذف الكل", "Delete All")}
                variant="danger"
                isLoading={isBulkDeleting}
                onConfirm={() => handleBulkDelete(new Set(users.map(u => u.id)))}
                onCancel={() => setShowDeleteAllConfirm(false)}
            />

            {/* Wallet Adjustment Modal */}
            {walletModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                                <Wallet className="w-5 h-5 text-emerald-500" />
                                {ta('تعديل محفظة المستخدم', 'Edit User Wallet')}
                            </h3>
                            
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl mb-4 border border-gray-100 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400">{ta('المستخدم:', 'User:')}<span className="font-bold text-gray-900 dark:text-white">{walletModalUser.name}</span></p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{ta('الرصيد الحالي:', 'Current Balance:')}<span className="font-bold text-primary">{Number(walletModalUser.wallet_balance || 0).toFixed(2)} ر.س</span></p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{ta('نوع العملية', 'Operation Type')}</label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setWalletType('credit')}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-all ${walletType === 'credit' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-300'}`}
                                        >
                                            {ta('إضافة رصيد (+)', 'Add Balance (+)')}
                                        </button>
                                        <button 
                                            onClick={() => setWalletType('debit')}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-all ${walletType === 'debit' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-300'}`}
                                        >
                                            {ta('سحب رصيد (-)', 'Withdraw Balance (-)')}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">{ta('المبلغ (ر.س)', 'Amount (SAR)')}</label>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        value={walletAmount} 
                                        onChange={e => setWalletAmount(e.target.value)} 
                                        placeholder={ta('مثال: 50', 'Example: 50')} 
                                        className="h-11"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">{ta('السبب / الملاحظات (اختياري)', 'Reason / Notes (optional)')}</label>
                                    <Input 
                                        type="text" 
                                        value={walletDescription} 
                                        onChange={e => setWalletDescription(e.target.value)} 
                                        placeholder={ta('مثال: تعويض عن مشكلة تقنية', 'Example: Compensation for a technical issue')} 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700">
                            <Button 
                                variant="outline" 
                                onClick={() => setWalletModalUser(null)}
                                disabled={isAdjustingWallet}
                            >
                                {ta('إلغاء', 'Cancel')}
                            </Button>
                            <Button 
                                onClick={handleAdjustWallet}
                                disabled={isAdjustingWallet || !walletAmount || Number(walletAmount) <= 0}
                                className={walletType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                            >
                                {isAdjustingWallet ? <Loader2 className="w-4 h-4 animate-spin" /> : ta('تنفيذ العملية', 'Execute Operation') }
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
