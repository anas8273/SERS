// src/hooks/useAuth.ts

'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { updateLastActive } from '@/lib/auth-helpers';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
  requiredRole?: 'user' | 'admin';
}

export function useAuth(options: UseAuthOptions = {}) {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    _hasHydrated,
    login,
    register,
    socialLogin,
    logout,
    checkAuth,
    fetchUser
  } = useAuthStore();

  const { redirectTo, redirectIfFound = false, requiredRole } = options;

  // Check auth on mount — only if not already authenticated
  useEffect(() => {
    if (_hasHydrated && !isLoading && !isAuthenticated) {
      checkAuth();
    }
  }, [_hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle redirects
  useEffect(() => {
    if (!_hasHydrated || isLoading) return;

    // If user is found and we should redirect if found
    if (redirectIfFound && isAuthenticated && redirectTo) {
      router.push(redirectTo);
      return;
    }

    // If user is not found and we should redirect
    if (!redirectIfFound && !isAuthenticated && redirectTo) {
      router.push(redirectTo);
      return;
    }

    // Check role requirement
    if (requiredRole && isAuthenticated && user) {
      const userRole = user.role?.toLowerCase();
      if (requiredRole === 'admin' && userRole !== 'admin') {
        router.push('/');
      }
    }
  }, [_hasHydrated, isLoading, isAuthenticated, user, redirectTo, redirectIfFound, requiredRole, router]);

  // [SESSION] Track user activity for idle timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 60_000) { // Update at most once per minute
        lastUpdate = now;
        updateLastActive();
      }
    };

    const events = ['click', 'keydown', 'scroll', 'mousemove'] as const;
    events.forEach(e => window.addEventListener(e, throttledUpdate, { passive: true }));
    // Initialize on mount
    updateLastActive();

    return () => {
      events.forEach(e => window.removeEventListener(e, throttledUpdate));
    };
  }, [isAuthenticated]);

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return {
    user,
    isAuthenticated,
    isLoading: !_hasHydrated || isLoading,
    isAdmin,
    login,
    register,
    socialLogin,
    logout,
    checkAuth,
    fetchUser,
  };
}

export default useAuth;
