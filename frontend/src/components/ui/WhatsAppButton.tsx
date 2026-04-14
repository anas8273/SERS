'use client';
import { ta } from '@/i18n/auto-translations';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

const WHATSAPP_NUMBER = '966500000000';
const DEFAULT_MESSAGE = 'مرحباً، أحتاج مساعدة بخصوص منصة SERS';

// Routes where WhatsApp button should never appear
const HIDDEN_ROUTES = ['/admin', '/dashboard', '/checkout', '/cart', '/editor'];

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { dir } = useTranslation();

  // Hide on admin/dashboard pages
  const isHidden = HIDDEN_ROUTES.some(route => pathname?.startsWith(route));
  if (isHidden) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    // Use logical inset-inline-end so it respects RTL/LTR
    // bottom-6 = 24px, safe-area aware
    <div
      className="fixed bottom-6 end-4 sm:end-6 z-40 flex flex-col items-end gap-3"
      dir={dir}
      style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))' }}
    >
      {/* Tooltip / mini card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            // Max width set to prevent overflow on narrow screens
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 w-[min(240px,calc(100vw-6rem))] relative"
          >
            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 start-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1 mt-1 truncate">
              {ta('تحتاج مساعدة؟ 👋', 'Need help? 👋')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              {ta('تواصل معنا مباشرة عبر واتساب', 'Contact us directly via WhatsApp')}
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center bg-[#25D366] hover:bg-[#1da851] text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors"
            >
              {ta('ابدأ المحادثة', 'Start Chat')}
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button — 48px touch target minimum */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white shadow-lg shadow-green-500/30 flex items-center justify-center relative transition-colors duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="تواصل عبر واتساب"
        aria-expanded={isOpen}
      >
        {/* Subtle pulse ring — only when closed */}
        {!isOpen && <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-15" />}
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
              </motion.div>
            : <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 fill-white relative z-10" />
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
