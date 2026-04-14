'use client';
import { ta } from '@/i18n/auto-translations';

/**
 * MISSING-08 FIX: Referral redirect page
 *
 * Handles incoming referral links: /ref/[code]
 *
 * Flow:
 *   1. Save referral code to localStorage
 *   2. If user is logged in → call API to apply code immediately
 *   3. If user is NOT logged in → redirect to register with ?ref=CODE preserved
 *   4. Show appropriate feedback (success/already-used/invalid)
 *
 * SEO: noindex (referral pages shouldn't be indexed)
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Gift, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

type Status = 'loading' | 'success' | 'already_used' | 'invalid' | 'saved' | 'error';

export default function ReferralRedirectPage() {
  const { dir } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, _hasHydrated } = useAuthStore() as any;
    const [status, setStatus] = useState<Status>('loading');
    const [message, setMessage] = useState('');
    const [bonus, setBonus] = useState<number | null>(null);

    const code = (params?.code as string)?.toUpperCase() ?? '';

    useEffect(() => {
        if (!code) {
            setStatus('invalid');
            return;
        }

        // Wait for auth hydration before deciding
        if (!_hasHydrated) return;

        handleReferral();
    }, [code, _hasHydrated, isAuthenticated]);

    const handleReferral = async () => {
        setStatus('loading');

        // 1. Validate code first
        try {
            const validation = await api.validateReferralCode(code);
            if (!validation?.success) {
                setStatus('invalid');
                setMessage('كود الإحالة غير صالح أو منتهي الصلاحية');
                return;
            }
        } catch (err: any) {
            if (err?.message?.includes('غير صالح') || err?.message?.includes('404')) {
                setStatus('invalid');
                setMessage('كود الإحالة غير صالح أو منتهي الصلاحية');
                return;
            }
            setStatus('error');
            setMessage('حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.');
            return;
        }

        // 2. Save to localStorage regardless of auth state (for use after registration)
        if (typeof window !== 'undefined') {
            localStorage.setItem('pending_referral_code', code);
        }

        // 3. If user IS authenticated — apply code immediately
        if (isAuthenticated) {
            try {
                const res = await api.applyReferralCode(code);
                if (res?.success) {
                    setBonus(res.data?.bonus ?? 20);
                    setStatus('success');
                    // Clean up the pending code since it was applied
                    localStorage.removeItem('pending_referral_code');
                } else if (res?.error === 'already_referred') {
                    setStatus('already_used');
                    setMessage('لقد استخدمت كود إحالة من قبل. لا يمكن تطبيق كود آخر.');
                } else if (res?.error === 'self_referral') {
                    setStatus('invalid');
                    setMessage('لا يمكنك استخدام كود الإحالة الخاص بك.');
                } else {
                    setStatus('error');
                    setMessage(res?.message ?? 'حدث خطأ غير متوقع');
                }
            } catch (err: any) {
                if (err?.message?.includes('مسبقاً')) {
                    setStatus('already_used');
                    setMessage('لقد استخدمت كود إحالة من قبل.');
                } else {
                    setStatus('error');
                    setMessage(err?.message ?? 'حدث خطأ في تطبيق الكود');
                }
            }
            return;
        }

        // 4. Not authenticated → save code and redirect to register
        setStatus('saved');

        // Redirect to register after 2.5 seconds
        setTimeout(() => {
            router.push(`/register?ref=${encodeURIComponent(code)}`);
        }, 2500);
    };

    return (
        <div dir={dir} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8 text-center">

                {/* Logo / Icon */}
                <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg shadow-blue-500/25">
                    <Gift className="h-10 w-10 text-white" />
                </div>

                {/* Loading */}
                {status === 'loading' && (
                    <>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{ta('جاري التحقق من الكود...', 'Verifying code...')}</h1>
                        <p className="text-gray-500 mb-6">{ta('يرجى الانتظار', 'Please wait')}</p>
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    </>
                )}

                {/* Success */}
                {status === 'success' && (
                    <>
                        <div className="inline-flex p-3 bg-green-100 rounded-full mb-4">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{ta('تم تطبيق كود الإحالة! 🎉', 'Referral code applied! 🎉')}</h1>
                        {bonus && (
                            <p className="text-gray-600 mb-4">
                                تم إضافة{' '}
                                <span className="text-2xl font-bold text-green-600">{bonus} ر.س</span>
                                {' '}إلى رصيد إحالاتك كمكافأة ترحيبية
                            </p>
                        )}
                        <div className="bg-green-50 rounded-xl p-4 mb-6 text-sm text-green-700">
                            {ta('الكود المطبّق:', 'Applied Code:')}<span className="font-mono font-bold">{code}</span>
                        </div>
                        <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                            <Link href="/dashboard">{ta('الذهاب إلى لوحة التحكم', 'Go to Dashboard')}</Link>
                        </Button>
                    </>
                )}

                {/* Saved — redirect to register */}
                {status === 'saved' && (
                    <>
                        <div className="inline-flex p-3 bg-blue-100 rounded-full mb-4">
                            <Gift className="h-8 w-8 text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{ta('كود إحالة خاص بانتظارك!', 'Your special referral code is waiting!')}</h1>
                        <p className="text-gray-600 mb-4">
                            سجّل حساباً جديداً وستحصل على{' '}
                            <span className="font-bold text-blue-600">{ta('20 ر.س مكافأة ترحيبية', '20 SAR Welcome Bonus')}</span>
                            {' '}تُضاف فوراً لرصيدك
                        </p>
                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-600 mb-1">{ta('كود الإحالة المحفوظ:', 'Saved Referral Code:')}</p>
                            <p className="font-mono font-bold text-xl text-blue-800">{code}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {ta('جاري التوجيه لصفحة التسجيل...', 'Redirecting to registration page...')}
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href={`/register?ref=${encodeURIComponent(code)}`}>
                                {ta('التوجه للتسجيل الآن', 'Go to Register Now')}
                            </Link>
                        </Button>
                    </>
                )}

                {/* Already used */}
                {status === 'already_used' && (
                    <>
                        <div className="inline-flex p-3 bg-yellow-100 rounded-full mb-4">
                            <AlertCircle className="h-8 w-8 text-yellow-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{ta('كود الإحالة مطبّق مسبقاً', 'Referral code already applied')}</h1>
                        <p className="text-gray-500 mb-6">{message}</p>
                        <Button asChild className="w-full">
                            <Link href="/dashboard">{ta('العودة للوحة التحكم', 'Back to Dashboard')}</Link>
                        </Button>
                    </>
                )}

                {/* Invalid */}
                {status === 'invalid' && (
                    <>
                        <div className="inline-flex p-3 bg-red-100 rounded-full mb-4">
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{ta('كود الإحالة غير صالح', 'Invalid Referral Code')}</h1>
                        <p className="text-gray-500 mb-6">{message || 'يبدو أن هذا الكود غير موجود أو منتهي الصلاحية.'}</p>
                        <div className="flex flex-col gap-3">
                            <Button asChild className="w-full">
                                <Link href="/marketplace">{ta('تصفح المنصة', 'Browse Platform')}</Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/">{ta('الصفحة الرئيسية', 'Home Page')}</Link>
                            </Button>
                        </div>
                    </>
                )}

                {/* Generic Error */}
                {status === 'error' && (
                    <>
                        <div className="inline-flex p-3 bg-red-100 rounded-full mb-4">
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{ta('حدث خطأ', 'An error occurred')}</h1>
                        <p className="text-gray-500 mb-6">{message}</p>
                        <div className="flex flex-col gap-3">
                            <Button onClick={handleReferral} className="w-full gap-2">
                                <Loader2 className="h-4 w-4" />
                                {ta('إعادة المحاولة', 'Try Again')}
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/">{ta('الصفحة الرئيسية', 'Home Page')}</Link>
                            </Button>
                        </div>
                    </>
                )}

                {/* Footer note */}
                <p className="text-xs text-gray-400 mt-6">
                    {ta('منصة SERS للخدمات التعليمية الذكية', 'SERS Platform for Smart Educational Services')}
                </p>
            </div>
        </div>
    );
}
