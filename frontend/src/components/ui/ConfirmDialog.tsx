'use client';
import { ta } from '@/i18n/auto-translations';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const VARIANT_STYLES = {
  danger: {
    icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    button: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
  },
  warning: {
    icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20',
  },
  info: {
    icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'تأكيد الإجراء',
  message = 'هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="p-6 text-center">
                <div className={`w-14 h-14 mx-auto rounded-2xl ${styles.icon} flex items-center justify-center mb-4`}>
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-4 pt-0">
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={loading}
                  className="flex-1 rounded-xl font-bold"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 rounded-xl font-bold ${styles.button}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ms-1" />
                      {ta('جاري التنفيذ...', 'Processing...')}
                    </>
                  ) : (
                    confirmText
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
