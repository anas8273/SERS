'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function CheckoutPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const { items, getSubtotal, getTotal, appliedCoupon, couponDiscount, clearCart } = useCartStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'mada'>('stripe');

    const subtotal = getSubtotal();
    const total = getTotal();

    // Redirect if not authenticated or cart is empty
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (items.length === 0) {
                router.push('/cart');
            }
        }
    }, [authLoading, isAuthenticated, items.length, router]);

    const handleCheckout = async () => {
        setIsProcessing(true);

        try {
            // Create order
            const orderPayload = items.map((item) => ({
                template_id: item.templateId,
            }));

            const orderResponse = await api.createOrder(orderPayload);

            if (!orderResponse.success) {
                throw new Error(orderResponse.message || 'فشل في إنشاء الطلب');
            }

            // For demo purposes, simulate successful payment
            // In production, integrate with Stripe/Mada here
            if (orderResponse.data?.id) {
                await api.payOrder(orderResponse.data.id);
            } else {
                // Fallback if ID is missing (should not happen)
                console.error('Order ID missing in response');
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Clear cart and redirect
            clearCart();
            toast.success('تم إتمام الطلب بنجاح! 🎉');
            router.push(`/dashboard?order_success=true`);

        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'حدث خطأ أثناء إتمام الطلب');
        } finally {
            setIsProcessing(false);
        }
    };

    if (authLoading || items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
            <Navbar />

            <main className="flex-1">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إتمام الشراء 💳</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">خطوة واحدة للحصول على منتجاتك</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Order Summary */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">ملخص الطلب</h2>

                            <div className="space-y-4 mb-6">
                                {items.map((item) => (
                                    <div key={item.templateId} className="flex gap-4">
                                        <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.thumbnail ? (
                                                <Image
                                                    src={item.thumbnail}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-700 dark:to-gray-600">
                                                    <span className="text-2xl">📚</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                {item.name}
                                            </h3>
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${item.type === 'interactive'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {item.type === 'interactive' ? 'تفاعلي' : 'ملف'}
                                            </span>
                                        </div>
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {formatPrice(item.price)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>المجموع الفرعي</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>

                                {couponDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                        <span>الخصم ({appliedCoupon?.code})</span>
                                        <span>-{formatPrice(couponDiscount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t dark:border-gray-700">
                                    <span>الإجمالي</span>
                                    <span className="text-primary-600 dark:text-primary-400">{formatPrice(total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className="space-y-6">
                            {/* User Info */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">معلومات العميل</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            الاسم
                                        </label>
                                        <Input
                                            type="text"
                                            value={user?.name || ''}
                                            disabled
                                            className="bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            البريد الإلكتروني
                                        </label>
                                        <Input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">طريقة الدفع</h2>

                                <div className="space-y-3">
                                    <label
                                        className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'stripe'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="stripe"
                                            checked={paymentMethod === 'stripe'}
                                            onChange={() => setPaymentMethod('stripe')}
                                            className="w-4 h-4 text-primary-600"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 dark:text-white">💳 بطاقة ائتمانية</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Visa, Mastercard, AMEX</div>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'mada'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="mada"
                                            checked={paymentMethod === 'mada'}
                                            onChange={() => setPaymentMethod('mada')}
                                            className="w-4 h-4 text-primary-600"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 dark:text-white">🏦 مدى</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">الدفع ببطاقة مدى</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Submit */}
                            <Button
                                onClick={handleCheckout}
                                disabled={isProcessing}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 text-lg font-semibold"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">⏳</span>
                                        جاري معالجة الدفع...
                                    </span>
                                ) : (
                                    `ادفع ${formatPrice(total)} 🔐`
                                )}
                            </Button>

                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                🔒 معاملاتك مشفرة وآمنة 100%
                            </p>

                            <Link href="/cart" className="block text-center text-primary-600 dark:text-primary-400 hover:underline">
                                ← العودة للسلة
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
