'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ta } from '@/i18n/auto-translations';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning';
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = ta('تأكيد', 'Confirm'),
    cancelLabel = ta('إلغاء', 'Cancel'),
    variant = 'danger',
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onCancel}
                    className="absolute top-4 left-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                        variant === 'danger'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                    }`}>
                        <AlertTriangle className="w-8 h-8" />
                    </div>

                    {/* Text */}
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full">
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="flex-1 rounded-xl font-bold"
                            disabled={isLoading}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            className={`flex-1 rounded-xl font-bold ${
                                variant === 'danger'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {ta('جاري التنفيذ...', 'Processing...')}
                                </span>
                            ) : confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
