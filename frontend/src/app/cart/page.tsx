'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { CouponInput } from '@/components/cart/CouponInput';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { EmptyState } from '@/components/ui/empty-state';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import type { Coupon } from '@/types';
import {
    ShoppingCart,
    Trash2,
    CreditCard,
    ArrowRight,
    Shield,
    Zap,
    Package,
    Loader2,
    FileDigit,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';



export default function CartPage() {
    const router = useRouter();
    const { t, dir } = useTranslation();
    const {
        items,
        removeItem,
        clearCart,
        getSubtotal,
        getTotal,
        getItemCount,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
    } = useCartStore();

    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const _hasHydrated = useCartStore((s) => s._hasHydrated);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const subtotal = getSubtotal();
    const total = getTotal();

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            toast.error(t('cart.loginRequired'));
            router.push('/login?returnUrl=/cart');
            return;
        }

        if (items.length === 0) {
            toast.error(t('cart.emptyError'));
            return;
        }

        setIsProcessing(true);
        try {
            router.push('/checkout');
        } catch (error) {
            toast.error(t('cart.checkoutError'));
        } finally {
            setIsProcessing(false);
        }
    };

    // Wait for cart hydration to avoid SSR flash
    if (!_hasHydrated) return null;

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300" dir={dir}>
            <Navbar />

            <main className="flex-1 pt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <ScrollReveal>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-primary to-primary/80 rounded-xl text-white shadow-lg shadow-primary/20">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('cart.title')}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {getItemCount()} {t('cart.items')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {items.length > 0 && (
                                showClearConfirm ? (
                                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                        <span className="text-xs font-medium text-red-600 dark:text-red-400">{t('cart.confirmClear') || t('orders.clearConfirm')}</span>
                                        <button
                                            onClick={() => setShowClearConfirm(false)}
                                            className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                clearCart();
                                                toast.success(t('cart.cleared'));
                                                setShowClearConfirm(false);
                                            }}
                                            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors"
                                        >
                                            {t('common.delete')}
                                        </button>
                                    </div>
                                ) : (
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t('cart.clearAll')}
                                </button>
                                )
                            )}
                            <Link href="/marketplace">
                                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                                    <ArrowRight className="w-4 h-4" />
                                    {t('cart.continueShopping')}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <EmptyState
                            icon={<ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600" />}
                            title={t('cart.empty.title')}
                            description={t('cart.empty.desc')}
                            action={
                                <Link href="/marketplace">
                                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
                                        <Package className="w-4 h-4" />
                                        {t('cart.empty.browse')}
                                    </Button>
                                </Link>
                            }
                        />
                    ) : (
                        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4 mb-8 lg:mb-0">
                                {items.map((item) => (
                                    <div
                                        key={item.templateId}
                                        className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Thumbnail */}
                                            <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                                                <SafeImage src={item.thumbnail} alt={item.name} fill className="object-cover" fallback={
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                                                        <Package className="w-8 h-8 text-primary/40" />
                                                    </div>
                                                } />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                        <Package className="w-3 h-3" />
                                                        {t('cart.readyTemplate')}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                                                        <FileDigit className="w-3 h-3" />
                                                        {t('cart.digitalLicense')}
                                                    </span>
                                                </div>

                                                {/* Price */}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-lg font-black text-primary">{formatPrice(item.price)}</span>
                                                </div>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => {
                                                    removeItem(item.templateId);
                                                    toast.success(t('cart.removed'));
                                                }}
                                                className="text-red-400 hover:text-red-500 transition-colors p-1 self-start"
                                                title={t('cart.remove')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                        {t('cart.title')}
                                    </h2>

                                    {/* Coupon */}
                                    <div className="mb-6">
                                        <CouponInput
                                            orderTotal={subtotal}
                                            onCouponApplied={applyCoupon}
                                            onCouponRemoved={removeCoupon}
                                            appliedCoupon={appliedCoupon}
                                        />
                                    </div>

                                    {/* Totals */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                            <span>{t('cart.subtotal')} ({getItemCount()} {t('cart.items')})</span>
                                            <span>{formatPrice(subtotal)}</span>
                                        </div>

                                        {couponDiscount > 0 && (
                                            <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                                                <span>{t('cart.discount')}</span>
                                                <span>-{formatPrice(couponDiscount)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                            <span>{t('cart.tax')}</span>
                                            <span>{t('cart.taxFree')}</span>
                                        </div>

                                        <div className="border-t dark:border-gray-700 pt-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-black text-gray-900 dark:text-white">{t('cart.total')}</span>
                                                <span className="text-2xl font-black text-primary">{formatPrice(total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Checkout Button */}
                                    <Button
                                        onClick={handleCheckout}
                                        disabled={isProcessing}
                                        size="lg"
                                        className="w-full bg-primary hover:bg-primary/90 text-white text-lg font-bold py-5 rounded-xl gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t('cart.processing')}
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                {isAuthenticated ? t('cart.checkout') : t('nav.login')}
                                            </>
                                        )}
                                    </Button>

                                    {/* Trust Badges */}
                                    <div className="mt-5 flex items-center justify-center gap-5 text-xs text-gray-400 dark:text-gray-500">
                                        <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> {t('cart.secure')}</span>
                                        <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {t('cart.instant')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    </ScrollReveal>
                </div>
            </main>

            <Footer />
        </div>
    );
}
