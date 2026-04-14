'use client';
import { ta } from '@/i18n/auto-translations';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Wallet, Plus, Minus } from 'lucide-react';

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
        phone: '',
        role: 'user',
        is_active: true,
        password: '',
    });

    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [walletAmount, setWalletAmount] = useState('');
    const [walletType, setWalletType] = useState<'add' | 'subtract'>('add');
    const [walletDesc, setWalletDesc] = useState('');
    const [walletLoading, setWalletLoading] = useState(false);

    useEffect(() => {
        if (isEditMode && userId) {
            const fetchUser = async () => {
                try {
                    const res = await api.getAdminUser(userId) as any;
                    const user = res.data;
                    setFormData({
                        name: user.name,
                        email: user.email,
                        phone: user.phone || '',
                        role: user.role,
                        is_active: user.is_active,
                        password: '',
                    });
                    setWalletBalance(Number(user.wallet_balance ?? 0));
                } catch (error) {
                    toast.error(ta('فشل تحميل بيانات المستخدم', 'Failed to load user data'));
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
                phone: formData.phone || null,
                role: formData.role,
                is_active: formData.is_active,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            if (isEditMode && userId) {
                await api.updateAdminUser(userId, payload);
                toast.success(ta('تم تحديث المستخدم بنجاح! ✅', 'User updated successfully! ✅'));
            } else {
                toast.error(ta('إنشاء مستخدم غير مدعوم حالياً من هذه الصفحة', 'Creating users is not supported from this page'));
            }

            router.push('/admin/users');
            router.refresh();

        } catch (error: any) {
            logger.error(error);
            const msg = error.response?.data?.message || 'حدث خطأ أثناء الحفظ';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWalletAdjust = async () => {
        const amount = Number(walletAmount);
        if (!amount || amount <= 0) { toast.error(ta('أدخل مبلغاً صحيحاً', 'Enter a valid amount')); return; }
        if (!walletDesc.trim()) { toast.error(ta('أدخل وصف العملية', 'Enter operation description')); return; }

        setWalletLoading(true);
        try {
            const res = await api.post(`/admin/users/${userId}/wallet-adjust`, {
                amount,
                type: walletType,
                description: walletDesc,
            }) as any;
            if (res?.success) {
                // [AUDIT FIX P2-5.1] Backend returns wallet_balance, not new_balance
                toast.success(walletType === 'add' ? `تمت إضافة ${amount} ر.س للمحفظة` : `تم خصم ${amount} ر.س من المحفظة`);
                setWalletBalance(Number(res?.data?.wallet_balance ?? (walletBalance ?? 0) + (walletType === 'add' ? amount : -amount)));
                setWalletAmount('');
                setWalletDesc('');
            }
        } catch (err: any) {
            toast.error(err.message || 'فشلت العملية');
        } finally {
            setWalletLoading(false);
        }
    };

    return (
        <div className="space-y-6">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* الاسم */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ta('الاسم', 'Name')}</label>
                    <input
                        required
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                {/* البريد الإلكتروني */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ta('البريد الإلكتروني', 'Email')}</label>
                    <input
                        required
                        type="email"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                {/* [AUDIT FIX P3-5.2] رقم الهاتف — backend supports phone but it was missing from UI */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ta('رقم الهاتف', 'Phone Number')}</label>
                    <input
                        type="tel"
                        dir="ltr"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="05xxxxxxxx"
                    />
                </div>

                {/* كلمة المرور */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {ta('كلمة المرور', 'Password')} {isEditMode && <span className="text-xs text-gray-400">{ta('(اتركها فارغة إذا لم ترد تغييرها)', '(Leave blank to keep current)')}</span>}
                    </label>
                    <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        minLength={8}
                    />
                </div>

                {/* الصلاحية */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ta('الصلاحية', 'Permission/Role')}</label>
                    <select
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="user">{ta('مستخدم عادي', 'Regular User')}</option>
                        <option value="admin">{ta('مدير (Admin)', 'Admin')}</option>
                    </select>
                </div>
            </div>

            <div className="mb-8">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{ta('حساب نشط', 'Active Account')}</span>
                </label>
            </div>

            <div className="flex justify-end pt-6 border-t dark:border-gray-700">
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-8 py-3 rounded-xl text-white font-medium shadow-lg transition-all ${isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary/90 hover:shadow-xl transform hover:-translate-y-0.5'
                        }`}
                >
                    {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
            </div>
        </form>

        {/* ── Wallet Management (edit mode only) ── */}
        {isEditMode && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    إدارة المحفظة
                    {walletBalance !== null && (
                        <span className="mr-auto text-sm font-normal text-gray-500 dark:text-gray-400">
                            {ta('الرصيد الحالي:', 'Current Balance:')}<span className="font-bold text-primary">{walletBalance.toFixed(2)} ر.س</span>
                        </span>
                    )}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Type */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setWalletType('add')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${walletType === 'add' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                        >
                            <Plus className="w-4 h-4" /> {ta('إضافة', 'Add')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setWalletType('subtract')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${walletType === 'subtract' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                        >
                            <Minus className="w-4 h-4" /> {ta('خصم', 'Discount')}
                        </button>
                    </div>

                    {/* Amount */}
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="المبلغ (ر.س)"
                        value={walletAmount}
                        onChange={e => setWalletAmount(e.target.value)}
                        className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />

                    {/* Description */}
                    <input
                        type="text"
                        placeholder="وصف العملية (مطلوب)"
                        value={walletDesc}
                        onChange={e => setWalletDesc(e.target.value)}
                        className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        type="button"
                        onClick={handleWalletAdjust}
                        disabled={walletLoading}
                        className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all ${
                            walletLoading ? 'bg-gray-400 cursor-not-allowed' :
                            walletType === 'add' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                        }`}
                    >
                        {walletLoading ? 'جاري التنفيذ...' : walletType === 'add' ? 'إضافة رصيد' : 'خصم رصيد'}
                    </button>
                </div>
            </div>
        )}
        </div>
    );
}
