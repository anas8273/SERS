'use client';
import { ta } from '@/i18n/auto-translations';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NetworkStatus - Shows a banner when the user goes offline or comes back online.
 * Handles the Firestore "Backend didn't respond within 10 seconds" warning gracefully.
 */
export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showBanner, setShowBanner] = useState(false);
    const [showOnlineBanner, setShowOnlineBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowBanner(false);
            setDismissed(false);
            setShowOnlineBanner(true);
            // Auto-hide online banner after 3 seconds
            setTimeout(() => setShowOnlineBanner(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
            setDismissed(false);
            setShowOnlineBanner(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Also check initial state
        if (!navigator.onLine) {
            setShowBanner(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!mounted) return null;

    return (
        <AnimatePresence>
            {/* Offline Banner */}
            {showBanner && !dismissed && !isOnline && (
                <motion.div
                    key="offline"
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-[9999] bg-red-500 text-white py-2 px-4 flex items-center justify-between gap-3 shadow-lg"
                    dir="rtl"
                >
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <WifiOff className="h-4 w-4 shrink-0" />
                        <span>{ta('أنت غير متصل بالإنترنت — بعض الميزات قد لا تعمل حتى استعادة الاتصال', 'You are offline — some features may not work until connection is restored')}</span>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-1 rounded hover:bg-white/20 transition-colors shrink-0"
                        aria-label="إغلاق"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </motion.div>
            )}

            {/* Back Online Banner */}
            {showOnlineBanner && (
                <motion.div
                    key="online"
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-500 text-white py-2 px-4 flex items-center justify-center gap-2 shadow-lg"
                    dir="rtl"
                >
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-medium">{ta('تم استعادة الاتصال بالإنترنت ✓', 'Internet connection restored ✓')}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
