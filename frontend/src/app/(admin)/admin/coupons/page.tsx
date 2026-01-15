'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

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
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
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
            setCoupons(res.data.data);
        } catch (error) {
            toast.error('فشل تحميل الكوبونات');
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
            toast.success('تم إنشاء الكوبون بنجاح');
            setIsCreating(false);
            setNewCoupon({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', expires_at: '' });
            fetchCoupons();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'فشل إنشاء الكوبون');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
        try {
            await api.deleteCoupon(id);
            toast.success('تم حذف الكوبون');
            fetchCoupons();
        } catch (error) {
            toast.error('فشل حذف الكوبون');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">أكواد الخصم 🎫</h1>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    {isCreating ? 'إلغاء' : 'إضافة كوبون جديد +'}
                </Button>
            </div>

            {isCreating && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-fade-in">
                    <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">الكود</label>
                            <Input
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                placeholder="مثال: SAVE20"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">النوع</label>
                            <select
                                className="w-full p-2 rounded-md border bg-background dark:bg-gray-700 dark:border-gray-600"
                                value={newCoupon.discount_type}
                                onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value as any })}
                            >
                                <option value="percentage">نسبة مئوية (%)</option>
                                <option value="fixed">مبلغ ثابت (ر.س)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">القيمة</label>
                            <Input
                                type="number"
                                value={newCoupon.discount_value}
                                onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                placeholder="20"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">تاريخ الانتهاء</label>
                            <Input
                                type="date"
                                value={newCoupon.expires_at}
                                onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Button type="submit" className="w-full">حفظ الكوبون</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="p-4">الكود</th>
                                <th className="p-4">الخصم</th>
                                <th className="p-4">الاستخدامات</th>
                                <th className="p-4">الحالة</th>
                                <th className="p-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center">جاري التحميل...</td></tr>
                            ) : coupons.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">لا توجد أكواد خصم</td></tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 font-mono font-bold text-primary-600 dark:text-primary-400">{coupon.code}</td>
                                        <td className="p-4 text-gray-900 dark:text-gray-200">
                                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} ر.س`}
                                        </td>
                                        <td className="p-4 text-gray-900 dark:text-gray-200">
                                            {coupon.used_count} / {coupon.max_uses || '∞'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${coupon.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                {coupon.is_active ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                                onClick={() => handleDelete(coupon.id)}
                                            >
                                                حذف
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
