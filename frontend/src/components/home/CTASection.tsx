'use client';

import Link from 'next/link';
import { Rocket, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { useTranslation } from '@/i18n/useTranslation';

export function CTASection() {
  const { t } = useTranslation();

  return (
    <ScrollReveal>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 rounded-[2rem] p-8 sm:p-12 md:p-16 text-center text-white relative overflow-hidden noise-overlay">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-black leading-tight">
                {t('home.cta.title')}
              </h2>
              <p className="text-white/80 text-lg max-w-2xl mx-auto">
                {t('home.cta.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Link href="/marketplace">
                  <Button size="lg" className="btn-interactive rounded-full px-6 sm:px-10 py-5 sm:py-7 text-base sm:text-lg font-bold bg-white text-primary hover:bg-white/90 shadow-2xl gap-2">
                    <Rocket className="w-5 h-5" />
                    {t('home.cta.register')}
                  </Button>
                </Link>
                <Link href="/services">
                  <Button size="lg" className="btn-interactive rounded-full px-6 sm:px-10 py-5 sm:py-7 text-base sm:text-lg font-bold bg-white/15 text-white hover:bg-white/25 border border-white/30 gap-2">
                    <Play className="w-5 h-5" />
                    {t('home.cta.browse')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
