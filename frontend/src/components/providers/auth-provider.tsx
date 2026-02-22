'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Sync auth state to cookies so middleware can read them.
 * Zustand persist uses localStorage which is not accessible in middleware.
 */
function syncAuthToCookies(token: string | null, role: string | null) {
  if (typeof document === 'undefined') return;

  if (token) {
    // Set auth cookies with SameSite=Lax for security
    document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    document.cookie = `auth-role=${role || 'user'}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } else {
    // Clear auth cookies
    document.cookie = 'auth-token=; path=/; max-age=0';
    document.cookie = 'auth-role=; path=/; max-age=0';
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { _hasHydrated, setHasHydrated, checkAuth, token, user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);

    // Ensure hydration is marked as complete
    if (!_hasHydrated) {
      setHasHydrated(true);
    }

    // Check auth status after hydration
    checkAuth();
  }, [_hasHydrated, setHasHydrated, checkAuth]);

  // Sync auth state to cookies whenever it changes
  useEffect(() => {
    if (!_hasHydrated) return;
    syncAuthToCookies(
      isAuthenticated ? token : null,
      user?.role || null
    );
  }, [_hasHydrated, isAuthenticated, token, user?.role]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted || !_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-gray-400 font-medium animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
