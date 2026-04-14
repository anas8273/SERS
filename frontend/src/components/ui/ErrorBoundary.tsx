'use client';
import { ta } from '@/i18n/auto-translations';

import { logger } from '@/lib/logger';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// [PERF-M3] Global Error Boundary
//
// Catches ANY unhandled React render errors and shows a graceful recovery UI
// instead of a blank screen. This is the "never crash to white" guarantee.
//
// Usage:
//   Wrap the entire app in <ErrorBoundary> in layout.tsx
//   Optionally use <ErrorBoundary fallback={<CustomUI/>}> for section-level recovery
// ──────────────────────────────────────────────────────────────────────────────

interface Props {
    children: ReactNode;
    /** Custom fallback UI — if not provided, the default recovery screen is shown */
    fallback?: ReactNode;
    /** Called when an error is caught — use for Sentry/error tracking */
    onError?: (error: Error, info: ErrorInfo) => void;
    /** If true, the error boundary resets on route change (navigation) */
    resetOnRouteChange?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Generate a short error ID for correlation with logs
        const errorId = Math.random().toString(36).slice(2, 10).toUpperCase();
        return { hasError: true, error, errorId };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        this.setState({ errorInfo: info });

        // Call the optional onError prop (for Sentry, analytics, etc.)
        this.props.onError?.(error, info);

        // Always log to console with full context
        logger.error('[ErrorBoundary] Caught an unhandled error:', {
            errorId: this.state.errorId,
            error: error.message,
            stack: error.stack,
            componentStack: info.componentStack,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const isDev = process.env.NODE_ENV === 'development';

            // Default recovery UI — professional and non-alarming
            return (
                <div
                    role="alert"
                    className="min-h-screen bg-gray-950 flex items-center justify-center p-6"
                    dir="rtl"
                >
                    <div className="max-w-md w-full">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-10 h-10 text-amber-400" />
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl font-bold text-white mb-3">
                                {ta('حدث خطأ غير متوقع', 'An unexpected error occurred')}
                            </h1>

                            {/* Message */}
                            <p className="text-slate-400 mb-2">
                                {ta('واجهت المنصة مشكلة تقنية مؤقتة. يمكنك إعادة المحاولة أو العودة للصفحة الرئيسية.', 'The platform encountered a temporary issue. You can retry or return to the homepage.')}
                            </p>

                            {/* Error ID for support */}
                            <p className="text-slate-600 text-xs font-mono mb-6">
                                {ta('رمز الخطأ:', 'Error Code:')}<span className="text-slate-500">{this.state.errorId}</span>
                            </p>

                            {/* Dev mode: show technical details */}
                            {isDev && this.state.error && (
                                <details className="text-start mb-6 bg-red-950/40 rounded-lg p-4 border border-red-900/50">
                                    <summary className="text-red-400 text-sm font-medium cursor-pointer mb-2">
                                        {ta('تفاصيل الخطأ (وضع التطوير فقط)', 'Error Details (Development Mode Only)')}
                                    </summary>
                                    <pre className="text-red-300 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                                        {this.state.error.message}
                                        {'\n\n'}
                                        {this.state.error.stack}
                                    </pre>
                                </details>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={this.handleReset}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {ta('إعادة المحاولة', 'Try Again')}
                                </button>
                                <a
                                    href="/"
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                                >
                                    <Home className="w-4 h-4" />
                                    {ta('الصفحة الرئيسية', 'Home Page')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * withErrorBoundary HOC
 * Wraps any component in an ErrorBoundary.
 *
 * @example
 * export default withErrorBoundary(MyComponent);
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    options?: Omit<Props, 'children'>
) {
    const Wrapped = (props: P) => (
        <ErrorBoundary {...options}>
            <Component {...props} />
        </ErrorBoundary>
    );
    Wrapped.displayName = `withErrorBoundary(${Component.displayName ?? Component.name ?? 'Component'})`;
    return Wrapped;
}
