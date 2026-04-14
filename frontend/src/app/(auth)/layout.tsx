'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/i18n/useTranslation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const { dir } = useTranslation();

  useEffect(() => {
    // Only redirect after hydration is complete
    if (_hasHydrated && !isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [_hasHydrated, isLoading, isAuthenticated, router]);

  // Show loading while checking auth status
  if (!_hasHydrated || isLoading) {
    return (
      <div dir={dir} className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-xl bg-primary/20"></div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div dir={dir} className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return <div dir={dir}>{children}</div>;
}