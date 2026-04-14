'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
    CreditCard, Lock, ShoppingBag, ArrowRight, Loader2,
    Package, Shield, Zap, CheckCircle, BadgeCheck, Wallet,
    AlertCircle, Plus, Download,
} from 'lucide-react';

// ── Payment Method Type ──
type PaymentMethodType = 'wallet' | 'card';

// ── Load Stripe.js lazily (no npm install needed) ──
let stripePromise: Promise<any> | null = null;
function getStripe() {
    if (!stripePromise) {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!key) return null;
        stripePromise = new Promise((resolve) => {
            if ((window as any).Stripe) {
                resolve((window as any).Stripe(key));
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            script.onload = () => resolve((window as any).Stripe(key));
            script.onerror = () => resolve(null);
            document.head.appendChild(script);
        });
    }
    return stripePromise;
}

// [U-03] Common Stripe error messages translated to Arabic
const STRIPE_ERROR_AR: Record<string, string> = {
    'Your card was declined.': 'تم رفض البطاقة.',
    'Your card has expired.': 'انتهت صلاحية البطاقة.',
    "Your card's security code is incorrect.": 'رمز الأمان غير صحيح.',
    'Your card number is incorrect.': 'رقم البطاقة غير صحيح.',
    'Your card has insufficient funds.': 'رصيد البطاقة غير كافٍ.',
    'An error occurred while processing your card.': 'حدث خطأ أثناء معالجة البطاقة.',
    'Your card does not support this type of purchase.': 'البطاقة لا تدعم هذا النوع من العمليات.',
};

export default function CheckoutPage() {
    const router = useRouter();
    const { t, dir } = useTranslation();
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const { items, getSubtotal, getTotal, appliedCoupon, couponDiscount, clearCart } = useCartStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('wallet');
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [walletLoading, setWalletLoading] = useState(true);

    // [C-1 FIX] Stripe Elements — secure iframe, card data never touches our JS
    const [stripeReady, setStripeReady] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);
    const [cardComplete, setCardComplete] = useState(false);
    const stripeRef = useRef<any>(null);
    const cardElementRef = useRef<any>(null);
    const cardMountRef = useRef<HTMLDivElement>(null);

    const subtotal = getSubtotal();
    const total = getTotal();
    const isFreeOrder = total <= 0;
    const hasEnoughBalance = walletBalance !== null && walletBalance >= total;

    // Redirect if not authenticated or cart is empty
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) router.replace('/login?returnUrl=/checkout');
            else if (items.length === 0) router.replace('/cart');
        }
    }, [authLoading, isAuthenticated, items.length, router]);

    // Fetch wallet balance once
    useEffect(() => {
        if (!isAuthenticated) return;
        api.getWalletBalance()
            .then((res: any) => {
                if (res?.success) setWalletBalance(Number(res.data?.balance ?? 0));
            })
            .catch(() => setWalletBalance(0))
            .finally(() => setWalletLoading(false));
    }, [isAuthenticated]);

    // [C-1 FIX] Mount Stripe CardElement when card payment is selected
    // [U-05] Re-mount on dark mode toggle via MutationObserver
    useEffect(() => {
        if (paymentMethod !== 'card') return;

        let mounted = true;
        let currentCardElement: any = null;

        const createCardElement = async () => {
            const stripe = await getStripe();
            if (!stripe || !mounted) return;

            stripeRef.current = stripe;
            const elements = stripe.elements();

            // Detect dark mode
            const isDark = document.documentElement.classList.contains('dark');

            // Destroy previous element if any
            if (currentCardElement) {
                try { currentCardElement.unmount(); } catch { /* ok */ }
            }

            const cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        fontFamily: '"Inter", "Segoe UI", sans-serif',
                        color: isDark ? '#e5e7eb' : '#1f2937',
                        '::placeholder': { color: isDark ? '#6b7280' : '#9ca3af' },
                        iconColor: isDark ? '#9ca3af' : '#6b7280',
                    },
                    invalid: {
                        color: '#ef4444',
                        iconColor: '#ef4444',
                    },
                },
                hidePostalCode: true,
            });

            // Wait for the DOM element to be ready
            await new Promise(r => setTimeout(r, 50));

            if (cardMountRef.current && mounted) {
                cardElement.mount(cardMountRef.current);
                cardElementRef.current = cardElement;
                currentCardElement = cardElement;
                setStripeReady(true);

                cardElement.on('change', (event: any) => {
                    setCardError(event.error?.message || null);
                    setCardComplete(event.complete);
                });
            }
        };

        createCardElement();

        // [U-05] Watch for dark mode toggle
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === 'class') {
                    createCardElement();
                    break;
                }
            }
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => {
            mounted = false;
            observer.disconnect();
            if (currentCardElement) {
                try { currentCardElement.unmount(); } catch { /* already unmounted */ }
            }
            cardElementRef.current = null;
            setStripeReady(false);
            setCardComplete(false);
            setCardError(null);
        };
    }, [paymentMethod]);

    // ══════════════════════════════════════════════════════════════════
    // MAIN CHECKOUT HANDLER
    // ══════════════════════════════════════════════════════════════════
    const handleCheckout = useCallback(async () => {
        if (isProcessing) return;

        if (!isFreeOrder) {
            // Validate card element if paying by card
            if (paymentMethod === 'card') {
                if (!stripeReady || !cardElementRef.current) {
                    toast.error(dir === 'rtl' ? ta('جاري تحميل نموذج الدفع...', 'Loading payment form...') : 'Payment form loading...');
                    return;
                }
                if (!cardComplete) {
                    toast.error(dir === 'rtl' ? ta('يرجى إكمال بيانات البطاقة', 'Please complete card details') : 'Please complete card details');
                    return;
                }
            }

            // Validate wallet balance
            if (paymentMethod === 'wallet' && !hasEnoughBalance) {
                toast.error(dir === 'rtl' ? ta('رصيد المحفظة غير كافٍ', 'Insufficient wallet balance') : 'Insufficient wallet balance');
                return;
            }
        }

        setIsProcessing(true);

        // [U-02] Prevent accidental navigation during payment
        const preventNav = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener('beforeunload', preventNav);

        try {
            // ─── Step 1: Create order ───
            const orderResponse = await api.createOrder({
                items: items.map((item) => ({
                    template_id: item.templateId,
                })),
                payment_method: isFreeOrder ? 'wallet' : paymentMethod,
                coupon_code: appliedCoupon?.code || undefined,
            });

            if (!orderResponse?.success) throw new Error(orderResponse?.message || t('checkout.error.orderFailed'));
            const orderId = orderResponse.data?.id;
            if (!orderId) throw new Error(t('checkout.error.orderFailed'));

            // ─── Step 2: Pay (free orders auto-complete via wallet with 0 deduction) ───
            const payResponse = await api.payOrder(orderId, isFreeOrder ? 'wallet' : paymentMethod);

            if (isFreeOrder || paymentMethod === 'wallet') {
                // Wallet / Free: server handles everything
                if (!payResponse?.success) {
                    if (payResponse?.error === 'insufficient_balance') {
                        toast.error(dir === 'rtl'
                            ? `رصيدك غير كافٍ. رصيدك: ${Number(payResponse.data?.current_balance ?? 0).toFixed(2)} ر.س`
                            : `Insufficient balance. Current: ${Number(payResponse.data?.current_balance ?? 0).toFixed(2)} SAR`,
                            { duration: 6000 });
                        setWalletBalance(payResponse.data?.current_balance ?? 0);
                        return;
                    }
                    throw new Error(payResponse?.message || t('checkout.error.generic'));
                }
            } else {
                // [C-1 FIX] Card: Use Stripe Elements secure flow
                if (!payResponse?.success) throw new Error(payResponse?.message || t('checkout.error.generic'));

                const clientSecret = payResponse.data?.client_secret;
                if (!clientSecret) throw new Error(dir === 'rtl' ? ta('فشل إنشاء طلب الدفع', 'Failed to create payment request') : 'Failed to create payment intent');

                const stripe = stripeRef.current;
                if (!stripe || !cardElementRef.current) {
                    throw new Error(dir === 'rtl' ? ta('خدمة الدفع غير متاحة', 'Payment service unavailable') : 'Payment service unavailable');
                }

                const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: cardElementRef.current,
                        billing_details: { name: user?.name || 'Customer' },
                    },
                });

                if (confirmError) {
                    // [U-03] Translate common Stripe errors to Arabic
                    const msg = (dir === 'rtl' && STRIPE_ERROR_AR[confirmError.message])
                        ? STRIPE_ERROR_AR[confirmError.message]
                        : confirmError.message || (dir === 'rtl' ? ta('فشل الدفع بالبطاقة', 'Card payment failed') : 'Card payment failed');
                    throw new Error(msg);
                }
            }

            // ─── Step 3: Success ───
            clearCart();
            toast.success(
                isFreeOrder
                    ? (dir === 'rtl' ? ta('تم الحصول على القالب المجاني بنجاح! 🎉', 'Free template obtained successfully! 🎉') : 'Free template obtained successfully! 🎉')
                    : (dir === 'rtl' ? ta('تم الشراء بنجاح! القوالب جاهزة للتحميل 📥', 'Purchase successful! Templates ready for download 📥') : 'Purchase complete! Templates ready for download 📥'),
                { duration: 4000 }
            );
            router.push(`/order-success?id=${orderId}`);

        } catch (error: any) {
            toast.error(error.message || t('checkout.error.generic'));
        } finally {
            window.removeEventListener('beforeunload', preventNav); // [U-02] Re-allow navigation
            setIsProcessing(false);
        }
    }, [isProcessing, paymentMethod, items, appliedCoupon, hasEnoughBalance, stripeReady, cardComplete, dir, t, user, router, clearCart, total]);

    if (authLoading || !isAuthenticated || items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors" dir={dir}>
            <Navbar />

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4 animate-in fade-in zoom-in-95">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 animate-pulse">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">{t('checkout.processing')}</h3>
                        <p className="text-sm text-gray-500 text-center">{t('checkout.trust.encryption')}</p>
                        <div className="flex gap-1.5 mt-2">
                            {[0, 1, 2].map(i => (
                                <span key={i} className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 pt-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Header */}
                    <div className="mb-8 flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl text-white shadow-xl shadow-primary/25">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('checkout.title')}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('checkout.subtitle')}</p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* ═══ LEFT: Payment Methods (3 cols) ═══ */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Payment Method Selector */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                        {t('checkout.selectMethod')}
                                    </h2>
                                </div>

                                {/* Method Tabs */}
                                <div className="grid grid-cols-2 border-b border-gray-100 dark:border-gray-700">
                                    {([
                                        { key: 'wallet' as const, label: dir === 'rtl' ? ta('المحفظة', 'Wallet') : 'Wallet', icon: <Wallet className="w-5 h-5" /> },
                                        { key: 'card' as const, label: dir === 'rtl' ? ta('بطاقة ائتمان / مدى', 'Credit / Debit Card') : 'Credit Card / Mada', icon: <CreditCard className="w-5 h-5" /> },
                                    ]).map(method => (
                                        <button
                                            key={method.key}
                                            onClick={() => setPaymentMethod(method.key)}
                                            className={`py-4 px-3 text-center text-sm font-bold transition-all relative flex flex-col items-center gap-1.5 ${
                                                paymentMethod === method.key
                                                    ? 'text-primary bg-primary/5 dark:bg-primary/10'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                        >
                                            {method.icon}
                                            {method.label}
                                            {paymentMethod === method.key && (
                                                <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-full transition-all" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Payment Form Content */}
                                <div className="p-5">
                                    {/* ── Wallet ── */}
                                    {paymentMethod === 'wallet' && (
                                        <div>
                                            {walletLoading ? (
                                                <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
                                            ) : (
                                                <>
                                                    <div className={`rounded-xl p-4 flex items-center justify-between ${
                                                        hasEnoughBalance
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                                    }`}>
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                                                                {dir === 'rtl' ? ta('رصيدك الحالي', 'Your Current Balance') : 'Your Balance'}
                                                            </p>
                                                            <p className={`text-2xl font-black ${hasEnoughBalance ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {Number(walletBalance ?? 0).toFixed(2)} <span className="text-sm font-medium">{t('common.sar')}</span>
                                                            </p>
                                                        </div>
                                                        {hasEnoughBalance
                                                            ? <CheckCircle className="w-8 h-8 text-emerald-500" />
                                                            : <AlertCircle className="w-8 h-8 text-red-500" />
                                                        }
                                                    </div>

                                                    {!hasEnoughBalance && (
                                                        <div className="mt-4 space-y-3">
                                                            <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                                {dir === 'rtl'
                                                                    ? `رصيدك غير كافٍ. تحتاج ${(total - (walletBalance ?? 0)).toFixed(2)} ر.س إضافية`
                                                                    : `Insufficient balance. You need ${(total - (walletBalance ?? 0)).toFixed(2)} SAR more`
                                                                }
                                                            </p>
                                                            <Link href="/settings?tab=wallet">
                                                                <Button variant="outline" className="w-full gap-2 rounded-xl border-primary text-primary hover:bg-primary/5">
                                                                    <Plus className="w-4 h-4" />
                                                                    {dir === 'rtl' ? ta('شحن رصيد المحفظة', 'Recharge Wallet Balance') : 'Top Up Wallet'}
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* ── Card (Stripe Elements — PCI Compliant) ── */}
                                    {paymentMethod === 'card' && (
                                        <div className="space-y-4">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                                {dir === 'rtl' ? ta('بيانات البطاقة', 'Card Details') : 'Card Details'}
                                            </label>

                                            {/* Stripe CardElement mounts here — secure iframe */}
                                            <div
                                                ref={cardMountRef}
                                                className={`p-4 rounded-xl border-2 transition-colors bg-white dark:bg-gray-700/50 min-h-[52px] ${
                                                    cardError 
                                                        ? 'border-red-400' 
                                                        : cardComplete 
                                                            ? 'border-emerald-400' 
                                                            : 'border-gray-200 dark:border-gray-600 focus-within:border-primary'
                                                }`}
                                            />

                                            {/* Stripe validation errors */}
                                            {cardError && (
                                                <p className="text-xs text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {cardError}
                                                </p>
                                            )}

                                            {/* Card complete indicator */}
                                            {cardComplete && !cardError && (
                                                <p className="text-xs text-emerald-500 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {dir === 'rtl' ? ta('بيانات البطاقة صحيحة', 'Card details are correct') : 'Card details valid'}
                                                </p>
                                            )}

                                            {!stripeReady && (
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    {dir === 'rtl' ? ta('جاري تحميل نموذج الدفع الآمن...', 'Loading secure payment form...') : 'Loading secure payment form...'}
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Shield className="w-3 h-3" />
                                                {dir === 'rtl' ? ta('بيانات البطاقة مشفرة ومحمية عبر Stripe — لا تمر عبر خوادمنا', 'Card data is encrypted and protected via Stripe — does not pass through our servers') : 'Card data encrypted by Stripe — never touches our servers'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    {t('checkout.customerInfo')}
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                        <span className="text-xs text-gray-400">{t('checkout.customerName')}</span>
                                        <p className="font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                        <span className="text-xs text-gray-400">{t('checkout.customerEmail')}</span>
                                        <p className="font-bold text-gray-900 dark:text-white truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══ RIGHT: Order Summary (2 cols) ═══ */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-primary" />
                                    {t('checkout.orderSummary')}
                                </h2>

                                {/* Items */}
                                <div className="space-y-2.5 mb-5 max-h-40 overflow-y-auto">
                                    {items.map((item) => (
                                        <div key={item.templateId} className="flex gap-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5">
                                            <div className="relative w-11 h-11 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                                <SafeImage src={item.thumbnail} alt={item.name} fill className="object-cover" fallback={
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-300" />
                                                    </div>
                                                } />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                                                <p className="text-[10px] text-gray-500">{dir === 'rtl' ? ta('قالب رقمي', 'Digital Template') : 'Digital template'}</p>
                                            </div>
                                            <span className="font-bold text-xs text-gray-900 dark:text-white self-center">
                                                {formatPrice(item.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t dark:border-gray-700 pt-4 space-y-2.5 text-sm">
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                        <span>{t('checkout.subtotal')}</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>

                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <BadgeCheck className="w-3.5 h-3.5" />
                                                {t('checkout.discount')} ({appliedCoupon?.code})
                                            </span>
                                            <span>-{formatPrice(couponDiscount)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                        <span>{t('checkout.vat')}</span>
                                        <span>{t('checkout.vatIncluded')}</span>
                                    </div>

                                    <div className="border-t dark:border-gray-700 pt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-black text-gray-900 dark:text-white">{t('checkout.total')}</span>
                                            <span className="text-2xl font-black text-primary">{formatPrice(total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <Button
                                    onClick={handleCheckout}
                                    disabled={isProcessing || (!isFreeOrder && paymentMethod === 'wallet' && (walletLoading || !hasEnoughBalance)) || (!isFreeOrder && paymentMethod === 'card' && (!stripeReady || !cardComplete))}
                                    size="lg"
                                    className={`w-full mt-6 text-white text-lg font-black py-6 rounded-2xl gap-2.5 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                                        isFreeOrder
                                            ? 'bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-600/25'
                                            : 'bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-600/25 hover:shadow-violet-600/35'
                                    }`}
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" />{t('checkout.processing')}</>
                                    ) : isFreeOrder ? (
                                        <><Download className="w-5 h-5" />{dir === 'rtl' ? ta('احصل عليه مجاناً 🎁', 'Get it free 🎁') : 'Get it Free 🎁'}</>
                                    ) : (
                                        <><Lock className="w-5 h-5" />{t('checkout.payNow')} — {formatPrice(total)}</>
                                    )}
                                </Button>

                                {/* Payment Method Indicator */}
                                <div className="mt-3 text-center">
                                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
                                        {paymentMethod === 'wallet' && <><Wallet className="w-3.5 h-3.5" /> {dir === 'rtl' ? ta('الدفع من المحفظة', 'Pay from Wallet') : 'Paying from wallet'}</>}
                                        {paymentMethod === 'card' && <><CreditCard className="w-3.5 h-3.5" /> {dir === 'rtl' ? ta('الدفع ببطاقة الائتمان / مدى', 'Pay with Credit / Debit Card') : 'Paying by credit card / mada'}</>}
                                    </span>
                                </div>

                                {/* Trust Badges */}
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {[
                                        { icon: <Shield className="w-4 h-4 text-emerald-500" />, text: t('checkout.trust.encryption') },
                                        { icon: <Zap className="w-4 h-4 text-amber-500" />, text: t('checkout.trust.instant') },
                                    ].map((badge, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-700/30 px-2.5 py-2 rounded-lg">
                                            {badge.icon}
                                            {badge.text}
                                        </div>
                                    ))}
                                </div>

                                {/* Back Link */}
                                <Link href="/cart" className="flex items-center justify-center gap-1.5 text-sm text-primary hover:underline mt-4 font-medium">
                                    <ArrowRight className="w-4 h-4" />
                                    {t('checkout.backToCart')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
