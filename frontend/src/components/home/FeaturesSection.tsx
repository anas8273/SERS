'use client';

import { 
  Sparkles, Bot, ShieldCheck, Layers, FileText, 
  MousePointer, Download, Zap, BarChart3 
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { useTranslation } from '@/i18n/useTranslation';

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <ScrollReveal>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              {t('home.whyUs.badge')}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{t('home.whyUs.title')}</h2>
          </div>

          <div className="grid lg:grid-cols-5 gap-10 max-w-7xl mx-auto items-start">
            {/* Left — How It Works (vertical flow) */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">{t('home.howItWorks.title')}</h3>
              {[
                { step: 1, icon: <MousePointer className="w-6 h-6" />, title: t('home.howItWorks.step1.title'), desc: t('home.howItWorks.step1.desc'), color: 'from-blue-500 to-blue-600' },
                { step: 2, icon: <Bot className="w-6 h-6" />, title: t('home.howItWorks.step2.title'), desc: t('home.howItWorks.step2.desc'), color: 'from-purple-500 to-purple-600' },
                { step: 3, icon: <Download className="w-6 h-6" />, title: t('home.howItWorks.step3.title'), desc: t('home.howItWorks.step3.desc'), color: 'from-emerald-500 to-emerald-600' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                      {item.icon}
                    </div>
                    {item.step < 3 && <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />}
                  </div>
                  <div className="pb-6">
                    <span className="text-xs font-black text-primary mb-1 block">{t('home.howItWorks.step')} {item.step}</span>
                    <h4 className="text-base font-black text-gray-900 dark:text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — Feature cards (Bento Grid) */}
            <div className="lg:col-span-3 bento-grid">
              {[
                { icon: <Layers className="w-6 h-6" />, title: t('home.feature.1.title'), desc: t('home.feature.1.desc'), color: 'bg-blue-500', size: 'bento-sm' },
                { icon: <Bot className="w-6 h-6" />, title: t('home.feature.2.title'), desc: t('home.feature.2.desc'), color: 'bg-purple-500', size: 'bento-wide' },
                { icon: <Zap className="w-6 h-6" />, title: t('home.feature.3.title'), desc: t('home.feature.3.desc'), color: 'bg-amber-500', size: 'bento-sm' },
                { icon: <BarChart3 className="w-6 h-6" />, title: t('home.feature.4.title'), desc: t('home.feature.4.desc'), color: 'bg-emerald-500', size: 'bento-sm' },
                { icon: <FileText className="w-6 h-6" />, title: t('home.feature.5.title'), desc: t('home.feature.5.desc'), color: 'bg-rose-500', size: 'bento-sm' },
                { icon: <ShieldCheck className="w-6 h-6" />, title: t('home.feature.6.title'), desc: t('home.feature.6.desc'), color: 'bg-cyan-500', size: 'bento-wide' },
              ].map((feature, i) => (
                <div key={i} className={`${feature.size} p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group card-3d-hover depth-shadow`}>
                  <div className={`w-11 h-11 rounded-xl ${feature.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    {feature.icon}
                  </div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white mb-2">{feature.title}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
