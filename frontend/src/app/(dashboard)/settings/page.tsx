'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { PageBreadcrumb } from '@/components/ui/breadcrumb';
import {
    User,
    Lock,
    Wallet,
    Eye,
    EyeOff,
    ShieldCheck,
    ShieldAlert,
    Shield,
    TrendingUp,
    TrendingDown,
    CameraIcon,
    CreditCard,
    Loader2,
    Plus,
    LogOut,
} from 'lucide-react';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

// ── Load Stripe.js lazily ──
let stripePromise: Promise<any> | null = null;
function getStripe() {
    if (!stripePromise) {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!key) return null;
        stripePromise = new Promise((resolve) => {
            if ((window as any).Stripe) { resolve((window as any).Stripe(key)); return; }
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

// ── Wallet Top-Up Component ──
const TOPUP_AMOUNTS = [10, 25, 50, 100];

// Common Stripe error messages translated to Arabic
const STRIPE_TOPUP_ERROR_AR: Record<string, string> = {
    'Your card was declined.': 'تم رفض البطاقة.',
    'Your card has expired.': 'انتهت صلاحية البطاقة.',
    "Your card's security code is incorrect.": 'رمز الأمان غير صحيح.',
    'Your card number is incorrect.': 'رقم البطاقة غير صحيح.',
    'Your card has insufficient funds.': 'رصيد البطاقة غير كافٍ.',
    'An error occurred while processing your card.': 'حدث خطأ أثناء معالجة البطاقة.',
};

function WalletTopupSection({ onSuccess, locale, t, userName }: { onSuccess: () => void; locale: string; t: any; userName?: string }) {
    const isRTL = locale === 'ar';
    const [amount, setAmount] = useState<number>(25);
    const [customAmount, setCustomAmount] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Stripe card states
    const cardMountRef = useRef<HTMLDivElement>(null);
    const cardElementRef = useRef<any>(null);
    const [cardError, setCardError] = useState<string | null>(null);
    const [cardComplete, setCardComplete] = useState(false);

    const finalAmount = isCustom ? Number(customAmount) || 0 : amount;

    // Initialize Stripe CardElement
    useEffect(() => {
        let mounted = true;
        const initStripe = async () => {
            const stripe = await getStripe();
            if (!stripe || !mounted) return;
            const elements = stripe.elements();
            const isDark = document.documentElement.classList.contains('dark');
            const cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        fontFamily: '"Inter", "Segoe UI", sans-serif',
                        color: isDark ? '#e5e7eb' : '#1f2937',
                        '::placeholder': { color: isDark ? '#6b7280' : '#9ca3af' },
                        iconColor: isDark ? '#9ca3af' : '#6b7280',
                    },
                    invalid: { color: '#ef4444', iconColor: '#ef4444' },
                },
                hidePostalCode: true,
            });

            await new Promise(r => setTimeout(r, 50));
            if (cardMountRef.current && mounted) {
                cardElement.mount(cardMountRef.current);
                cardElementRef.current = cardElement;
                cardElement.on('change', (event: any) => {
                    setCardError(event.error?.message || null);
                    setCardComplete(event.complete);
                });
            }
        };
        initStripe();
        return () => {
            mounted = false;
            if (cardElementRef.current) cardElementRef.current.destroy();
        };
    }, []);

    const handleTopup = async () => {
        if (processing || finalAmount < 10) {
            toast.error(isRTL ? ta('الحد الأدنى 10 ر.س', 'Minimum 10 SAR') : 'Minimum is 10 SAR');
            return;
        }
        if (finalAmount > 10000) {
            toast.error(isRTL ? ta('الحد الأقصى 10,000 ر.س', 'Maximum 10,000 SAR') : 'Maximum is 10,000 SAR');
            return;
        }
        if (!cardComplete || !cardElementRef.current) {
            toast.error(isRTL ? ta('يرجى إكمال بيانات البطاقة بشكل صحيح', 'Please complete card details correctly') : 'Please complete card details');
            return;
        }

        setProcessing(true);
        try {
            const res = await api.walletTopup(finalAmount);
            if (!res?.success) throw new Error(res?.message || (isRTL ? ta('فشل إنشاء طلب الدفع', 'Failed to create payment request') : 'Failed'));

            const clientSecret = (res.data as any)?.client_secret;
            if (!clientSecret) throw new Error(isRTL ? ta('فشل إنشاء طلب الدفع', 'Failed to create payment request') : 'No client secret');

            const stripe = await getStripe();
            if (!stripe) throw new Error(isRTL ? ta('خدمة الدفع غير متاحة', 'Payment service unavailable') : 'Stripe unavailable');

            const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElementRef.current,
                    billing_details: {
                        name: userName || 'SERS User',
                    },
                },
            });

            if (confirmError) {
                const msg = (isRTL && STRIPE_TOPUP_ERROR_AR[confirmError.message])
                    ? STRIPE_TOPUP_ERROR_AR[confirmError.message]
                    : confirmError.message || (isRTL ? ta('فشلت عملية الدفع بالبطاقة', 'Card payment failed') : 'Payment failed');
                throw new Error(msg);
            }

            // Directly confirm with backend to credit wallet immediately
            const piId = (res.data as any)?.payment_intent_id;
            if (piId) {
                try {
                    await api.confirmWalletTopup(piId);
                } catch {
                    // Webhook will handle it as fallback
                }
            }

            toast.success(isRTL ? ta('تم شحن المحفظة بنجاح! ✅', 'Wallet topped up successfully! ✅') : 'Wallet topped up successfully! ✅');
            onSuccess();

        } catch (err: any) {
            toast.error(err.message || (isRTL ? ta('فشلت عملية الشحن', 'Top-up failed') : 'Top-up failed'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                {isRTL ? ta('شحن الرصيد', 'Top Up Balance') : 'Top Up Balance'}
            </h3>

            {/* Amount Presets */}
            <div className="grid grid-cols-4 gap-2 mb-3">
                {TOPUP_AMOUNTS.map(a => (
                    <button
                        key={a}
                        onClick={() => { setAmount(a); setIsCustom(false); }}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                            !isCustom && amount === a
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {a} {isRTL ? ta('ر.س', 'SAR') : 'SAR'}
                    </button>
                ))}
            </div>

            {/* Custom Amount */}
            <div className="mb-4">
                <button
                    onClick={() => setIsCustom(true)}
                    className={`text-xs font-medium mb-2 ${isCustom ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {isRTL ? ta('مبلغ مختلف', 'Custom Amount') : 'Custom amount'}
                </button>
                {isCustom && (
                    <Input
                        type="number"
                        min={10}
                        max={10000}
                        placeholder={isRTL ? ta('ادخل المبلغ (10 - 10,000)', 'Enter amount (10 - 10,000)') : 'Amount (10 - 10,000)'}
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        className="h-12 rounded-xl text-lg font-bold text-center"
                        dir="ltr"
                    />
                )}
            </div>

            {/* Stripe Card Input */}
            <div className={`mb-4 p-4 rounded-xl border transition-colors ${
                cardError 
                    ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10' 
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700/50 dark:bg-gray-900/50'
            }`}>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                    {isRTL ? ta('بيانات البطاقة', 'Card Details') : 'Card Details'}
                </div>
                <div ref={cardMountRef} className="min-h-[24px] w-full" />
                {cardError && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium whitespace-pre-wrap">
                        {cardError}
                    </p>
                )}
            </div>

            {/* Test Card Info */}
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-bold mb-1">
                    {isRTL ? ta('🧪 بطاقة اختبارية للتجربة:', '🧪 Test card for testing:') : '🧪 Test card for testing:'}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-mono" dir="ltr">
                    4242 4242 4242 4242 &nbsp;|&nbsp; 12/34 &nbsp;|&nbsp; 567
                </p>
            </div>

            {/* Pay Button */}
            <Button
                onClick={handleTopup}
                disabled={processing || finalAmount < 10}
                className="w-full bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-5 rounded-xl gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
                {processing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {isRTL ? ta('جاري الشحن...', 'Processing top-up...') : 'Processing...'}</>
                ) : (
                    <><CreditCard className="w-5 h-5" /> {isRTL ? `شحن ${finalAmount} ر.س` : `Add ${finalAmount} SAR`}</>
                )}
            </Button>

            <p className="text-center text-[10px] text-gray-400 mt-2">
                {isRTL ? ta('الدفع الآمن عبر Stripe', 'Secure Payment via Stripe') : 'Secure payment via Stripe'}
            </p>
        </div>
    );
}

// Allowed avatar MIME types
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Password strength calculator
function getPasswordStrength(pw: string): { level: 'weak' | 'medium' | 'strong' } {
    if (!pw) return { level: 'weak' };
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const long = pw.length >= 12;
    const score = [hasUpper, hasLower, hasNumber, hasSpecial, long].filter(Boolean).length;
    if (score <= 2) return { level: 'weak' };
    if (score <= 3) return { level: 'medium' };
    return { level: 'strong' };
}

type Tab = 'profile' | 'password' | 'wallet';

export default function SettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, locale } = useTranslation();
    const { user, isAuthenticated, isLoading: authLoading, fetchUser } = useAuthStore();

    // Read ?tab= from URL to allow direct linking (e.g. from checkout insufficient balance)
    const tabParam = searchParams.get('tab') as Tab | null;
    const [activeTab, setActiveTab] = useState<Tab>(
        tabParam && ['profile', 'password', 'wallet'].includes(tabParam) ? tabParam : 'profile'
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Profile form
    const [profileData, setProfileData] = useState({ name: '', phone: '' });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Password form
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const pwStrength = getPasswordStrength(passwordData.new_password);

    // Wallet state
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
    const [walletLoading, setWalletLoading] = useState(false);
    const walletPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push('/login');
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name || '', phone: (user as any).phone || '' });
            setAvatarPreview((user as any).avatar_url || null);
        }
    }, [user]);

    // Force-refresh wallet data (bypasses cache check)
    const refreshWallet = useCallback(async () => {
        setWalletLoading(true);
        try {
            const [balRes, txRes] = await Promise.all([
                api.getWalletBalance(),
                api.getWalletTransactions(),
            ]);
            if ((balRes as any)?.success) setWalletBalance((balRes as any).data?.balance ?? 0);
            if ((txRes as any)?.success) setWalletTransactions((txRes as any).data?.data ?? (txRes as any).data ?? []);
        } catch {
            // toast already handled by api interceptor
        } finally {
            setWalletLoading(false);
        }
    }, []);

    // Fetch wallet data when wallet tab is activated (only if not loaded yet)
    const fetchWallet = useCallback(async () => {
        if (walletBalance !== null) return;
        await refreshWallet();
    }, [walletBalance, refreshWallet]);

    useEffect(() => {
        if (activeTab === 'wallet') fetchWallet();
    }, [activeTab, fetchWallet]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (walletPollRef.current) clearInterval(walletPollRef.current);
        };
    }, []);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            toast.error(locale === 'ar' ? ta('نوع الملف غير مدعوم. يُسمح فقط بـ JPG, PNG, WEBP, GIF', 'File type not supported. Only JPG, PNG, WEBP, GIF are allowed') : 'Unsupported file type. Only JPG, PNG, WEBP, GIF allowed');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error(locale === 'ar' ? ta('حجم الصورة يجب أن يكون أقل من 2MB', 'Image size must be less than 2MB') : 'Image size must be less than 2MB');
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            if (profileData.phone) formData.append('phone', profileData.phone);
            if (avatarFile) formData.append('avatar', avatarFile);

            const data = await api.updateProfile(formData);

            if (data.success) {
                toast.success(t('common.success') + ' ✅');
                fetchUser();
            } else {
                toast.error(data.message || t('common.error'));
            }
        } catch {
            toast.error(t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            toast.error(t('settings.passwordMismatch'));
            return;
        }
        if (passwordData.new_password.length < 8) {
            toast.error(locale === 'ar' ? ta('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters') : 'Password must be at least 8 characters');
            return;
        }
        setIsSubmitting(true);
        try {
            const data = await api.changePassword(passwordData);
            if (data.success) {
                toast.success(t('settings.changePassword') + ' ✅');
                setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
            } else {
                toast.error(data.message || t('common.error'));
            }
        } catch {
            toast.error(t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
                <div className="animate-pulse w-12 h-12 rounded-2xl bg-primary/20" />
            </div>
        );
    }

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'profile', label: t('settings.profile'), icon: <User className="w-4 h-4" /> },
        { id: 'password', label: t('settings.password'), icon: <Lock className="w-4 h-4" /> },
        { id: 'wallet', label: t('settings.wallet'), icon: <Wallet className="w-4 h-4" /> },
    ];

    return (
        <div className="pt-8 pb-16">
            <div className="max-w-2xl mx-auto px-4">
                <PageBreadcrumb pageName={t('settings.title')} />

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title')} ⚙️</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{t('settings.subtitle')}</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* ── Profile Tab ── */}
                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative w-24 h-24">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ring-4 ring-primary/20">
                                        {avatarPreview ? (
                                            <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">
                                                {user?.name?.charAt(0) || '؟'}
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 end-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-colors">
                                        <CameraIcon className="w-3.5 h-3.5 text-white" />
                                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-400">JPG, PNG, WEBP — {t('settings.avatarSizeLimit')}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.fullName')}</label>
                                <Input
                                    type="text"
                                    value={profileData.name}
                                    onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                    placeholder={t('settings.fullNamePlaceholder')}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.email')}</label>
                                <Input type="email" value={user?.email || ''} disabled className="opacity-60" />
                                <p className="text-xs text-gray-400 mt-1">{t('settings.emailNote')}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.phone')}</label>
                                <Input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                    placeholder="+966500000000"
                                />
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? t('settings.saving') : t('settings.saveChanges')}
                            </Button>
                        </form>
                    </div>
                )}

                {/* ── Password Tab ── */}
                {activeTab === 'password' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            {/* Current password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.currentPassword')}</label>
                                <div className="relative">
                                    <Input
                                        type={showCurrentPw ? 'text' : 'password'}
                                        value={passwordData.current_password}
                                        onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        placeholder="••••••••"
                                        required
                                        className="pe-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPw(v => !v)}
                                        className="absolute top-1/2 end-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* New password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.newPassword')}</label>
                                <div className="relative">
                                    <Input
                                        type={showNewPw ? 'text' : 'password'}
                                        value={passwordData.new_password}
                                        onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                        className="pe-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPw(v => !v)}
                                        className="absolute top-1/2 end-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Password strength indicator */}
                                {passwordData.new_password && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex gap-1">
                                            {(['weak', 'medium', 'strong'] as const).map((lvl, i) => (
                                                <div
                                                    key={lvl}
                                                    className={`h-1.5 flex-1 rounded-full transition-all ${
                                                        ['weak', 'medium', 'strong'].indexOf(pwStrength.level) >= i
                                                            ? pwStrength.level === 'strong' ? 'bg-green-500' : pwStrength.level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                                                            : 'bg-gray-200 dark:bg-gray-600'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {pwStrength.level === 'strong' && <ShieldCheck className="w-3.5 h-3.5 text-green-500" />}
                                            {pwStrength.level === 'medium' && <Shield className="w-3.5 h-3.5 text-yellow-500" />}
                                            {pwStrength.level === 'weak' && <ShieldAlert className="w-3.5 h-3.5 text-red-500" />}
                                            <span className={`text-xs font-medium ${
                                                pwStrength.level === 'strong' ? 'text-green-500' :
                                                pwStrength.level === 'medium' ? 'text-yellow-500' : 'text-red-500'
                                            }`}>
                                                {t('settings.passwordStrength')}: {pwStrength.level === 'strong' ? t('settings.pwStrong') : pwStrength.level === 'medium' ? t('settings.pwMedium') : t('settings.pwWeak')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.confirmPassword')}</label>
                                <Input
                                    type="password"
                                    value={passwordData.new_password_confirmation}
                                    onChange={e => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                                    placeholder="••••••••"
                                    minLength={8}
                                    required
                                />
                                {passwordData.new_password_confirmation && passwordData.new_password !== passwordData.new_password_confirmation && (
                                    <p className="text-xs text-red-500 mt-1">{t('settings.passwordMismatch')}</p>
                                )}
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? t('settings.changing') : t('settings.changePassword')}
                            </Button>
                        </form>

                        {/* [C-05] Logout from all devices */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <LogOut className="w-4 h-4 text-red-500" />
                                        {locale === 'ar' ? ta('تسجيل الخروج من جميع الأجهزة', 'Log out from all devices') : 'Logout from all devices'}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {locale === 'ar'
                                            ? ta('سيتم إلغاء جميع جلساتك النشطة على جميع الأجهزة', 'All your active sessions on all devices will be cancelled') : 'This will revoke all your active sessions on all devices'
                                        }
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!confirm(locale === 'ar' ? ta('هل أنت متأكد من تسجيل الخروج من جميع الأجهزة؟', 'Are you sure you want to log out from all devices?') : 'Are you sure you want to logout from all devices?')) return;
                                        try {
                                            // [FIX TS2551] logoutAll() not in ApiClient — use logout() which invalidates the token on backend
                                            // (Sanctum revokes the current token; a dedicated /auth/logout-all endpoint can be added later)
                                            const res = await api.logout() as any;
                                            if (res?.success !== false) {
                                                toast.success(locale === 'ar' ? ta('تم تسجيل الخروج من جميع الأجهزة ✅', 'Logged out from all devices ✅') : 'Logged out from all devices ✅');
                                                // Redirect to login since current session is also revoked
                                                setTimeout(() => router.push('/login'), 1500);
                                            }
                                        } catch {
                                            toast.error(locale === 'ar' ? ta('حدث خطأ', 'An error occurred') : 'An error occurred');
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors"
                                >
                                    {locale === 'ar' ? ta('خروج من الكل', 'Log Out of All') : 'Logout All'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Wallet Tab ── */}
                {activeTab === 'wallet' && (
                    <div className="space-y-4">
                        {/* Balance card */}
                        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-lg shadow-primary/20">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-white/70">{t('settings.walletBalance')}</p>
                                <button
                                    onClick={refreshWallet}
                                    disabled={walletLoading}
                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                                    title={locale === 'ar' ? ta('تحديث الرصيد', 'Update Balance') : 'Refresh balance'}
                                >
                                    <svg className={`w-4 h-4 ${walletLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                            {walletLoading && walletBalance === null ? (
                                <div className="h-10 w-36 bg-white/20 rounded animate-pulse" />
                            ) : (
                                <p className="text-4xl font-black tabular-nums">
                                    {walletBalance?.toFixed(2) ?? '0.00'}
                                    <span className="text-lg font-medium ms-2">{t('common.sar')}</span>
                                </p>
                            )}
                        </div>

                        {/* Top Up Section */}
                        <WalletTopupSection
                            onSuccess={async () => {
                                // confirmTopup already credited the wallet before this fires,
                                // so just fetch fresh data immediately (bust cache)
                                setWalletLoading(true);
                                try {
                                    const [balRes, txRes] = await Promise.all([
                                        api.getWalletBalance(),
                                        api.getWalletTransactions(1, true), // bust=true to skip cache
                                    ]);
                                    if ((balRes as any)?.success) setWalletBalance((balRes as any).data?.balance ?? 0);
                                    if ((txRes as any)?.success) {
                                        setWalletTransactions((txRes as any).data?.data ?? (txRes as any).data ?? []);
                                    }
                                } catch {
                                    // fallback: try once more after 2s
                                    await new Promise(r => setTimeout(r, 2000));
                                    await refreshWallet();
                                } finally {
                                    setWalletLoading(false);
                                }
                            }}
                            locale={locale}
                            t={t}
                            userName={user?.name}
                        />

                        {/* Transactions */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('settings.recentTransactions')}</h3>
                                {walletTransactions.length > 0 && (
                                    <span className="text-xs text-gray-400">{walletTransactions.length} {locale === 'ar' ? ta('معاملة', 'Transaction') : 'transactions'}</span>
                                )}
                            </div>
                            {walletLoading && walletTransactions.length === 0 ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />)}
                                </div>
                            ) : walletTransactions.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Wallet className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-400 text-sm">{t('settings.noTransactions')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {walletTransactions.slice(0, 15).map((tx: any, i: number) => {
                                        const amt = Number(tx.amount ?? 0);
                                        const isCredit = amt > 0;
                                        // Map type to Arabic label
                                        const typeLabel: Record<string, string> = {
                                            deposit: locale === 'ar' ? ta('شحن رصيد', 'Balance Top-up') : 'Top-up',
                                            withdrawal: locale === 'ar' ? ta('سحب', 'Withdrawal') : 'Withdrawal',
                                            purchase: locale === 'ar' ? ta('شراء', 'Purchase') : 'Purchase',
                                            refund: locale === 'ar' ? ta('استرداد', 'Refund') : 'Refund',
                                        };
                                        const label = tx.description || typeLabel[tx.type] || t('settings.transaction');
                                        const dateStr = tx.created_at
                                            ? new Date(tx.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                            : '';
                                        const timeStr = tx.created_at
                                            ? new Date(tx.created_at).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                                            : '';
                                        return (
                                            <div key={tx.id || i} className="flex items-center justify-between py-3.5 gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                        isCredit
                                                            ? 'bg-green-50 dark:bg-green-900/20'
                                                            : 'bg-red-50 dark:bg-red-900/20'
                                                    }`}>
                                                        {isCredit
                                                            ? <TrendingUp className="w-5 h-5 text-green-500" />
                                                            : <TrendingDown className="w-5 h-5 text-red-500" />
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{label}</p>
                                                        <p className="text-xs text-gray-400">{dateStr}{timeStr ? ` · ${timeStr}` : ''}</p>
                                                    </div>
                                                </div>
                                                <div className="text-end shrink-0">
                                                    <span className={`text-sm font-black ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
                                                        {isCredit ? '+' : ''}{Math.abs(amt).toFixed(2)}
                                                    </span>
                                                    <p className="text-[10px] text-gray-400">{t('common.sar')}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Danger Zone */}
                <div className="mt-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">{t('settings.dangerZone')} ⚠️</h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                        {t('settings.dangerZoneDesc')}
                    </p>
                    <Button
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => toast.error(t('settings.featureUnavailable'))}
                    >
                        {t('settings.deleteAccount')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
