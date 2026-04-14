'use client';

import { useState, useEffect } from 'react';

/**
 * Detects the user's network quality.
 * Returns 'slow' | 'fast' | 'offline'.
 *
 * Use this to:
 * - Disable heavy animations on slow connections
 * - Show offline banners
 * - Skip image preloading on 2G/3G
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<'fast' | 'slow' | 'offline'>('fast');

  useEffect(() => {
    const updateStatus = () => {
      if (!navigator.onLine) {
        setStatus('offline');
        return;
      }

      const conn = (navigator as any).connection;
      if (conn) {
        const slowTypes = ['slow-2g', '2g', '3g'];
        if (slowTypes.includes(conn.effectiveType)) {
          setStatus('slow');
          return;
        }
      }

      setStatus('fast');
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (conn) conn.removeEventListener('change', updateStatus);
    };
  }, []);

  return status;
}
