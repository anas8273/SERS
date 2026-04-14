'use client';
import { ta } from '@/i18n/auto-translations';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/i18n/useTranslation';

type Status = 'loading' | 'success' | 'error' | 'already_verified' | 'invalid_token';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { dir } = useTranslation();

    const token = searchParams.get('token');

    const [status, setStatus] = useState<Status>('loading');
    const [message, setMessage] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSent, setResendSent] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('invalid_token');
            setMessage('رابط التأكيد غير صالح — لا يحتوي على توكن.');
            return;
        }

        (async () => {
            try {
                const res = await api.get(`/auth/email/verify/${token}`) as any;
                if (res?.success) {
                    if (res.message?.includes('مسبقاً')) {
                        setStatus('already_verified');
                    } else {
                        setStatus('success');
                    }
                    setMessage(res.message ?? '');
                } else {
                    setStatus('error');
                    setMessage(res?.message ?? 'حدث خطأ غير متوقع');
                }
            } catch (err: any) {
                const errMsg = err?.message ?? '';
                if (errMsg.includes('invalid_token') || errMsg.includes('منتهي')) {
                    setStatus('invalid_token');
                } else {
                    setStatus('error');
                }
                setMessage(errMsg || 'رابط التأكيد غير صالح أو منتهي الصلاحية');
            }
        })();
    }, [token]);

    const handleResend = async () => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        setResendLoading(true);
        try {
            await api.post('/auth/email/resend');
            setResendSent(true);
        } catch {
            /* silent — api.ts shows toast */
        } finally {
            setResendLoading(false);
        }
    };

    // ─── Render ────────────────────────────────────────────
    return (
        <div dir={dir} className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">

                    {/* Logo / Brand */}
                    <div className="mb-8">
                        <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            SERS
                        </span>
                    </div>

                    {/* ── Loading ── */}
                    {status === 'loading' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
                            </div>
                            <h1 className="text-xl font-semibold text-white mb-2">{ta('جاري التحقق...', 'Verifying...')}</h1>
                            <p className="text-slate-400 text-sm">{ta('يرجى الانتظار بينما نتحقق من بريدك الإلكتروني.', 'Please wait while we verify your email.')}</p>
                        </>
                    )}

                    {/* ── Success ── */}
                    {status === 'success' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">{ta('تم التأكيد بنجاح! 🎉', 'Successfully verified! 🎉')}</h1>
                            <p className="text-slate-400 mb-6">{ta('تم تأكيد بريدك الإلكتروني. يمكنك الآن تسجيل الدخول والاستمتاع بجميع مميزات المنصة.', 'Your email has been verified. You can now log in and enjoy all platform features.')}</p>
                            <Link
                                href="/auth/login"
                                className="block w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                                {ta('تسجيل الدخول', 'Sign In')}
                            </Link>
                        </>
                    )}

                    {/* ── Already Verified ── */}
                    {status === 'already_verified' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-12 h-12 text-blue-400" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">{ta('مؤكَّد مسبقاً', 'Pre-confirmed')}</h1>
                            <p className="text-slate-400 mb-6">{ta('البريد الإلكتروني مؤكَّد بالفعل. يمكنك تسجيل الدخول مباشرة.', 'Email already verified. You can log in directly.')}</p>
                            <Link
                                href="/auth/login"
                                className="block w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
                            >
                                {ta('تسجيل الدخول', 'Sign In')}
                            </Link>
                        </>
                    )}

                    {/* ── Error / Invalid Token ── */}
                    {(status === 'error' || status === 'invalid_token') && (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <XCircle className="w-12 h-12 text-red-400" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">{ta('رابط غير صالح', 'Invalid Link')}</h1>
                            <p className="text-slate-400 mb-6">
                                {message || 'الرابط منتهي الصلاحية (صالح لمدة 24 ساعة فقط) أو غير صحيح.'}
                            </p>

                            {/* Resend button */}
                            {!resendSent ? (
                                <button
                                    onClick={handleResend}
                                    disabled={resendLoading}
                                    className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all disabled:opacity-50"
                                >
                                    {resendLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Mail className="w-4 h-4" />
                                    )}
                                    {resendLoading ? ta('جارٍ الإرسال...', 'Sending...') : ta('إعادة إرسال رابط التأكيد', 'Resend Verification Link') }
                                </button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-emerald-400 py-3">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>{ta('تم الإرسال! تحقق من بريدك الإلكتروني.', 'Sent! Check your email.')}</span>
                                </div>
                            )}

                            <div className="mt-4">
                                <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm transition-colors">
                                    {ta('العودة لتسجيل الدخول', 'Back to Login')}
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
