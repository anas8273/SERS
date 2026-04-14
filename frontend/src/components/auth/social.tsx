'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';

interface SocialProps {
    isPending?: boolean;
}

/**
 * Social Login Component
 * 
 * تسجيل الدخول عبر Google باستخدام Firebase Authentication
 * ثم إرسال الـ ID Token للـ Laravel Backend للتحقق وإنشاء جلسة Sanctum
 * 
 * FIX: Now uses authStore.socialLogin() to properly save token to localStorage
 * before any subsequent API calls or navigation.
 */
export const Social = ({ isPending }: SocialProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { socialLogin } = useAuthStore();
    const { t } = useTranslation();

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
            let idToken = await result.user.getIdToken();

            // 3. تسجيل الدخول عبر الـ Backend وحفظ التوكن في Store
            try {
                await socialLogin(idToken);
            } catch (firstError: any) {
                // [FIX] If backend says "invalid_token" with hint "force_refresh",
                // get a FRESH token from Firebase and retry ONCE.
                const backendHint = firstError?.response?.data?.hint;
                const backendError = firstError?.response?.data?.error;
                
                if (backendError === 'invalid_token' && backendHint === 'force_refresh') {
                    // Force Firebase to issue a brand-new token (bypasses cache)
                    idToken = await result.user.getIdToken(true);
                    await socialLogin(idToken); // Retry with fresh token
                } else {
                    throw firstError; // Not a token issue — re-throw
                }
            }

            toast.success(t('auth.login.success'));

            // 4. Hard navigation to ensure fresh page load with auth state
            // Using window.location instead of router.push prevents white-page
            // caused by hydration conflicts when auth state hasn't fully propagated
            const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
            window.location.href = returnUrl || '/dashboard';

        } catch (error: any) {
            // ─── Elegant Error Handling (Zero White-Screen Policy) ───
            const code = error?.code || '';
            const statusCode = error?.response?.status;
            const backendMessage = error?.response?.data?.message;
            
            if (code === 'auth/popup-closed-by-user' || error?.message?.includes('popup-closed')) {
                // User intentionally cancelled, show a polite info toast (not a red error)
                toast(t('auth.social.popupClosed'), {
                    icon: 'ℹ️',
                    duration: 3000,
                    style: { background: '#333', color: '#fff' }
                });
            } else if (code === 'auth/network-request-failed' || error?.message?.includes('network')) {
                toast.error(t('auth.social.networkError'));
            } else if (statusCode === 401) {
                // Backend STILL rejected the token after retry
                // → Force sign-out from Firebase to clear stale tokens
                try { await auth.signOut(); } catch { /* ignore */ }
                toast.error(backendMessage || t('toast.errorRetry'));
            } else if (statusCode === 429) {
                toast.error(t('toast.rateLimited'));
            } else {
                toast.error(backendMessage || error?.message || t('auth.login.invalidCredentials'));
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
                        <div className="animate-pulse w-5 h-5 rounded-lg bg-gray-600/20"></div>
                        <span>{t('auth.social.signing')}</span>
                    </>
                ) : (
                    <>
                        <FcGoogle className="h-5 w-5" />
                        <span>{t('auth.social.google')}</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default Social;
