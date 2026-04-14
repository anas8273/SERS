'use client';
import { ta } from '@/i18n/auto-translations';

import { logger } from '@/lib/logger';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Dashboard error:', error);
  }, [error]);
  const { dir } = useTranslation();

  return (
    <div dir={dir} className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto"
      >
        <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-5">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
        </div>

        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
          {ta('خطأ في لوحة التحكم', 'Dashboard Error')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {error.message || 'حدث خطأ أثناء تحميل لوحة التحكم. يرجى المحاولة مرة أخرى.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="font-bold gap-2 rounded-xl">
            <RefreshCw className="w-4 h-4" />
            {ta('إعادة المحاولة', 'Try Again')}
          </Button>
          <Link href="/">
            <Button variant="outline" className="font-bold gap-2 rounded-xl w-full">
              <Home className="w-4 h-4" />
              {ta('الرئيسية', 'Home')}
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
