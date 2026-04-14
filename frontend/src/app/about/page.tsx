'use client';

import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { GraduationCap, Heart, Star, Users, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export default function AboutPage() {
    const { t, dir, locale } = useTranslation();
    const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

    const VALUES = [
        {
            icon: Sparkles,
            title: t('about.value.1.title'),
            description: t('about.value.1.desc'),
            color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
        },
        {
            icon: Heart,
            title: t('about.value.2.title'),
            description: t('about.value.2.desc'),
            color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
        },
        {
            icon: Star,
            title: t('about.value.3.title'),
            description: t('about.value.3.desc'),
            color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        },
    ];

    const TEAM = [
        { name: t('about.team.1.name'), role: t('about.team.1.role') },
        { name: t('about.team.2.name'), role: t('about.team.2.role') },
        { name: t('about.team.3.name'), role: t('about.team.3.role') },
        { name: t('about.team.4.name'), role: t('about.team.4.role') },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300" dir={dir}>
            <Navbar />

            <main className="flex-1">
                {/* Hero */}
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-purple-950 to-slate-900 pt-32 pb-24 noise-overlay">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[10%] w-72 h-72 bg-violet-500/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-10 left-[10%] w-64 h-64 bg-purple-500/15 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative max-w-4xl mx-auto px-4 text-center">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-sm font-bold mb-6">
                            <GraduationCap className="w-4 h-4 text-amber-400" />
                            {t('about.badge')}
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                            {t('about.title')}
                        </h1>
                        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                            {t('about.subtitle')}
                        </p>
                    </div>
                </section>

                {/* Story */}
                <ScrollReveal>
                <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-1 w-12 bg-primary rounded-full" />
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white">{t('about.story.title')}</h2>
                        </div>
                        <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 space-y-5 leading-relaxed">
                            <p>{t('about.story.p1')}</p>
                            <p>{t('about.story.p2')}</p>
                            <p>{t('about.story.p3')}</p>
                        </div>
                    </div>
                </section>
                </ScrollReveal>

                {/* Values */}
                <ScrollReveal delay={0.1}>
                <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="text-center mb-14">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">{t('about.values.title')}</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                                {t('about.values.subtitle')}
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {VALUES.map((value, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700 card-3d-hover depth-shadow transition-all duration-300">
                                    <div className={`w-16 h-16 mx-auto rounded-2xl ${value.color} flex items-center justify-center mb-5`}>
                                        <value.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">{value.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                </ScrollReveal>

                {/* Team */}
                <ScrollReveal delay={0.15}>
                <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="text-center mb-14">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">{t('about.team.title')}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{t('about.team.subtitle')}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {TEAM.map((member, i) => (
                                <div key={i} className="group text-center">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-violet-500/20">
                                        <Users className="w-9 h-9" />
                                    </div>
                                    <h3 className="font-black text-gray-900 dark:text-white text-sm">{member.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                </ScrollReveal>

                {/* CTA */}
                <ScrollReveal>
                <section className="py-20 bg-gradient-to-bl from-slate-900 via-purple-950 to-slate-900">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-black mb-6 text-white">{t('about.cta.title')}</h2>
                        <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
                            {t('about.cta.subtitle')}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/services">
                                <button className="h-12 px-8 bg-white text-primary hover:bg-white/90 font-black rounded-xl shadow-2xl shadow-white/10 hover:shadow-white/20 transition-all duration-300 inline-flex items-center gap-2 text-sm">
                                    {t('about.cta.try')}
                                </button>
                            </Link>
                            <Link href="/contact">
                                <button className="h-12 px-8 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-bold rounded-xl transition-all duration-300 inline-flex items-center gap-2 text-sm">
                                    <ArrowIcon className="w-4 h-4" />
                                    {t('about.cta.contact')}
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>
                </ScrollReveal>
            </main>

            <Footer />
        </div>
    );
}
