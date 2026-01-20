'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  X,
  Loader2,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Loader2,
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
  loading: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200',
};

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
  loading: 'text-gray-500 animate-spin',
};

export function Toast({ id, type, title, description, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const Icon = toastIcons[type];

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Auto close
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, type]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 max-w-sm',
        toastStyles[type],
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconStyles[type])} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{title}</p>
        {description && (
          <p className="text-sm opacity-80 mt-1">{description}</p>
        )}
      </div>
      {type !== 'loading' && (
        <button
          onClick={handleClose}
          className="shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Toast Container
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ToastContainer({
  toasts,
  onClose,
  position = 'top-right',
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2',
        positionClasses[position]
      )}
      dir="rtl"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Toast Hook
let toastId = 0;
let listeners: Array<(toasts: any[]) => void> = [];
let toastsState: any[] = [];

const updateListeners = () => {
  listeners.forEach((listener) => listener([...toastsState]));
};

export const toastManager = {
  show: (options: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = `toast-${++toastId}`;
    toastsState = [...toastsState, { ...options, id }];
    updateListeners();
    return id;
  },
  success: (title: string, description?: string) => {
    return toastManager.show({ type: 'success', title, description });
  },
  error: (title: string, description?: string) => {
    return toastManager.show({ type: 'error', title, description });
  },
  warning: (title: string, description?: string) => {
    return toastManager.show({ type: 'warning', title, description });
  },
  info: (title: string, description?: string) => {
    return toastManager.show({ type: 'info', title, description });
  },
  loading: (title: string, description?: string) => {
    return toastManager.show({ type: 'loading', title, description, duration: 0 });
  },
  dismiss: (id: string) => {
    toastsState = toastsState.filter((t) => t.id !== id);
    updateListeners();
  },
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> => {
    const id = toastManager.loading(messages.loading);
    try {
      const result = await promise;
      toastManager.dismiss(id);
      toastManager.success(messages.success);
      return result;
    } catch (error) {
      toastManager.dismiss(id);
      toastManager.error(messages.error);
      throw error;
    }
  },
  subscribe: (listener: (toasts: any[]) => void) => {
    listeners.push(listener);
    listener([...toastsState]);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

export function useToast() {
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  return {
    toasts,
    toast: toastManager,
    dismiss: toastManager.dismiss,
  };
}
