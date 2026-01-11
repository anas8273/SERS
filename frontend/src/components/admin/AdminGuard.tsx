'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface AdminGuardProps {
    children: React.ReactNode;
}

/**
 * AdminGuard - حماية صفحات الإدارة
 * 
 * يتحقق من أن المستخدم مسجل دخوله وله صلاحيات admin
 * إذا لم يكن كذلك، يتم إعادة توجيهه للصفحة الرئيسية
 */
export function AdminGuard({ children }: AdminGuardProps) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, checkAuth, _hasHydrated } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    // Check if user is admin (case-insensitive)
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    useEffect(() => {
        const verifyAuth = async () => {
            // Wait for hydration from localStorage
            if (!_hasHydrated) return;

            // If we have a token/user from localStorage, verify it's still valid
            if (isAuthenticated && user) {
                // Quick check - if user is admin, we're good
                if (isAdmin) {
                    setIsChecking(false);
                    return;
                }
            }

            // No cached auth or not admin, check with server
            try {
                await checkAuth();
            } catch {
                // Error handled in checkAuth
            }

            setIsChecking(false);
        };

        verifyAuth();
    }, [_hasHydrated]); // Only run when hydration completes

    useEffect(() => {
        // Handle redirects after auth check is complete
        if (!isChecking && !isLoading && _hasHydrated) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (!isAdmin) {
                router.push('/');
            }
        }
    }, [isChecking, isLoading, isAuthenticated, isAdmin, router, _hasHydrated]);

    // Show loading while checking (hydration + auth check)
    if (!_hasHydrated || isChecking || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    // After check complete - if not admin, show unauthorized
    if (!isAuthenticated || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h1>
                    <p className="text-gray-600">ليس لديك صلاحية للوصول لهذه الصفحة</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

export default AdminGuard;

