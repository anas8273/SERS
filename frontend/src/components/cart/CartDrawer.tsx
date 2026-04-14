'use client';

import { useEffect, useRef } from 'react';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/cartStore';
import { useCartDrawerStore } from '@/stores/cartDrawerStore';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/i18n/useTranslation';
import { formatPrice } from '@/lib/utils';
import {
    X,
    ShoppingBag,
    Trash2,
    Package,
    CreditCard,
    ArrowRight,
    Sparkles,
    Shield,
    Zap,
} from 'lucide-react';

export function CartDrawer() {
    const { t, dir } = useTranslation();
    const router = useRouter();
    const { isOpen, close } = useCartDrawerStore();
    const { items, removeItem, getSubtotal, getTotal, getItemCount, couponDiscount } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const drawerRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [close]);

    const subtotal = getSubtotal();
    const total = getTotal();
    const itemCount = getItemCount();

    const slideFrom = dir === 'rtl' ? 'left' : 'right';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                        onClick={close}
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        ref={drawerRef}
                        initial={{ x: slideFrom === 'right' ? '100%' : '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: slideFrom === 'right' ? '100%' : '-100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className={`fixed top-0 ${slideFrom === 'right' ? 'right-0' : 'left-0'} z-[61] h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col`}
                        dir={dir}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">
                                        {t('cart.title')}
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        {itemCount} {t('cart.items')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={close}
                                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Close cart"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-4">
                                        <Package className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                                        {t('cart.empty.title')}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6 max-w-[240px]">
                                        {t('cart.empty.desc')}
                                    </p>
                                    <button
                                        onClick={() => { close(); router.push('/marketplace'); }}
                                        className="px-6 py-3 bg-violet-500 text-white rounded-xl font-bold text-sm hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/25"
                                    >
                                        {t('cart.empty.browse')}
                                    </button>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {items.map((item) => (
                                        <motion.div
                                            key={item.templateId}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, x: slideFrom === 'right' ? 50 : -50 }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                            className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50"
                                        >
                                            <div className="flex gap-3">
                                                {/* Thumbnail */}
                                                <div className="relative w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                                                    <SafeImage src={item.thumbnail} alt={item.name} fill className="object-cover" fallback={
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-6 h-6 text-gray-300" />
                                                        </div>
                                                    } />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 mb-1">
                                                        {item.name}
                                                    </h4>
                                                    {/* Price */}
                                                    <span className="font-black text-sm text-violet-600 dark:text-violet-400">
                                                        {formatPrice(item.price)}
                                                    </span>
                                                </div>

                                                {/* Remove */}
                                                <button
                                                    onClick={() => removeItem(item.templateId)}
                                                    className="self-start p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer (only when items exist) */}
                        {items.length > 0 && (
                            <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-5 space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
                                {/* Totals */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>{t('cart.subtotal')}</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-sm text-green-500 font-medium">
                                            <span>{t('cart.discount')}</span>
                                            <span>-{formatPrice(couponDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-base font-black text-gray-900 dark:text-white">{t('cart.total')}</span>
                                        <span className="text-xl font-black text-violet-600 dark:text-violet-400">{formatPrice(total)}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2.5">
                                    <button
                                        onClick={() => {
                                            close();
                                            if (!isAuthenticated) {
                                                router.push('/login?returnUrl=/checkout');
                                            } else {
                                                router.push('/checkout');
                                            }
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-violet-500/25 hover:shadow-violet-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        {t('cart.checkout')} — {formatPrice(total)}
                                    </button>

                                    <button
                                        onClick={() => {
                                            close();
                                            // Delay navigation slightly so the close animation isn't interrupted
                                            setTimeout(() => router.push('/cart'), 100);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-primary hover:text-primary/80 py-2.5 border border-primary/20 hover:border-primary/40 rounded-xl transition-all"
                                    >
                                        <ArrowRight className="w-3.5 h-3.5" />
                                        {t('cart.viewCart')}
                                    </button>
                                </div>

                                {/* Trust badges */}
                                <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-gray-400">
                                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {t('cart.secure')}</span>
                                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {t('cart.instant')}</span>
                                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('cart.guarantee')}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
