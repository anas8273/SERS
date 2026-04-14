'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Breadcrumbs } from '@/components/ui/breadcrumb';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  HelpCircle, Search, ChevronDown, ChevronUp,
  CreditCard, ShieldCheck, UserCog, FileText,
  Zap, Sparkles, MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-start"
      >
        <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base flex-1">
          {item.question}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          isOpen ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
        }`}>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-4">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const { t, dir } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const FAQ_DATA: FAQItem[] = [
    // General
    { category: 'general', question: t('faq.page.q1'), answer: t('faq.page.a1') },
    { category: 'general', question: t('faq.page.q2'), answer: t('faq.page.a2') },
    { category: 'general', question: t('faq.page.q3'), answer: t('faq.page.a3') },
    // Account
    { category: 'account', question: t('faq.page.q4'), answer: t('faq.page.a4') },
    { category: 'account', question: t('faq.page.q5'), answer: t('faq.page.a5') },
    { category: 'account', question: t('faq.page.q6'), answer: t('faq.page.a6') },
    // Payment
    { category: 'payment', question: t('faq.page.q7'), answer: t('faq.page.a7') },
    { category: 'payment', question: t('faq.page.q8'), answer: t('faq.page.a8') },
    { category: 'payment', question: t('faq.page.q9'), answer: t('faq.page.a9') },
    // Templates
    { category: 'templates', question: t('faq.page.q10'), answer: t('faq.page.a10') },
    { category: 'templates', question: t('faq.page.q11'), answer: t('faq.page.a11') },
    { category: 'templates', question: t('faq.page.q12'), answer: t('faq.page.a12') },
    // Services
    { category: 'services', question: t('faq.page.q13'), answer: t('faq.page.a13') },
    { category: 'services', question: t('faq.page.q14'), answer: t('faq.page.a14') },
  ];

  const CATEGORIES = [
    { id: 'all', label: t('faq.page.cat.all'), icon: HelpCircle },
    { id: 'general', label: t('faq.page.cat.general'), icon: Sparkles },
    { id: 'account', label: t('faq.page.cat.account'), icon: UserCog },
    { id: 'payment', label: t('faq.page.cat.payment'), icon: CreditCard },
    { id: 'templates', label: t('faq.page.cat.templates'), icon: FileText },
    { id: 'services', label: t('faq.page.cat.services'), icon: Zap },
  ];

  const filteredFAQs = FAQ_DATA.filter(item => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q === '' ||
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q);
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300" dir={dir}>
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-purple-950 to-slate-900 pt-32 pb-20 noise-overlay">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 right-[15%] w-60 h-60 bg-violet-500/15 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-[20%] w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-sm font-bold mb-6">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              {t('faq.page.badge')}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{t('faq.page.title')}</h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto mb-8">
              {t('faq.page.subtitle')}
            </p>

            {/* Search */}
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={t('faq.page.searchPlaceholder')}
                className="pr-12 py-6 text-base rounded-2xl border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <Breadcrumbs className="mb-6" />

          {/* Category Tabs */}
          <ScrollReveal>
            <div className="flex flex-wrap gap-2 mb-8">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setOpenIndex(null); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    activeCategory === cat.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeCategory === cat.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {cat.id === 'all' ? FAQ_DATA.length : FAQ_DATA.filter(f => f.category === cat.id).length}
                  </span>
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* FAQ List */}
          <div className="space-y-3">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('faq.page.noResults')}</h3>
                <p className="text-gray-500 text-sm">{t('faq.page.noResultsDesc')}</p>
              </div>
            ) : (
              filteredFAQs.map((item, index) => (
                <FAQAccordion
                  key={index}
                  item={item}
                  isOpen={openIndex === index}
                  onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                />
              ))
            )}
          </div>

          {/* CTA */}
          <ScrollReveal delay={0.1}>
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-3xl p-8 text-center border border-gray-100 dark:border-gray-700">
              <MessageSquare className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('faq.page.ctaTitle')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{t('faq.page.ctaDesc')}</p>
              <Link href="/contact">
                <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all">
                  {t('faq.page.ctaButton')}
                </button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
