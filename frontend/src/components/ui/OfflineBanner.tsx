'use client';
import { ta } from '@/i18n/auto-translations';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Shows a fixed banner when the user goes offline.
 * Automatically hides when connection is restored.
 */
export function OfflineBanner() {
  const status = useNetworkStatus();

  return (
    <AnimatePresence>
      {status === 'offline' && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-center py-2.5 px-4 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
        >
          <WifiOff className="w-4 h-4" />
          {ta('لا يوجد اتصال بالإنترنت — بعض الميزات قد لا تعمل', 'No internet connection — some features may not work')}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
