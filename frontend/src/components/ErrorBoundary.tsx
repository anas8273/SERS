'use client';
import { ta } from '@/i18n/auto-translations';

import { logger } from '@/lib/logger';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// [PERF-M3] Enhanced Global Error Boundary
//
// Upgraded from the minimal version to a production-grade boundary with:
// - Error ID for support correlation
// - onError callback for Sentry/analytics integration
// - withErrorBoundary HOC for section-level protection
// - Dev mode: full stack trace display
// ──────────────────────────────────────────────────────────────────────────────

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorId: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        const errorId = Math.random().toString(36).slice(2, 10).toUpperCase();
        return { hasError: true, error, errorId };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        this.props.onError?.(error, info);
        logger.error('[ErrorBoundary]', {
            errorId: this.state.errorId,
            error: error.message,
            stack: error.stack,
            componentStack: info.componentStack,
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorId: '' });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            const isDev = process.env.NODE_ENV === 'development';

            return (
                <div role="alert" className="min-h-[400px] flex items-center justify-center p-8" dir="rtl">
                    <div className="text-center max-w-sm w-full">
                        <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </div>

                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                            {ta('حدث خطأ غير متوقع', 'An unexpected error occurred')}
                        </h3>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {isDev
                                ? (this.state.error?.message ?? 'خطأ غير معروف')
                                : 'يرجى إعادة المحاولة أو العودة للصفحة الرئيسية'}
                        </p>

                        <p className="text-xs text-gray-400 font-mono mb-6">
                            رمز: {this.state.errorId}
                        </p>

                        {isDev && this.state.error && (
                            <details className="text-start mb-4 bg-red-50 dark:bg-red-950/40 rounded p-3 border border-red-200 dark:border-red-900">
                                <summary className="text-red-600 text-xs font-medium cursor-pointer">
                                    Stack Trace (dev)
                                </summary>
                                <pre className="text-red-500 text-xs overflow-auto max-h-32 mt-1 whitespace-pre-wrap">
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {ta('إعادة المحاولة', 'Try Again')}
                            </button>
                            <a
                                href="/"
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                {ta('الرئيسية', 'Home')}
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/** HOC wrapper for section-level protection */
export function withErrorBoundary<P extends object>(
    Comp: React.ComponentType<P>,
    options?: Omit<Props, 'children'>
) {
    const Wrapped = (props: P) => (
        <ErrorBoundary {...options}>
            <Comp {...props} />
        </ErrorBoundary>
    );
    Wrapped.displayName = `withErrorBoundary(${Comp.displayName ?? Comp.name ?? 'Component'})`;
    return Wrapped;
}
