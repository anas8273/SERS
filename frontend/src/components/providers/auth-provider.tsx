'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Sync auth state to cookies so Next.js Edge middleware can read them.
 * Zustand persist uses localStorage which is not accessible in middleware.
 */
function syncAuthToCookies(
  token: string | null,
  role: string | null,
  rememberMe: boolean = true
) {
  if (typeof document === 'undefined') return;

  const isSecure = window.location.protocol === 'https:';
  const secureAttr = isSecure ? '; Secure' : '';

  if (token) {
    const maxAge = rememberMe ? `; max-age=${60 * 60 * 24 * 30}` : '';
    document.cookie = `auth-token=${token}; path=/${maxAge}; SameSite=Lax${secureAttr}`;
    document.cookie = `auth-role=${role || 'user'}; path=/${maxAge}; SameSite=Lax${secureAttr}`;
  } else {
    document.cookie = `auth-token=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
    document.cookie = `auth-role=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { _hasHydrated, setHasHydrated, checkAuth, token, user, isAuthenticated } = useAuthStore();
  const prevTokenRef = useRef<string | null>(null);
  const didInit = useRef(false);

  // Initialize hydration flag on mount
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      if (!_hasHydrated) setHasHydrated(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check auth once after hydration — only if we have a token but no user data
  useEffect(() => {
    if (!_hasHydrated || !didInit.current) return;
    if (user && isAuthenticated) return;
    if (!token) return;
    checkAuth();
  }, [_hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync cookies whenever auth state changes
  useEffect(() => {
    if (!_hasHydrated) return;
    const currentToken = isAuthenticated ? token : null;
    if (currentToken !== prevTokenRef.current) {
      prevTokenRef.current = currentToken;
      syncAuthToCookies(currentToken, user?.role || null, useAuthStore.getState().rememberMe);
    }
  }, [_hasHydrated, isAuthenticated, token, user?.role]);

  // [PERF FIX] Always render children immediately — never return null!
  // The old code blocked ALL rendering until mount, causing white screen flashes.
  return <>{children}</>;
}

