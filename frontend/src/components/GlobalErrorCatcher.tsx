'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * Global error catcher for unhandled promise rejections and runtime errors
 * that escape React's error boundary system. This is the FINAL safety net
 * to ensure NO error goes unnoticed by the user.
 */
export function GlobalErrorCatcher() {
  const { t } = useTranslation();
  useEffect(() => {
    // Catch unhandled promise rejections (e.g. forgotten .catch() on fetch calls)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault(); // Prevent default browser error logging
      const message = event.reason?.message || event.reason || t('toast.unexpectedError');
      
      // Don't show toast for specific known non-critical errors
      const ignoredPatterns = [
        'ResizeObserver',
        'Loading chunk',
        'ChunkLoadError',
        'Network Error',                      // Already handled by interceptor
        'session-expired',                    // Already handled by SessionTimeout
        'Cloud Firestore backend',            // Firestore offline - handled by OfflineBanner
        'Backend didn\'t respond',            // Firestore timeout - handled by OfflineBanner
        'offline mode',                       // Firestore offline mode
        'Could not reach Cloud Firestore',    // Firestore connectivity
        'WebChannelConnection',               // Firestore internal
        'RPC failed',                         // Firestore network errors
        'انتهت مهلة',                         // API timeout - handled by retry + component catch
        'لا يمكن الاتصال بالخادم',             // API connection error - handled by retry
        'حدث خطأ غير متوقع',                   // Generic API error - already shown by interceptor
        'حدث خطأ في الخادم',                   // Server error 500 - not user's fault
        'المورد المطلوب غير موجود',             // 404 on GET - normal empty state
        'انتهت الجلسة',                       // 401 - handled by session-expired event
        'timeout',                            // Axios ECONNABORTED
        'ECONNABORTED',                       // Axios timeout code
      ];
      
      if (ignoredPatterns.some(p => String(message).includes(p))) return;
      
      toast.error(typeof message === 'string' ? message : t('toast.unexpectedError'));
    };

    // Catch unhandled runtime errors that escape React boundaries
    const handleError = (event: ErrorEvent) => {
      // Don't interfere with React's own error handling
      if (event.error?.stack?.includes('react')) return;
      
      const ignoredErrors = [
        'ResizeObserver loop',
        'Script error',
        'Loading CSS chunk',
      ];
      
      if (ignoredErrors.some(e => event.message?.includes(e))) return;
      
      toast.error(t('toast.unexpectedError'));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // This component renders nothing — it only attaches event listeners
}
