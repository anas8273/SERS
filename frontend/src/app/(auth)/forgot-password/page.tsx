'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, AlertTriangle, Loader2, RefreshCw, KeyRound, Sparkles, GraduationCap, Layout, Palette } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';

const ForgotPasswordSchema = z.object({
    email: z.string().email(),
});

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { t, dir } = useTranslation();
    const [isPending, startTransition] = useTransition();
    const [emailSent, setEmailSent] = useState(false);
    const [sentEmail, setSentEmail] = useState('');

    const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
        resolver: zodResolver(ForgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = (values: z.infer<typeof ForgotPasswordSchema>) => {
        startTransition(async () => {
            try {
                // Step 1: Check if email exists in our database
                try {
                    await api.post('/auth/check-email', { email: values.email });
                } catch (checkError: any) {
                    // Ignore explicit check failure if route doesn't exist
                }

                // Step 2: Send Firebase password reset email
                await sendPasswordResetEmail(auth, values.email);
                setEmailSent(true);
                setSentEmail(values.email);
                toast.success(t('forgotPassword.toastSuccess'));
            } catch (error: any) {
                switch (error.code) {
                    case 'auth/user-not-found':
                        toast.error(t('forgotPassword.toastNotFound'));
                        form.setError('email', { message: t('forgotPassword.emailNotFound') });
                        break;
                    case 'auth/invalid-email':
                        toast.error(t('forgotPassword.toastInvalidEmail'));
                        form.setError('email', { message: t('forgotPassword.emailFormatError') });
                        break;
                    case 'auth/too-many-requests':
                        toast.error(t('forgotPassword.toastTooMany'));
                        break;
                    default:
                        toast.error(t('forgotPassword.toastError'));
                }
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 relative overflow-hidden" dir={dir}>
            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
            </div>

            <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 px-4 py-12">
                {/* Left Side - Branding/Info (Hidden on mobile) */}
                <motion.div 
                    initial={{ opacity: 0, x: dir === 'rtl' ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="hidden lg:flex flex-col max-w-md space-y-8"
                >
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-black uppercase tracking-widest">
                            <Sparkles className="w-4 h-4" />
                            {t('auth.login.badge')}
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 dark:text-white leading-tight">
                            {t('forgotPassword.title')} <span className="text-primary">SERS</span>
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                            {t('auth.login.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { icon: <Layout className="w-5 h-5" />, title: t('auth.login.feature1.title'), desc: t('auth.login.feature1.desc') },
                            { icon: <Palette className="w-5 h-5" />, title: t('auth.login.feature2.title'), desc: t('auth.login.feature2.desc') },
                            { icon: <GraduationCap className="w-5 h-5" />, title: t('auth.login.feature3.title'), desc: t('auth.login.feature3.desc') }
                        ].map((feature, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="flex items-start gap-4 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800"
                            >
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white">{feature.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Right Side - Form or Success State */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[450px]"
                >
                    <div className="lg:hidden text-center mb-8 space-y-2">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">SERS</h1>
                        <p className="text-gray-500 dark:text-gray-400">{t('forgotPassword.mobileSubtitle')}</p>
                    </div>

                    {emailSent ? (
                        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl p-8 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6"
                            >
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-3 mb-6"
                            >
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('forgotPassword.successTitle')}</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {t('forgotPassword.successDesc')}
                                </p>
                                <p className="font-bold text-primary break-all text-sm bg-primary/5 rounded-xl px-4 py-2.5 border border-primary/10">
                                    {sentEmail}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 text-start mb-6"
                            >
                                <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-2 text-sm flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {t('forgotPassword.tipsTitle')}
                                </h4>
                                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1.5 list-disc list-inside">
                                    <li>{t('forgotPassword.tip1')}</li>
                                    <li>{t('forgotPassword.tip2')}</li>
                                    <li>{t('forgotPassword.tip3')}</li>
                                </ul>
                            </motion.div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => { setEmailSent(false); form.reset(); }}
                                    variant="outline"
                                    className="w-full h-11 rounded-xl font-bold gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {t('forgotPassword.resend')}
                                </Button>
                                <Link href="/login" className="w-full">
                                    <Button variant="ghost" className="w-full h-11 rounded-xl font-bold gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                        <ArrowRight className="w-4 h-4" />
                                        {t('forgotPassword.backToLogin')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                            <div className="bg-gradient-to-bl from-primary/10 via-transparent to-transparent p-8 text-center border-b border-gray-100 dark:border-gray-800">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4"
                                >
                                    <KeyRound className="w-8 h-8 text-primary" />
                                </motion.div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('forgotPassword.heading')}</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {t('forgotPassword.description')}
                                </p>
                            </div>

                            <div className="p-6 md:p-8">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <FormLabel className="font-bold text-gray-900 dark:text-white text-sm">{t('forgotPassword.emailLabel')}</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                {...field}
                                                                disabled={isPending}
                                                                placeholder="name@example.com"
                                                                type="email"
                                                                className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-start h-12 rounded-xl ps-11"
                                                                dir="ltr"
                                                            />
                                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-start text-xs font-medium text-destructive" />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            disabled={isPending}
                                            type="submit"
                                            className="w-full h-12 text-base font-bold shadow-[0_8px_20px_-8px_rgba(var(--primary),0.5)] hover:shadow-[0_8px_25px_-5px_rgba(var(--primary),0.6)] transition-all active:scale-[0.98] rounded-xl gap-2 bg-primary text-primary-foreground"
                                        >
                                            {isPending ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    <span>{t('forgotPassword.submitting')}</span>
                                                </>
                                            ) : (
                                                t('forgotPassword.submit')
                                            )}
                                        </Button>
                                    </form>
                                </Form>

                                <div className="mt-8 text-center pb-2">
                                    <Link
                                        href="/login"
                                        className="text-sm font-medium text-gray-500 hover:text-primary transition-colors inline-flex items-center gap-1.5"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        {t('forgotPassword.backToLogin')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
