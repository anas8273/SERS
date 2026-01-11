'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { CouponInput } from '@/components/cart/CouponInput';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { EmptyState } from '@/components/ui/empty-state';
import toast from 'react-hot-toast';
import type { Coupon } from '@/types';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function CartPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const {
        items,
        removeItem,
        clearCart,
        getSubtotal,
        getTotal,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
    } = useCartStore();

    const [isProcessing, setIsProcessing] = useState(false);

    const subtotal = getSubtotal();
    const total = getTotal();

    const handleCouponApplied = (coupon: Coupon, discount: number) => {
        applyCoupon(coupon, discount);
    };

    const handleCouponRemoved = () => {
        removeCoupon();
    };

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            toast.error('يجب تسجيل الدخول أولاً');
            router.push('/login');
            return;
        }

        if (items.length === 0) {
            toast.error('السلة فارغة');
            return;
        }

        setIsProcessing(true);

        try {
            // Simulate checkout process
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('جاري تحويلك لصفحة الدفع...');
            router.push('/checkout');
        } catch (error) {
            console.error('Checkout redirect error:', error);
            toast.error('حدث خطأ أثناء التحويل');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
            <Navbar />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">سلة التسوق 🛒</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {items.length} منتج في السلة
                            </p>
                        </div>
                        {items.length > 0 && (
                            <button
                                onClick={() => {
                                    clearCart();
                                    toast.success('تم إفراغ السلة');
                                }}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                            >
                                إفراغ السلة 🗑️
                            </button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <EmptyState
                            icon={<span className="text-6xl">🛒</span>}
                            title="السلة فارغة"
                            description="لم تضف أي منتجات للسلة بعد. اكتشف منتجاتنا وابدأ التسوق!"
                            action={
                                <Link href="/marketplace">
                                    <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                                        تصفح المتجر
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
                                        key={item.productId}
                                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                                            {item.thumbnail ? (
                                                <Image
                                                    src={item.thumbnail}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-700 dark:to-gray-600">
                                                    <span className="text-3xl">📚</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                {item.name}
                                            </h3>
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${item.type === 'interactive'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {item.type === 'interactive' ? 'تفاعلي' : 'ملف'}
                                            </span>
                                        </div>

                                        {/* Price & Remove */}
                                        <div className="text-left">
                                            <div className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-2">
                                                {formatPrice(item.price)}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    removeItem(item.productId);
                                                    toast.success('تم إزالة المنتج');
                                                }}
                                                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-sm"
                                            >
                                                إزالة
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                        ملخص الطلب
                                    </h2>

                                    {/* Coupon */}
                                    <div className="mb-6">
                                        <CouponInput
                                            orderTotal={subtotal}
                                            onCouponApplied={handleCouponApplied}
                                            onCouponRemoved={handleCouponRemoved}
                                            appliedCoupon={appliedCoupon}
                                        />
                                    </div>

                                    {/* Totals */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>المجموع الفرعي</span>
                                            <span>{formatPrice(subtotal)}</span>
                                        </div>

                                        {couponDiscount > 0 && (
                                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                                <span>الخصم</span>
                                                <span>-{formatPrice(couponDiscount)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>الضريبة</span>
                                            <span>0 ر.س</span>
                                        </div>

                                        <div className="border-t dark:border-gray-700 pt-3">
                                            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                                                <span>الإجمالي</span>
                                                <span className="text-primary-600 dark:text-primary-400">{formatPrice(total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Checkout Button */}
                                    <Button
                                        onClick={handleCheckout}
                                        disabled={isProcessing}
                                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 text-lg font-semibold"
                                    >
                                        {isProcessing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="animate-spin">⏳</span>
                                                جاري المعالجة...
                                            </span>
                                        ) : (
                                            'إتمام الشراء 💳'
                                        )}
                                    </Button>

                                    {/* Trust */}
                                    <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <span>🔒 دفع آمن</span>
                                        <span>⚡ وصول فوري</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

