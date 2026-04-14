'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t, dir } = useTranslation();

  useEffect(() => {
    const accepted = localStorage.getItem('cookie-consent');
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setVisible(false);
  };

  const dismiss = () => {
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          // Mobile: full-width bottom bar  |  Desktop: compact card bottom-end corner
          className="fixed z-[9000] left-0 right-0 bottom-0 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm"
          style={{
            // Safe area for iPhone home bar
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          dir={dir}
        >
          <div className="bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl border-t sm:border border-gray-200 dark:border-gray-700 px-4 py-4 sm:p-5 relative">
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3 end-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="flex items-center gap-3 mb-3 pe-6">
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cookie className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                  {t('cookie.title')}
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              {t('cookie.description')}{' '}
              <Link href="/privacy" className="text-primary hover:underline font-medium">
                {t('cookie.privacy')}
              </Link>
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={accept}
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                <Shield className="w-3 h-3 ms-1" />
                {t('cookie.acceptAll')}
              </Button>
              <Button
                onClick={dismiss}
                size="sm"
                variant="outline"
                className="flex-1 text-xs rounded-xl font-medium"
              >
                {t('cookie.reject')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
