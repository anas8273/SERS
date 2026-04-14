'use client';

import { logger } from '@/lib/logger';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { ta } from '@/i18n/auto-translations';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Global error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            {/* Message */}
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
              {ta('عذراً، حدث خطأ غير متوقع', 'Sorry, an unexpected error occurred')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
              {ta('واجهنا مشكلة أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.', 'We encountered a problem loading the page. Please try again or return to the home page.')}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-8">
                {ta('رمز الخطأ', 'Error code')}: {error.digest}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={reset}
                className="font-bold gap-2 rounded-xl bg-primary text-white px-6"
              >
                <RefreshCw className="w-4 h-4" />
                {ta('إعادة المحاولة', 'Try Again')}
              </Button>
              <Link href="/">
                <Button variant="outline" className="font-bold gap-2 rounded-xl px-6 w-full">
                  <Home className="w-4 h-4" />
                  {ta('الصفحة الرئيسية', 'Home Page')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
