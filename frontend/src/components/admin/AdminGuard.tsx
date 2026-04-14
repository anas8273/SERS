'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { EmptyState } from '@/components/ui/empty-state';
import { useTranslation } from '@/i18n/useTranslation';
import { clearAuthCookies } from '@/lib/auth-helpers';

interface AdminGuardProps {
    children: React.ReactNode;
}

/**
 * AdminGuard — protects all /admin/* routes.
 * Checks that the user is authenticated and has the 'admin' role.
 */
export function AdminGuard({ children }: AdminGuardProps) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, checkAuth, _hasHydrated } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);
    const { t } = useTranslation();

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
                // [SESSION-FIX] Clear stale cookies before redirect to prevent
                // middleware redirect loop (/login → /admin → /login)
                clearAuthCookies();
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                }
                router.push('/login');
                // Safety: hard navigate after 3s if router.push didn't work
                setTimeout(() => { window.location.href = '/login'; }, 3000);
            } else if (!isAdmin) {
                router.push('/');
            }
        }
    }, [isChecking, isLoading, isAuthenticated, isAdmin, router, _hasHydrated]);

    // Show loading while checking (hydration + auth check)
    if (!_hasHydrated || isChecking || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('admin.checkingAuth')}</p>
                </div>
            </div>
        );
    }

    // After check complete - if not admin, show unauthorized
    if (!isAuthenticated || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <EmptyState
                    icon={<span className="text-6xl drop-shadow-lg">🚫</span>}
                    title={t('admin.unauthorized')}
                    description={t('admin.unauthorizedDesc')}
                />
            </div>
        );
    }

    return <>{children}</>;
}

export default AdminGuard;
