'use client';
import { ta } from '@/i18n/auto-translations';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { PageTransition } from '@/components/ui/page-transition';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTranslation } from '@/i18n/useTranslation';
import { clearAuthCookies } from '@/lib/auth-helpers';
import { Mail, X, RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// [E-04] Email Verification Banner
// ─────────────────────────────────────────────────────────────────────────────
function EmailVerificationBanner() {
    const { user } = useAuthStore();
    const [dismissed, setDismissed] = useState(false);
    const [resending, setResending] = useState(false);
    const [sent, setSent] = useState(false);

    const shouldShow = !!user && !user.email_verified_at && !dismissed;
    if (!shouldShow) return null;

    const handleResend = async () => {
        setResending(true);
        try {
            await api.post('/auth/email/resend');
            setSent(true);
        } catch {
            /* api.ts handles toast */
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="w-full bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-medium shadow-md">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">
                    {sent
                        ? ta('✅ تم إرسال رابط التأكيد إلى بريدك — تحقق من صندوق الوارد.', '✅ Confirmation link sent to your email — check your inbox.')
                        : ta('بريدك الإلكتروني غير مؤكَّد. تحقق من بريدك أو أعد الإرسال.', 'Your email is not verified. Check your email or resend.')}
                </span>
            </div>
            {!sent && (
                <button
                    onClick={handleResend}
                    disabled={resending}
                    className="flex items-center gap-1.5 shrink-0 bg-amber-950/15 hover:bg-amber-950/30 px-3 py-1 rounded-lg transition-colors disabled:opacity-60"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? ta('جارٍ الإرسال...', 'Sending...') : ta('إعادة الإرسال', 'Resend')}
                </button>
            )}
            <button
                onClick={() => setDismissed(true)}
                className="shrink-0 hover:opacity-70 transition-opacity"
                aria-label={ta('إغلاق', 'Close')}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { dir } = useTranslation();
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore();

  // [PERF-AUTH] Hard 10s timeout: if auth hasn't resolved, treat as unauthenticated.
  // This prevents infinite spinners when backend is slow/offline.
  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    if (_hasHydrated && !isLoading) return; // Already resolved — no timer needed
    const t = setTimeout(() => setAuthTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, [_hasHydrated, isLoading]);

  const effectivelyAuthenticated = isAuthenticated && !authTimedOut;

  useEffect(() => {
    if (!authTimedOut && (!_hasHydrated || isLoading)) return;

    if (!effectivelyAuthenticated) {
      // [SESSION-FIX] Force-clear cookies immediately so the Edge middleware
      // won't see stale auth-token and redirect /login → /dashboard in a loop.
      clearAuthCookies();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }

      // Try Next.js router first
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnUrl=${returnUrl}`);

      // Safety: if still on this page after 3s (redirect loop), use hard navigation
      const safetyTimer = setTimeout(() => {
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }, 3000);

      return () => clearTimeout(safetyTimer);
    }
  }, [authTimedOut, _hasHydrated, isLoading, effectivelyAuthenticated, router, pathname]);

  // Show a loading spinner while hydrating or checking auth — max 10s (see hard timeout)
  if (!authTimedOut && (!_hasHydrated || isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  // Session expired / timed out — show redirecting state (not blank)
  if (!effectivelyAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">{ta('جاري إعادة التوجيه...', 'Redirecting...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300" dir={dir}>
      {/* [E-04] Email verification banner — only for unverified native users */}
      <EmailVerificationBanner />
      <Navbar />
      <main className="flex-1 pt-16" style={{ paddingTop: 'max(4rem, calc(env(safe-area-inset-top, 0px) + 4rem))' }}>
      <ErrorBoundary>
        <PageTransition>
          {children}
        </PageTransition>
      </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}