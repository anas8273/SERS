'use client';

import Link from 'next/link';
import { Sparkles, Rocket, Users, Star, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroCharacter } from '@/components/home/HeroCharacter';
import { useTranslation } from '@/i18n/useTranslation';

interface HeroSectionProps {
  publicStats: {
    total_users: number;
    total_templates: number;
    total_documents: number;
    average_rating: number;
  };
}

export function HeroSection({ publicStats }: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-purple-950 to-slate-900 min-h-[88vh] flex items-center noise-overlay">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-[5%] w-80 h-80 bg-violet-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-[10%] w-72 h-72 bg-purple-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-400/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative container mx-auto px-4 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Text Content */}
          <div className="text-center lg:text-start space-y-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-sm font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t('home.hero.badge')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.12] tracking-tight">
              {t('home.hero.title1')}
              <br />
              <span className="bg-gradient-to-l from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent">
                {t('home.hero.title2')}
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
            <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed -mt-4">
              {t('home.hero.subtitle2')}
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link href="/services">
                <Button size="lg" className="btn-interactive rounded-full px-6 sm:px-10 py-5 sm:py-7 text-base sm:text-lg font-bold shadow-2xl shadow-primary/30 gap-2">
                  <Rocket className="w-5 h-5" />
                  {t('home.hero.tryNow')}
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" className="btn-interactive rounded-full px-6 sm:px-10 py-5 sm:py-7 text-base sm:text-lg font-bold bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/20 transition-all gap-2">
                  {t('home.hero.browseStore')}
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 pt-2">
              {[
                { icon: <Users className="w-4 h-4" />, text: publicStats.total_users > 0 ? `+${publicStats.total_users.toLocaleString()} ${t('home.hero.stats.users')}` : t('home.hero.badge.users'), color: 'text-blue-400' },
                { icon: <Star className="w-4 h-4 fill-amber-400 text-amber-400" />, text: `${publicStats.average_rating}/5 ${t('home.hero.stats.rating')}`, color: 'text-amber-400' },
                { icon: <ShieldCheck className="w-4 h-4" />, text: t('home.hero.badge.trusted'), color: 'text-emerald-400' },
              ].map((badge, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm font-bold ${badge.color}`}>
                  {badge.icon}
                  <span className="text-white/80">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Cartoon Character */}
          <div className="hidden lg:flex justify-center items-center">
            <HeroCharacter className="w-full max-w-md drop-shadow-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
