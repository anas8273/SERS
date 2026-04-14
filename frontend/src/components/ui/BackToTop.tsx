'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

export function BackToTop() {
  const [show, setShow] = useState(false);
  const { dir } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          // Place on start side (left in RTL) to avoid conflict with WhatsApp (end side)
          // bottom-24 = above WhatsApp button and CookieConsent
          className="fixed z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/30 backdrop-blur-sm flex items-center justify-center transition-colors duration-200 group"
          style={{
            bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))',
            // Use logical inset-inline-start for RTL awareness
            insetInlineStart: dir === 'rtl' ? 'auto' : '1.5rem',
            insetInlineEnd: dir === 'rtl' ? 'auto' : 'auto',
            left: dir === 'rtl' ? '1.5rem' : '1.5rem',
          }}
          aria-label={dir === 'rtl' ? 'العودة للأعلى' : 'Back to top'}
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-y-0.5 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
