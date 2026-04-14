'use client';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * SmartWelcomeBanner.tsx
 * Contextual welcome experience for new/returning users.
 * Shows once per session and guides users to key features.
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ShoppingBag, BookOpen, Award, ChevronLeft } from 'lucide-react';

const SHOWN_KEY = 'sers_welcome_shown';

export function SmartWelcomeBanner() {
  const { ta } = useTranslation();
  // [FIX] STEPS re-evaluates ta() on every render so language switching is reactive.
  // Uses context-aware ta() from useTranslation — NOT the standalone cookie-based one.
  const STEPS = [
    {
      icon: ShoppingBag,
      color: 'from-violet-500 to-purple-600',
      title: ta('اكتشف متجر القوالب', 'Discover Template Store'),
      desc: ta('أكثر من 100 قالب تعليمي احترافي جاهزة للتحميل والتخصيص', 'Over 100 professional educational templates ready for download and customization'),
      action: '/marketplace',
      actionLabel: ta('تصفح المتجر', 'Browse Store'),
    },
    {
      icon: BookOpen,
      color: 'from-teal-500 to-cyan-600',
      title: ta('أنشئ سجلاتك التعليمية', 'Create Your Educational Records'),
      desc: ta('خطط الدروس، التوزيعات، المتابعة اليومية — كل ما تحتاجه في مكان واحد', 'Lesson plans, distributions, daily follow-ups — everything you need in one place'),
      action: '/distributions',
      actionLabel: ta('تجربة الآن', 'Try Now'),
    },
    {
      icon: Award,
      color: 'from-amber-500 to-orange-600',
      title: ta('أصدر الشهادات بضغطة', 'Issue Certificates Instantly'),
      desc: ta('شهادات تقدير وإنجاز احترافية مع QR code وتصدير PDF فوري', 'Professional appreciation & achievement certificates with QR code and instant PDF export'),
      action: '/certificates',
      actionLabel: ta('جرّب الشهادات', 'Try Certificates'),
    },
  ];
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const shown = sessionStorage.getItem(SHOWN_KEY);
    if (!shown) {
      // Show after a short delay
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated]);

  const dismiss = () => {
    sessionStorage.setItem(SHOWN_KEY, '1');
    setVisible(false);
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          // Mobile: bottom-center full-width | Desktop: bottom-start card
          className="fixed bottom-0 sm:bottom-6 left-0 right-0 sm:left-6 sm:right-auto z-[80] sm:w-[340px]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          dir="rtl"
        >
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
            {/* Gradient header */}
            <div className={`bg-gradient-to-l ${current.color} p-4 text-white relative`}>
              <button
                onClick={dismiss}
                className="absolute left-3 top-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/70 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {user?.name ? ta(`مرحباً ${user.name.split(' ')[0]}!`, `Welcome ${user.name.split(' ')[0]}!`) : ta('مرحباً!', 'Welcome!')}
                  </p>
                  <h3 className="text-sm font-black">{current.title}</h3>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">{current.desc}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { router.push(current.action); dismiss(); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-l ${current.color} hover:opacity-90 transition-opacity`}
                >
                  {current.actionLabel}
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {step < STEPS.length - 1 && (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    {ta('التالي', 'Next')}
                  </button>
                )}
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pb-3">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
