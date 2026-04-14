'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Clock, RefreshCw, ShieldAlert, X } from 'lucide-react';
import Link from 'next/link';
import { sessionManager } from '@/lib/session-manager';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * SessionTimeoutWarning — Professional session management UI.
 *
 * Behavior matches major e-commerce platforms (Amazon, Noon, etc.):
 * - Remember Me → 60-min idle timeout (session survives browser restart)
 * - Session-only → 30-min idle timeout (cleared on browser close)
 * - Warning dialog 2 min before forced logout with live countdown
 * - Cross-tab sync: logout in one tab = logout everywhere instantly
 * - Silent token refresh every 15 min for active users
 * - 401 API event → immediate session-expired modal
 * - Cart is preserved across sessions (Zustand persist)
 */

const SILENT_REFRESH_MS = 15 * 60 * 1000; // 15 min

export function SessionTimeoutWarning() {
    const { isAuthenticated, checkAuth, logout, rememberMe } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    const [showWarning, setShowWarning] = useState(false);
    const [showExpired, setShowExpired] = useState(false);
    const [countdown, setCountdown] = useState(120);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const returnUrlRef = useRef('');

    // ── Countdown helpers ──────────────────────────────────────────────────
    const startCountdown = useCallback((seconds = 120) => {
        setCountdown(seconds);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(countdownRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const stopCountdown = useCallback(() => {
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    }, []);

    // ── Actions ────────────────────────────────────────────────────────────
    const handleExtend = useCallback(() => {
        setShowWarning(false);
        stopCountdown();
        sessionManager.extend();
        checkAuth().catch(() => {});
        toast.success(t('toast.sessionExtended'), { duration: 2000 });
    }, [checkAuth, stopCountdown]);

    const handleLogoutNow = useCallback(async () => {
        setShowWarning(false);
        setShowExpired(false);
        stopCountdown();
        await logout().catch(() => {});
    }, [logout, stopCountdown]);

    // ── Session manager lifecycle ──────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) {
            sessionManager.stop();
            setShowWarning(false);
            stopCountdown();
            return;
        }

        const idleTimeoutMs = rememberMe
            ? 60 * 60 * 1000   // 60 min for "Remember Me"
            : 30 * 60 * 1000;  // 30 min for session-only

        sessionManager.start({ idleTimeoutMs, warningBeforeMs: 2 * 60 * 1000 });

        const onWarning = () => {
            returnUrlRef.current = typeof window !== 'undefined' ? window.location.pathname : '';
            setShowWarning(true);
            // Calculate actual remaining seconds for accurate countdown
            const remaining = Math.floor(sessionManager.getRemainingMs() / 1000);
            startCountdown(Math.min(remaining, 120));
        };

        const onLogout = async () => {
            setShowWarning(false);
            stopCountdown();
            await logout().catch(() => {});
            setShowExpired(true);
        };

        const onTabLogout = async () => {
            setShowWarning(false);
            stopCountdown();
            await logout().catch(() => {});
            router.replace('/login');
            toast(t('session.tabLogout'), { icon: '🔒', duration: 4000 });
        };

        const onExtended = () => { setShowWarning(false); stopCountdown(); };

        sessionManager.on('idle-warning', onWarning);
        sessionManager.on('idle-logout', onLogout);
        sessionManager.on('tab-logout', onTabLogout);
        sessionManager.on('session-extended', onExtended);

        return () => {
            sessionManager.off('idle-warning', onWarning);
            sessionManager.off('idle-logout', onLogout);
            sessionManager.off('tab-logout', onTabLogout);
            sessionManager.off('session-extended', onExtended);
            sessionManager.stop();
        };
    }, [isAuthenticated, rememberMe, startCountdown, stopCountdown, logout, router]);

    // ── Handle API 401 ─────────────────────────────────────────────────────
    useEffect(() => {
        const handle = () => {
            if (!isAuthenticated) return;
            logout().catch(() => {}).finally(() => setShowExpired(true));
        };
        window.addEventListener('session-expired', handle);
        return () => window.removeEventListener('session-expired', handle);
    }, [isAuthenticated, logout]);

    // ── Silent refresh for active users ────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) return;
        const id = setInterval(() => {
            // Only refresh if user is active (more than 10 min remaining)
            if (sessionManager.getRemainingMs() > 10 * 60 * 1000) {
                checkAuth().catch(() => {});
            }
        }, SILENT_REFRESH_MS);
        return () => clearInterval(id);
    }, [isAuthenticated, checkAuth]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const fmt = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const urgent = countdown <= 30;
    const pct = Math.round((countdown / 120) * 100);

    return (
        <AnimatePresence>
            {/* ── Idle Warning ─────────────────────────────────────────── */}
            {showWarning && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleExtend}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
                    >
                        {/* Progress bar top */}
                        <div className="h-1 bg-gray-100 dark:bg-gray-800">
                            <motion.div
                                className={`h-full transition-colors duration-500 ${urgent ? 'bg-red-500' : 'bg-amber-400'}`}
                                initial={{ width: '100%' }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        <div className="p-7">
                            {/* Circular countdown */}
                            <div className="flex flex-col items-center mb-6">
                                <div className={`relative w-24 h-24 flex items-center justify-center rounded-full mb-3 ${urgent ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
                                        <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor"
                                            className="text-gray-200 dark:text-gray-700" strokeWidth="4" />
                                        <circle cx="48" cy="48" r="44" fill="none"
                                            stroke={urgent ? '#ef4444' : '#f59e0b'} strokeWidth="4"
                                            strokeDasharray={`${2 * Math.PI * 44}`}
                                            strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
                                            strokeLinecap="round"
                                            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                        />
                                    </svg>
                                    <Clock className={`w-8 h-8 relative z-10 ${urgent ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
                                </div>
                                <div className={`text-4xl font-black tabular-nums ${urgent ? 'text-red-500' : 'text-amber-500'}`}>
                                    {fmt(countdown)}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{t('session.remaining')}</p>
                            </div>

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                                    {t('session.warning.title')}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    {t('session.warning.desc')}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                <button
                                    onClick={handleExtend}
                                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {t('session.extend')}
                                </button>
                                <button
                                    onClick={handleLogoutNow}
                                    className="w-full py-3 rounded-xl font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-all text-sm"
                                >
                                    {t('session.logoutNow')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ── Session Expired ───────────────────────────────────────── */}
            {showExpired && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
                    >
                        <div className="h-1 bg-red-500" />

                        {/* Close button */}
                        <button
                            onClick={() => setShowExpired(false)}
                            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="p-7">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                                <ShieldAlert className="w-8 h-8 text-red-500" />
                            </div>

                            <div className="text-center mb-7">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                                    {t('session.expired.title')}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    {t('session.expired.desc')}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                <Link
                                    href={`/login?returnUrl=${encodeURIComponent(returnUrlRef.current || '/dashboard')}`}
                                    onClick={() => setShowExpired(false)}
                                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20"
                                >
                                    <LogIn className="w-4 h-4" />
                                    {t('session.relogin')}
                                </Link>
                                <button
                                    onClick={() => setShowExpired(false)}
                                    className="w-full py-3 rounded-xl font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-all text-sm"
                                >
                                    {t('session.stayGuest')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
