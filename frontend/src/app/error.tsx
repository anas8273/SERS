'use client';

import { logger } from '@/lib/logger';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, dir } = useTranslation();

  useEffect(() => {
    logger.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6" dir={dir}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto"
      >
        {/* Icon */}
        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-5">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        {/* Message */}
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
          {t('error.pageTitle')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {error.message || t('error.pageDesc')}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="font-bold gap-2 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
            {t('error.retry')}
          </Button>
          <Link href="/">
            <Button variant="outline" className="font-bold gap-2 rounded-xl w-full">
              <Home className="w-4 h-4" />
              {t('error.home')}
            </Button>
          </Link>
        </div>

        {/* Contact support link */}
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary mt-6 transition-colors"
        >
          <ArrowRight className="w-3 h-3" />
          {t('error.contactSupport')}
        </Link>
      </motion.div>
    </div>
  );
}
