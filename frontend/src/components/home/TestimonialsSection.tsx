'use client';

import { Star, Users, FileText, Layers } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { useTranslation } from '@/i18n/useTranslation';

interface TestimonialsSectionProps {
  publicStats: {
    total_users: number;
    total_templates: number;
    total_documents: number;
    average_rating: number;
  };
}

export function TestimonialsSection({ publicStats }: TestimonialsSectionProps) {
  const { t } = useTranslation();

  return (
    <ScrollReveal>
      <section className="py-20 bg-slate-900 noise-overlay relative">
        <div className="container mx-auto px-4 relative z-10">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16">
            {[
              { numValue: publicStats.total_users > 0 ? publicStats.total_users : 10000, label: t('home.stats.users'), icon: <Users className="w-6 h-6" />, prefix: '+' },
              { numValue: publicStats.total_documents > 0 ? publicStats.total_documents : 50000, label: t('home.stats.documents'), icon: <FileText className="w-6 h-6" />, prefix: '+' },
              { numValue: publicStats.total_templates > 0 ? publicStats.total_templates : 200, label: t('home.stats.templates'), icon: <Layers className="w-6 h-6" />, prefix: '+' },
              { numValue: publicStats.average_rating || 4.9, label: t('home.stats.rating'), icon: <Star className="w-6 h-6 fill-amber-400 text-amber-400" />, prefix: '', suffix: '/5', decimals: 1 },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 text-primary flex items-center justify-center mb-4">
                  {stat.icon}
                </div>
                <p className="text-2xl sm:text-4xl font-black bg-gradient-to-l from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                  <AnimatedCounter
                    value={stat.numValue}
                    prefix={stat.prefix}
                    suffix={stat.suffix || ''}
                    decimals={stat.decimals || 0}
                    duration={2.5}
                  />
                </p>
                <p className="text-sm text-slate-400 font-medium mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="w-24 h-1 mx-auto bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full mb-16" />

          {/* Testimonials */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 text-amber-400 text-sm font-bold">
              <Star className="w-4 h-4 fill-amber-400" />
              {t('home.testimonials.badge')}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">{t('home.testimonials.title')}</h2>
            <p className="text-slate-400 text-lg">{t('home.testimonials.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: t('testimonial.1.name'), role: t('testimonial.1.role'), rating: 5, text: t('testimonial.1.text'), avatar: t('testimonial.1.name').charAt(2), color: 'from-pink-500 to-rose-500' },
              { name: t('testimonial.2.name'), role: t('testimonial.2.role'), rating: 5, text: t('testimonial.2.text'), avatar: t('testimonial.2.name').charAt(2), color: 'from-blue-500 to-cyan-500' },
              { name: t('testimonial.3.name'), role: t('testimonial.3.role'), rating: 5, text: t('testimonial.3.text'), avatar: t('testimonial.3.name').charAt(2), color: 'from-purple-500 to-violet-500' },
            ].map((review, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`w-4 h-4 ${
                      s < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'
                    }`} />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-6">&#8220;{review.text}&#8221;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${review.color} flex items-center justify-center text-white font-black text-sm`}>
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{review.name}</p>
                    <p className="text-slate-400 text-xs">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
