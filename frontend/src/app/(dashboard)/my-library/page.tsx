'use client';
import { ta } from '@/i18n/auto-translations';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /my-library → /orders redirect
 * 
 * The library has been merged into the "Purchases" page (/orders)
 * as a "Purchased Files" tab. This redirect ensures old links still work.
 */
export default function MyLibraryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/orders');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-gray-400 font-medium">{ta('جاري التوجيه...', 'Redirecting...')}</p>
      </div>
    </div>
  );
}
