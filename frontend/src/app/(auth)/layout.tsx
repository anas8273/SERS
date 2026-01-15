'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Only redirect after hydration is complete
    if (_hasHydrated && !isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [_hasHydrated, isLoading, isAuthenticated, router]);

  // Show loading while checking auth status
  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, don't show auth pages
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}