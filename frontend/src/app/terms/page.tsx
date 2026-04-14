'use client';

import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Scale, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface TermsSection {
    number: string;
    title: string;
    content?: string;
    items?: string[];
    contact?: string;
}

export default function TermsPage() {
    const { t, dir } = useTranslation();

    const SECTIONS: TermsSection[] = [
        {
            number: '1',
            title: t('terms.s1.title'),
            content: t('terms.s1.content'),
        },
        {
            number: '2',
            title: t('terms.s2.title'),
            content: t('terms.s2.content'),
            items: [
                t('terms.s2.i1'),
                t('terms.s2.i2'),
                t('terms.s2.i3'),
                t('terms.s2.i4'),
            ],
        },
        {
            number: '3',
            title: t('terms.s3.title'),
            items: [
                t('terms.s3.i1'),
                t('terms.s3.i2'),
                t('terms.s3.i3'),
                t('terms.s3.i4'),
            ],
        },
        {
            number: '4',
            title: t('terms.s4.title'),
            items: [
                t('terms.s4.i1'),
                t('terms.s4.i2'),
                t('terms.s4.i3'),
                t('terms.s4.i4'),
            ],
        },
        {
            number: '5',
            title: t('terms.s5.title'),
            content: t('terms.s5.content'),
            items: [
                t('terms.s5.i1'),
                t('terms.s5.i2'),
                t('terms.s5.i3'),
            ],
        },
        {
            number: '6',
            title: t('terms.s6.title'),
            content: t('terms.s6.content'),
            items: [
                t('terms.s6.i1'),
                t('terms.s6.i2'),
                t('terms.s6.i3'),
                t('terms.s6.i4'),
            ],
        },
        {
            number: '7',
            title: t('terms.s7.title'),
            content: t('terms.s7.content'),
        },
        {
            number: '8',
            title: t('terms.s8.title'),
            content: t('terms.s8.content'),
        },
        {
            number: '9',
            title: t('terms.s9.title'),
            content: t('terms.s9.content'),
        },
        {
            number: '10',
            title: t('terms.s10.title'),
            content: t('terms.s10.content'),
            contact: 'legal@sers.sa',
        },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300" dir={dir}>
            <Navbar />

            <main className="flex-1">
                {/* Hero */}
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-purple-950 to-slate-900 pt-32 pb-16 noise-overlay">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 left-[15%] w-60 h-60 bg-purple-500/15 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative max-w-4xl mx-auto px-4 text-center">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-sm font-bold mb-6">
                            <Scale className="w-4 h-4 text-amber-400" />
                            {t('terms.badge')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{t('terms.title')}</h1>
                        <p className="text-white/60 text-lg">{t('terms.lastUpdate')}</p>
                    </div>
                </section>

                {/* Content */}
                <section className="py-16 bg-white dark:bg-gray-950 transition-colors duration-300">
                    <div className="max-w-3xl mx-auto px-4">
                        <div className="space-y-10">
                            {SECTIONS.map((section) => (
                                <div key={section.number} className="border-b border-gray-100 dark:border-gray-800 pb-10 last:border-0">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary text-sm font-black flex items-center justify-center">
                                            {section.number}
                                        </span>
                                        <h2 className="text-xl font-black text-gray-900 dark:text-white">{section.title}</h2>
                                    </div>
                                    {section.content && (
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{section.content}</p>
                                    )}
                                    {section.items && (
                                        <ul className="space-y-2 pe-4">
                                            {section.items.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {section.contact && (
                                        <a href={`mailto:${section.contact}`} className="inline-flex items-center gap-2 text-primary font-bold hover:underline mt-2">
                                            {section.contact}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                            <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                                <ArrowRight className="w-4 h-4" />
                                {t('terms.backHome')}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
