'use client';
import { ta } from '@/i18n/auto-translations';

import { useState, useRef } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useTranslation } from '@/i18n/useTranslation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Mail, MessageSquare, Clock, MapPin, Send, Loader2,
    CheckCircle, Headphones, HelpCircle, ShieldCheck,
    Sparkles, ArrowRight, Globe, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ================================================================
   CONTACT PAGE — Premium Redesign
   ================================================================ */

type InquiryType = 'general' | 'technical' | 'billing' | 'partnership';

interface FormState {
    name: string;
    email: string;
    inquiry_type: InquiryType;
    subject: string;
    message: string;
}

const MAX_MESSAGE_LENGTH = 1000;

export default function ContactPage() {
    const { t, dir } = useTranslation();
    const formRef = useRef<HTMLFormElement>(null);

    // ── Inquiry type options ──
    const inquiryTypes: { key: InquiryType; icon: any; label: string; desc: string }[] = [
        {
            key: 'general',
            icon: HelpCircle,
            label: dir === 'rtl' ? ta('استفسار عام', 'General Inquiry') : 'General Inquiry',
            desc: dir === 'rtl' ? ta('أسئلة عامة حول المنصة', 'General platform questions') : 'General questions about the platform',
        },
        {
            key: 'technical',
            icon: Headphones,
            label: dir === 'rtl' ? ta('دعم فني', 'Technical Support') : 'Technical Support',
            desc: dir === 'rtl' ? ta('مشاكل تقنية أو أخطاء', 'Technical issues or errors') : 'Technical issues or bugs',
        },
        {
            key: 'billing',
            icon: ShieldCheck,
            label: dir === 'rtl' ? ta('الفوترة والمدفوعات', 'Billing and Payments') : 'Billing & Payments',
            desc: dir === 'rtl' ? ta('مشاكل الطلبات أو المحفظة', 'Order or wallet issues') : 'Order or wallet issues',
        },
        {
            key: 'partnership',
            icon: Sparkles,
            label: dir === 'rtl' ? ta('شراكات وتعاون', 'Partnerships and Collaboration') : 'Partnerships',
            desc: dir === 'rtl' ? ta('فرص التعاون والشراكة', 'Collaboration and partnership opportunities') : 'Collaboration opportunities',
        },
    ];

    const CONTACT_CHANNELS = [
        {
            icon: Mail,
            label: t('contact.info.email'),
            value: 'support@sers.sa',
            href: 'mailto:support@sers.sa',
            gradient: 'from-violet-500 to-purple-600',
            bg: 'bg-violet-50 dark:bg-violet-950/40',
            border: 'border-violet-200 dark:border-violet-800/50',
        },
        {
            icon: MessageSquare,
            label: t('contact.info.whatsapp'),
            value: '+966 50 000 0000',
            href: 'https://wa.me/966500000000',
            gradient: 'from-emerald-500 to-green-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            border: 'border-emerald-200 dark:border-emerald-800/50',
        },
        {
            icon: Clock,
            label: t('contact.info.hours'),
            value: t('contact.info.hoursValue'),
            gradient: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-50 dark:bg-amber-950/40',
            border: 'border-amber-200 dark:border-amber-800/50',
        },
        {
            icon: MapPin,
            label: t('contact.info.location'),
            value: t('contact.info.locationValue'),
            gradient: 'from-rose-500 to-pink-600',
            bg: 'bg-rose-50 dark:bg-rose-950/40',
            border: 'border-rose-200 dark:border-rose-800/50',
        },
    ];

    const [formData, setFormData] = useState<FormState>({
        name: '',
        email: '',
        inquiry_type: 'general',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSuccess, setIsSuccess] = useState(false);

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = dir === 'rtl' ? ta('الاسم مطلوب', 'Name is required') : 'Name is required';
        if (!formData.email.trim()) errors.email = dir === 'rtl' ? ta('البريد مطلوب', 'Email is required') : 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = dir === 'rtl' ? ta('بريد غير صالح', 'Invalid email') : 'Invalid email';
        if (!formData.subject.trim()) errors.subject = dir === 'rtl' ? ta('الموضوع مطلوب', 'Subject is required') : 'Subject is required';
        if (!formData.message.trim()) errors.message = dir === 'rtl' ? ta('الرسالة مطلوبة', 'Message is required') : 'Message is required';
        else if (formData.message.trim().length < 10) errors.message = dir === 'rtl' ? ta('الرسالة قصيرة جداً (10 أحرف على الأقل)', 'Message too short (at least 10 characters)') : 'Message too short (min 10 chars)';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);

        try {
            await api.post('/contact', formData as unknown as Record<string, unknown>);
            // Backend endpoint exists and accepted the message
            setFormData({ name: '', email: '', inquiry_type: 'general', subject: '', message: '' });
            setFormErrors({});
            setIsSuccess(true);
            toast.success(t('contact.form.success'));
            setTimeout(() => setIsSuccess(false), 6000);
        } catch {
            // Backend endpoint doesn't exist or failed — fallback to mailto
            const mailtoBody = encodeURIComponent(
                `${dir === 'rtl' ? ta('الاسم', 'Name') : 'Name'}: ${formData.name}\n` +
                `${dir === 'rtl' ? ta('البريد', 'Email') : 'Email'}: ${formData.email}\n` +
                `${dir === 'rtl' ? ta('النوع', 'Type') : 'Type'}: ${formData.inquiry_type}\n\n` +
                formData.message
            );
            const mailtoSubject = encodeURIComponent(formData.subject);
            window.open(`mailto:support@sers.sa?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
            
            setFormData({ name: '', email: '', inquiry_type: 'general', subject: '', message: '' });
            setFormErrors({});
            setIsSuccess(true);
            toast.success(dir === 'rtl' ? ta('تم فتح تطبيق البريد لإرسال رسالتك', 'Email app opened to send your message') : 'Email app opened to send your message');
            setTimeout(() => setIsSuccess(false), 6000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateField = (field: keyof FormState, value: string) => {
        if (field === 'message' && value.length > MAX_MESSAGE_LENGTH) return;
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
    };

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300" dir={dir}>
            <Navbar />

            <main className="flex-1">
                {/* ═══════════════ HERO ═══════════════ */}
                <section className="relative overflow-hidden pt-28 pb-24 sm:pt-36 sm:pb-32">
                    {/* Background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-violet-950" />
                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }} />
                    {/* Glow blobs */}
                    <div className="absolute top-1/4 right-[10%] w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-[15%] w-[300px] h-[300px] bg-purple-600/15 rounded-full blur-[100px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px]" />

                    <div className="relative max-w-5xl mx-auto px-4 text-center">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] text-white/90 text-sm font-bold mb-8"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {dir === 'rtl' ? ta('متاحون للرد', 'Available to respond') : 'Available to respond'}
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 leading-tight"
                        >
                            {dir === 'rtl' ? (
                                <>{ta('كيف يمكننا', 'How can we')}<span className="bg-gradient-to-l from-violet-400 to-purple-400 bg-clip-text text-transparent">{ta('مساعدتك', 'help you')}</span>؟</>
                            ) : (
                                <>How can we <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">help you</span>?</>
                            )}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
                        >
                            {t('contact.subtitle')}
                        </motion.p>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <button
                                onClick={scrollToForm}
                                className="group flex items-center gap-2.5 px-8 py-4 bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-2xl shadow-violet-600/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Send className="w-5 h-5" />
                                {t('contact.form.title')}
                                <ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                            </button>
                            <a
                                href="https://wa.me/966500000000"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 px-8 py-4 bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-xl border border-white/[0.1] text-white font-bold rounded-2xl transition-all duration-300"
                            >
                                <MessageSquare className="w-5 h-5 text-emerald-400" />
                                {dir === 'rtl' ? ta('تواصل واتساب', 'WhatsApp Contact') : 'WhatsApp Chat'}
                            </a>
                        </motion.div>

                        {/* Trust bar */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center justify-center gap-6 sm:gap-8 mt-12 text-xs text-white/30 font-medium"
                        >
                            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400/60" /> {dir === 'rtl' ? ta('رد خلال 24 ساعة', 'Reply within 24 hours') : 'Reply within 24h'}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-blue-400/60" /> {dir === 'rtl' ? ta('عربي / English', 'Arabic / English') : 'Arabic / English'}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400/60" /> {dir === 'rtl' ? ta('بياناتك آمنة', 'Your data is safe') : 'Your data is safe'}</span>
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════ CONTACT CHANNELS ═══════════════ */}
                <section className="py-16 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {CONTACT_CHANNELS.map((ch, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    {ch.href ? (
                                        <a
                                            href={ch.href}
                                            target={ch.href.startsWith('http') ? '_blank' : undefined}
                                            rel="noopener noreferrer"
                                            className={`group flex items-center gap-4 p-5 rounded-2xl ${ch.bg} border ${ch.border} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-full`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ch.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                                                <ch.icon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-0.5">{ch.label}</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{ch.value}</p>
                                            </div>
                                        </a>
                                    ) : (
                                        <div className={`flex items-center gap-4 p-5 rounded-2xl ${ch.bg} border ${ch.border} h-full`}>
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ch.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                                                <ch.icon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-0.5">{ch.label}</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{ch.value}</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════ FORM SECTION ═══════════════ */}
                <section className="py-16 sm:py-24 bg-white dark:bg-gray-950">
                    <div className="max-w-5xl mx-auto px-4">
                        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">

                            {/* ── Left: Inquiry Type Selector ── */}
                            <div className="lg:col-span-4 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                        {dir === 'rtl' ? ta('نوع الاستفسار', 'Inquiry Type') : 'Inquiry Type'}
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        {dir === 'rtl' ? ta('اختر النوع لنوجهك للفريق المناسب', 'Select the type to direct you to the right team') : 'Select a type so we route you correctly'}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {inquiryTypes.map((type) => {
                                        const isActive = formData.inquiry_type === type.key;
                                        return (
                                            <motion.button
                                                key={type.key}
                                                onClick={() => updateField('inquiry_type', type.key)}
                                                className={`w-full text-start flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
                                                    isActive
                                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/10'
                                                        : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
                                                }`}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                                    isActive
                                                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                                }`}>
                                                    <type.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-sm mb-0.5 ${isActive ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                                        {type.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{type.desc}</p>
                                                </div>
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="ms-auto mt-1"
                                                    >
                                                        <CheckCircle className="w-5 h-5 text-primary" />
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Expected response time */}
                                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl p-5 border border-violet-100 dark:border-violet-800/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                                            {dir === 'rtl' ? ta('وقت الرد المتوقع', 'Expected Response Time') : 'Expected Response Time'}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {formData.inquiry_type === 'technical'
                                            ? (dir === 'rtl' ? ta('⚡ خلال 4 ساعات عمل', '⚡ Within 4 business hours') : '⚡ Within 4 business hours')
                                            : formData.inquiry_type === 'billing'
                                            ? (dir === 'rtl' ? ta('⚡ خلال 12 ساعة عمل', '⚡ Within 12 business hours') : '⚡ Within 12 business hours')
                                            : (dir === 'rtl' ? ta('📧 خلال 24 ساعة عمل', '📧 Within 24 business hours') : '📧 Within 24 business hours')
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* ── Right: Form ── */}
                            <div className="lg:col-span-8">
                                <AnimatePresence mode="wait">
                                    {isSuccess ? (
                                        /* ── Success State ── */
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-3xl p-10 sm:p-14 border border-emerald-200 dark:border-emerald-800/40 text-center min-h-[500px] flex flex-col items-center justify-center"
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                                                className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30"
                                            >
                                                <CheckCircle className="w-12 h-12 text-white" />
                                            </motion.div>
                                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-4">
                                                {dir === 'rtl' ? ta('تم إرسال رسالتك بنجاح! ✨', 'Your message sent successfully! ✨') : 'Message Sent Successfully! ✨'}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-300 mb-10 max-w-md mx-auto text-base leading-relaxed">
                                                {dir === 'rtl' ? ta('شكراً لتواصلك معنا. سيقوم فريقنا بالرد عليك في أقرب وقت ممكن.', 'Thank you for contacting us. Our team will respond as soon as possible.') : 'Thank you for reaching out. Our team will get back to you as soon as possible.'}
                                            </p>
                                            <button
                                                onClick={() => setIsSuccess(false)}
                                                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 text-base"
                                            >
                                                {dir === 'rtl' ? ta('إرسال رسالة أخرى', 'Send another message') : 'Send Another Message'}
                                            </button>
                                        </motion.div>
                                    ) : (
                                        /* ── Form ── */
                                        <motion.div
                                            key="form"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 sm:p-12 border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-black/20">
                                                {/* Header */}
                                                <div className="flex items-center gap-4 mb-10">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
                                                        <Send className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('contact.form.title')}</h2>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{dir === 'rtl' ? ta('جميع الحقول مطلوبة', 'All fields are required') : 'All fields are required'}</p>
                                                    </div>
                                                </div>

                                                <form ref={formRef} onSubmit={handleSubmit} className="space-y-7">
                                                    {/* Name + Email Row */}
                                                    <div className="grid sm:grid-cols-2 gap-6">
                                                        {/* Name */}
                                                        <div>
                                                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2.5">
                                                                {t('contact.form.name')} <span className="text-red-400">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.name}
                                                                onChange={(e) => updateField('name', e.target.value)}
                                                                placeholder={t('contact.form.namePlaceholder')}
                                                                className={`w-full h-[52px] px-5 text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border-2 rounded-2xl outline-none transition-all duration-200 ${
                                                                    formErrors.name
                                                                        ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-400/20'
                                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:focus:ring-violet-400/10'
                                                                }`}
                                                            />
                                                            {formErrors.name && <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-semibold flex items-center gap-1">⚠️ {formErrors.name}</p>}
                                                        </div>
                                                        {/* Email */}
                                                        <div>
                                                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2.5">
                                                                {t('contact.form.email')} <span className="text-red-400">*</span>
                                                            </label>
                                                            <input
                                                                type="email"
                                                                value={formData.email}
                                                                onChange={(e) => updateField('email', e.target.value)}
                                                                placeholder="example@email.com"
                                                                dir="ltr"
                                                                className={`w-full h-[52px] px-5 text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border-2 rounded-2xl outline-none transition-all duration-200 ${
                                                                    formErrors.email
                                                                        ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-400/20'
                                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:focus:ring-violet-400/10'
                                                                }`}
                                                            />
                                                            {formErrors.email && <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-semibold flex items-center gap-1">⚠️ {formErrors.email}</p>}
                                                        </div>
                                                    </div>

                                                    {/* Subject */}
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2.5">
                                                            {t('contact.form.subject')} <span className="text-red-400">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.subject}
                                                            onChange={(e) => updateField('subject', e.target.value)}
                                                            placeholder={t('contact.form.subjectPlaceholder')}
                                                            className={`w-full h-[52px] px-5 text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border-2 rounded-2xl outline-none transition-all duration-200 ${
                                                                formErrors.subject
                                                                    ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-400/20'
                                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:focus:ring-violet-400/10'
                                                            }`}
                                                        />
                                                        {formErrors.subject && <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-semibold flex items-center gap-1">⚠️ {formErrors.subject}</p>}
                                                    </div>

                                                    {/* Message */}
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2.5">
                                                            {t('contact.form.message')} <span className="text-red-400">*</span>
                                                        </label>
                                                        <textarea
                                                            value={formData.message}
                                                            onChange={(e) => updateField('message', e.target.value)}
                                                            placeholder={t('contact.form.messagePlaceholder')}
                                                            rows={7}
                                                            maxLength={MAX_MESSAGE_LENGTH}
                                                            className={`w-full px-5 py-4 text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border-2 rounded-2xl outline-none resize-none transition-all duration-200 leading-relaxed ${
                                                                formErrors.message
                                                                    ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-400/20'
                                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:focus:ring-violet-400/10'
                                                            }`}
                                                        />
                                                        <div className="flex items-center justify-between mt-2">
                                                            {formErrors.message ? (
                                                                <p className="text-xs text-red-500 dark:text-red-400 font-semibold flex items-center gap-1">⚠️ {formErrors.message}</p>
                                                            ) : (
                                                                <span />
                                                            )}
                                                            <span className={`text-xs font-mono tabular-nums ${formData.message.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-amber-500 dark:text-amber-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                                                                {formData.message.length}/{MAX_MESSAGE_LENGTH}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Submit Button */}
                                                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
                                                        <button
                                                            type="submit"
                                                            disabled={isSubmitting}
                                                            className="w-full h-[58px] flex items-center justify-center gap-3 bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-lg rounded-2xl shadow-2xl shadow-violet-600/25 hover:shadow-violet-500/35 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isSubmitting ? (
                                                                <>
                                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                                    <span>{t('contact.form.sending')}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="w-5 h-5" />
                                                                    <span>{t('contact.form.send')}</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </motion.div>

                                                    {/* Privacy note */}
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed pt-1">
                                                        {dir === 'rtl'
                                                            ? ta('🔒 بياناتك محمية ولن يتم مشاركتها مع أي طرف ثالث. نلتزم بسياسة الخصوصية.', '🔒 Your data is protected and will not be shared with any third party. We comply with the privacy policy.') : '🔒 Your data is protected and won\'t be shared with third parties.'}
                                                    </p>
                                                </form>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════ FAQ QUICK LINKS ═══════════════ */}
                <section className="py-16 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                            {dir === 'rtl' ? ta('هل تبحث عن إجابة سريعة؟', 'Looking for a quick answer?') : 'Looking for a quick answer?'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
                            {dir === 'rtl' ? ta('تصفح الأسئلة الشائعة أو تعرف على المنصة أكثر', 'Browse FAQs or learn more about the platform') : 'Browse our FAQ or learn more about the platform'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {[
                                { href: '/faq', label: dir === 'rtl' ? ta('الأسئلة الشائعة', 'FAQ') : 'FAQ', icon: HelpCircle },
                                { href: '/about', label: dir === 'rtl' ? ta('عن المنصة', 'About the Platform') : 'About Us', icon: Globe },
                                { href: '/privacy', label: dir === 'rtl' ? ta('سياسة الخصوصية', 'Privacy Policy') : 'Privacy Policy', icon: ShieldCheck },
                                { href: '/terms', label: dir === 'rtl' ? ta('الشروط والأحكام', 'Terms & Conditions') : 'Terms & Conditions', icon: CheckCircle },
                            ].map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:border-primary/40 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 hover:shadow-md"
                                >
                                    <link.icon className="w-4 h-4" />
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
