// src/hooks/useAuth.ts

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

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

  // Check auth on mount
  useEffect(() => {
    if (_hasHydrated && !isLoading) {
      checkAuth();
    }
  }, [_hasHydrated]);

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
