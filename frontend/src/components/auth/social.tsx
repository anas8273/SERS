'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface SocialProps {
    isPending?: boolean;
}

/**
 * Social Login Component
 * 
 * تسجيل الدخول عبر Google باستخدام Firebase Authentication
 * ثم إرسال الـ ID Token للـ Laravel Backend للتحقق وإنشاء جلسة Sanctum
 */
export const Social = ({ isPending }: SocialProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { checkAuth } = useAuthStore();

    const handleGoogleLogin = async () => {
        if (isLoading || isPending) return;

        setIsLoading(true);

        try {
            // 1. تسجيل الدخول عبر Firebase Popup
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, provider);

            // 2. الحصول على ID Token
            const idToken = await result.user.getIdToken();

            // 3. إرسال التوكن للـ Backend
            const response = await api.socialLogin(idToken);

            if (response.success) {
                toast.success('تم تسجيل الدخول بنجاح! 🎉');

                // تحديث حالة المستخدم
                await checkAuth();

                // إعادة التوجيه
                router.push('/dashboard');
                router.refresh();
            } else {
                throw new Error(response.message || 'فشل تسجيل الدخول');
            }

        } catch (error: unknown) {
            console.error('Google login error:', error);

            // التعامل مع أخطاء Firebase
            const errorMessage = error instanceof Error
                ? error.message
                : 'حدث خطأ أثناء تسجيل الدخول';

            // رسائل خطأ مخصصة
            if (errorMessage.includes('popup-closed')) {
                toast.error('تم إغلاق نافذة تسجيل الدخول');
            } else if (errorMessage.includes('network')) {
                toast.error('خطأ في الاتصال بالإنترنت');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center w-full gap-x-2">
            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || isPending}
                className="
                    w-full flex items-center justify-center gap-3
                    px-4 py-3 rounded-xl
                    border-2 border-gray-200
                    bg-white hover:bg-gray-50
                    text-gray-700 font-medium
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:border-gray-300 hover:shadow-sm
                "
            >
                {isLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-600"></div>
                        <span>جاري التسجيل...</span>
                    </>
                ) : (
                    <>
                        <FcGoogle className="h-5 w-5" />
                        <span>تسجيل الدخول بـ Google</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default Social;
