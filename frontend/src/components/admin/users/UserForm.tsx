'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface UserFormProps {
    userId?: string;
}

export default function UserForm({ userId }: UserFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = !!userId;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
        is_active: true,
        password: '',
    });

    useEffect(() => {
        if (isEditMode && userId) {
            const fetchUser = async () => {
                try {
                    const res = await api.getAdminUser(userId);
                    const user = res.data;
                    setFormData({
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        is_active: user.is_active,
                        password: '', // Password stays empty unless changed
                    });
                } catch (error) {
                    toast.error('فشل تحميل بيانات المستخدم');
                }
            };
            fetchUser();
        }
    }, [isEditMode, userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload: any = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                is_active: formData.is_active,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            if (isEditMode && userId) {
                await api.updateAdminUser(userId, payload);
                toast.success('تم تحديث المستخدم بنجاح! ✅');
            } else {
                // Not implementing create user here as it wasn't requested, but logic would go here
                toast.error('إنشاء مستخدم غير مدعوم حالياً من هذه الصفحة');
            }

            router.push('/admin/users');
            router.refresh();

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'حدث خطأ أثناء الحفظ';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* الاسم */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الاسم</label>
                    <input
                        required
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                {/* البريد الإلكتروني */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني</label>
                    <input
                        required
                        type="email"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                {/* كلمة المرور */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        كلمة المرور {isEditMode && <span className="text-xs text-gray-400">(اتركها فارغة إذا لم ترد تغييرها)</span>}
                    </label>
                    <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        minLength={8}
                    />
                </div>

                {/* الصلاحية */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الصلاحية</label>
                    <select
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="user">مستخدم عادي</option>
                        <option value="admin">مدير (Admin)</option>
                    </select>
                </div>
            </div>

            <div className="mb-8">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">حساب نشط</span>
                </label>
            </div>

            <div className="flex justify-end pt-6 border-t dark:border-gray-700">
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-8 py-3 rounded-xl text-white font-medium shadow-lg transition-all ${isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 hover:shadow-xl transform hover:-translate-y-0.5'
                        }`}
                >
                    {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
            </div>
        </form>
    );
}
