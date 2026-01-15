'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { _hasHydrated, setHasHydrated, checkAuth } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
    
    // Ensure hydration is marked as complete
    if (!_hasHydrated) {
      setHasHydrated(true);
    }
    
    // Check auth status after hydration
    checkAuth();
  }, [_hasHydrated, setHasHydrated, checkAuth]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted || !_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}