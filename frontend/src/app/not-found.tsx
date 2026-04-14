'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

export default function NotFound() {
    const { t, dir } = useTranslation();

    return (
        <div className="min-h-screen bg-gradient-to-bl from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden noise-overlay" dir={dir}>
            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[10%] w-72 h-72 bg-violet-500/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[10%] w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 text-center max-w-md mx-auto">
                {/* 404 */}
                <div className="mb-8">
                    <div className="text-[9rem] font-black leading-none bg-gradient-to-b from-white/20 to-white/5 bg-clip-text text-transparent select-none">
                        404
                    </div>
                    <div className="text-6xl -mt-12">😕</div>
                </div>

                {/* Message */}
                <h1 className="text-3xl font-black text-white mb-4">
                    {t('notFound.title')}
                </h1>
                <p className="text-white/60 mb-10 leading-relaxed">
                    {t('notFound.desc')}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/">
                        <Button className="bg-white text-primary hover:bg-white/90 font-bold gap-2 px-6 shadow-xl">
                            <Home className="w-4 h-4" />
                            {t('notFound.home')}
                        </Button>
                    </Link>
                    <Link href="/marketplace">
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm font-bold gap-2 px-6">
                            <ShoppingBag className="w-4 h-4" />
                            {t('notFound.browse')}
                        </Button>
                    </Link>
                </div>

                {/* Help */}
                <p className="mt-10 text-sm text-white/40">
                    {t('notFound.help')}{' '}
                    <Link href="/contact" className="text-white/70 hover:text-white underline underline-offset-4 transition-colors">
                        {t('notFound.contact')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
