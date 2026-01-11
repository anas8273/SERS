'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, fetchUser } = useAuthStore();

    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Profile form
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Password form
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                phone: user.phone || '',
            });
            setAvatarPreview(user.avatar_url || null);
        }
    }, [user]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('حجم الصورة يجب أن يكون أقل من 2MB');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            if (profileData.phone) {
                formData.append('phone', profileData.phone);
            }
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            // Note: This requires a backend endpoint
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                toast.success('تم تحديث الملف الشخصي بنجاح ✅');
                fetchUser(); // Refresh user data
            } else {
                toast.error(data.message || 'فشل في تحديث الملف الشخصي');
            }
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast.error('فشل في تحديث الملف الشخصي');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            toast.error('كلمات المرور غير متطابقة');
            return;
        }

        if (passwordData.new_password.length < 8) {
            toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }

        setIsSubmitting(true);

        try {
            // Note: This requires a backend endpoint
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password,
                    new_password_confirmation: passwordData.new_password_confirmation,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('تم تغيير كلمة المرور بنجاح ✅');
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: '',
                });
            } else {
                toast.error(data.message || 'فشل في تغيير كلمة المرور');
            }
        } catch (error: any) {
            console.error('Password change error:', error);
            toast.error('فشل في تغيير كلمة المرور');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
            <Navbar />

            <main className="flex-1 pt-8 pb-16">
                <div className="max-w-2xl mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الإعدادات ⚙️</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">إدارة معلومات حسابك</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'profile'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            👤 الملف الشخصي
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'password'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            🔒 كلمة المرور
                        </button>
                    </div>

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                {/* Avatar */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                        {avatarPreview ? (
                                            <Image
                                                src={avatarPreview}
                                                alt="Avatar"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-3xl font-bold">
                                                {user?.name?.charAt(0) || '؟'}
                                            </div>
                                        )}
                                    </div>
                                    <label className="cursor-pointer text-sm text-primary-600 dark:text-primary-400 hover:underline">
                                        تغيير الصورة
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        الاسم الكامل
                                    </label>
                                    <Input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        placeholder="أدخل اسمك"
                                        required
                                        className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        البريد الإلكتروني
                                    </label>
                                    <Input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 dark:text-gray-400"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        لا يمكن تغيير البريد الإلكتروني
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        رقم الهاتف (اختياري)
                                    </label>
                                    <Input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        placeholder="+966500000000"
                                        className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                                >
                                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        كلمة المرور الحالية
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        placeholder="••••••••"
                                        required
                                        className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        كلمة المرور الجديدة
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                        className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        يجب أن تكون 8 أحرف على الأقل
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        تأكيد كلمة المرور الجديدة
                                    </label>
                                    <Input
                                        type="password"
                                        value={passwordData.new_password_confirmation}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                        className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                                >
                                    {isSubmitting ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* Danger Zone */}
                    <div className="mt-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">منطقة خطر ⚠️</h3>
                        <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                            حذف حسابك سيزيل جميع بياناتك نهائياً ولا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <Button
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => toast.error('هذه الميزة غير متاحة حالياً')}
                        >
                            حذف الحساب
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
