'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

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
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

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
            console.error('Failed to fetch users:', error);
            toast.error('فشل في جلب المستخدمين');
        } finally {
            setIsLoading(false);
        }
    };

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
            toast.error(error.message || 'فشل في تغيير حالة المستخدم');
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
            toast.error(error.message || 'فشل في تغيير صلاحيات المستخدم');
        }
    };

    const handleDelete = async (userId: string) => {
        try {
            const response = await api.deleteUser(userId);
            if (response.success) {
                toast.success('تم حذف المستخدم بنجاح ✅');
                setUsers(users.filter((u) => u.id !== userId));
            }
        } catch (error: any) {
            toast.error(error.message || 'فشل في حذف المستخدم');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Export users to CSV
    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            // Create CSV content
            const csvContent = [
                ['الاسم', 'البريد الإلكتروني', 'الصلاحية', 'الحالة', 'عدد الطلبات', 'تاريخ التسجيل'].join(','),
                ...users.map(user => [
                    user.name,
                    user.email,
                    user.role === 'admin' ? 'مدير' : 'مستخدم',
                    user.is_active ? 'نشط' : 'معطل',
                    user.orders_count ?? 0,
                    new Date(user.created_at).toLocaleDateString('ar-SA')
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
            toast.success('تم تصدير البيانات بنجاح ✅');
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين 👥</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">عرض وإدارة جميع المستخدمين المسجلين</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={isExporting || users.length === 0}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                    {isExporting ? (
                        <><span className="animate-spin">⏳</span> جاري التصدير...</>
                    ) : (
                        <><span>📥</span> تصدير CSV</>
                    )}
                </button>
            </div>

            {/* Filters */}
            <div className="admin-card flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 بحث بالاسم أو البريد..."
                        className="w-full input-field"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="input-field max-w-[200px]"
                >
                    <option value="">جميع الصلاحيات</option>
                    <option value="admin">المديرين فقط</option>
                    <option value="user">المستخدمين فقط</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="admin-card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-600 dark:text-gray-400">
                        <div className="animate-spin text-4xl mb-4">⏳</div>
                        <p>جاري تحميل المستخدمين...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">لا يوجد مستخدمون</h3>
                        <p>لم يتم العثور على مستخدمين مطابقين</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-right py-4 px-6 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">المستخدم</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">الصلاحية</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">الحالة</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">الطلبات</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell">تاريخ التسجيل</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
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
                                                {user.role === 'admin' ? '👑 مدير' : '👤 مستخدم'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${user.is_active
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                }`}>
                                                {user.is_active ? '✅ نشط' : '🚫 معطل'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">
                                            {user.orders_count ?? 0} طلب
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1">
                                                {/* Toggle Status */}
                                                <button
                                                    onClick={() => handleToggleStatus(user.id)}
                                                    title={user.is_active ? 'تعطيل' : 'تفعيل'}
                                                    className={`p-2 rounded-lg transition-colors ${user.is_active
                                                        ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                        : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                        }`}
                                                >
                                                    {user.is_active ? '🚫' : '✅'}
                                                </button>

                                                {/* Toggle Role */}
                                                <button
                                                    onClick={() => handleToggleRole(user.id)}
                                                    title={user.role === 'admin' ? 'تخفيض لمستخدم' : 'ترقية لمدير'}
                                                    className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                >
                                                    {user.role === 'admin' ? '⬇️' : '⬆️'}
                                                </button>

                                                {/* Edit User */}
                                                <Link href={`/admin/users/${user.id}/edit`}>
                                                    <button
                                                        title="تعديل"
                                                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    >
                                                        ✏️
                                                    </button>
                                                </Link>

                                                {/* Delete */}
                                                {deleteConfirm === user.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                        >
                                                            تأكيد
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                                        >
                                                            إلغاء
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(user.id)}
                                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        🗑️
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
                            السابق
                        </button>
                        <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
                            {currentPage} من {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            التالي
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
