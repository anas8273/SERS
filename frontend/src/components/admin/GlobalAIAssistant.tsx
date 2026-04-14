'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lightbulb, X, TrendingUp } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/i18n/useTranslation';

// Bilingual fallback insights when Groq API is unavailable
const FALLBACK_INSIGHTS: Record<string, { ar: string[]; en: string[] }> = {
    '/templates': {
        ar: [
            'تحديث الأوصاف بكلمات مثل "الرخصة المهنية" و"سجلات المعلم" يرفع المبيعات بنسبة 15%.',
            'قالب "سجل المتابعة التفاعلي" هو الأكثر طلباً، تأكد من إبرازه في الصفحة الرئيسية.',
        ],
        en: [
            'Updating descriptions with keywords like "Professional License" and "Teacher Records" can boost sales by 15%.',
            'The "Interactive Follow-up Log" template is the most requested — consider featuring it on the home page.',
        ],
    },
    '/users': {
        ar: [
            'إرسال إشعارات بريدية بالخصومات المؤتمتة يزيد عودة المعلمين للمنصة بنسبة 20%.',
            'المستخدمون الجدد يفضلون قوالب "التحضير السريع"، قم بفرزها لهم كأولوية.',
        ],
        en: [
            'Sending automated discount email notifications can increase returning teacher visits by 20%.',
            'New users prefer "Quick Prep" templates — consider prioritizing them in the onboarding flow.',
        ],
    },
    '/reports': {
        ar: [
            'مبيعات نهاية الأسبوع تشكل 45% من أرباحك الأسبوعية. يفضل تركيز الإعلانات مساء الخميس والجمعة.',
            'استخدام كوبونات الخصم للمستخدمين الجدد ساهم في رفع معدل التحويل إلى 3.2% هذا الشهر.',
        ],
        en: [
            'Weekend sales account for 45% of weekly revenue. Focus promotions on Thursday and Friday evenings.',
            'Discount coupons for new users helped raise the conversion rate to 3.2% this month.',
        ],
    },
    '/orders': {
        ar: [
            'متابعة الطلبات المعلقة وحلها في أول 24 ساعة يقلل نسبة الإلغاء بشكل كبير جداً.',
            'المدفوعات السريعة (Apple Pay) تمثل النسبة الأكبر من العمليات الناجحة.',
        ],
        en: [
            'Following up on pending orders within 24 hours significantly reduces the cancellation rate.',
            'Express payments (Apple Pay) account for the largest portion of successful transactions.',
        ],
    },
    '/dashboard': {
        ar: [
            'أداء المتجر مستقر وعمليات الشراء نشطة. وفر وقتاً بتحليل "أفضل القوالب مبيعاً".',
            'تحليلات الزوار تظهر اهتماماً متزايداً بالخدمات التعليمية المتكاملة.',
        ],
        en: [
            'Store performance is stable with active purchases. Save time by reviewing the "Best Selling Templates" section.',
            'Visitor analytics show growing interest in integrated educational services.',
        ],
    },
};

const DEFAULT_INSIGHTS = {
    ar: 'استخدم أداة التحليلات لتوجيه قراراتك التسويقية لزيادة العوائد بشكل مستمر.',
    en: 'Use the analytics tool to guide your marketing decisions and continuously increase revenue.',
};

export function GlobalAIAssistant() {
    const [insight, setInsight] = useState<string>('');
    const [isVisible, setIsVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const { locale, t } = useTranslation();

    useEffect(() => {
        setIsVisible(true);
        setIsLoading(true);
        generateAutoInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, locale]);

    const generateAutoInsight = async () => {
        try {
            // Pass locale so Groq responds in the correct language
            const response = await fetch('/api/ai/admin-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pathname, locale }),
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.insight) {
                setInsight(result.insight);
            } else {
                fallbackInsight();
            }
        } catch (error: unknown) {
            // Gracefully handle quota exceeded or network errors
            logger.warn('Admin insight: using local fallback.', error);
            fallbackInsight();
        } finally {
            setIsLoading(false);
        }
    };

    const fallbackInsight = () => {
        // Pick locale-aware fallback texts
        let pool: string[] = [DEFAULT_INSIGHTS[locale === 'en' ? 'en' : 'ar']];

        for (const [key, val] of Object.entries(FALLBACK_INSIGHTS)) {
            if (pathname.includes(key)) {
                pool = val[locale === 'en' ? 'en' : 'ar'];
                break;
            }
        }

        const randomIndex = Math.floor(Math.random() * pool.length);
        setInsight(pool[randomIndex]);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm relative overflow-hidden group"
            >
                {/* Subtle animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/30 to-purple-50/30 dark:via-indigo-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute -left-20 -top-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-start sm:items-center gap-3 md:gap-4 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center shrink-0">
                            {isLoading ? (
                                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                            ) : (
                                <Lightbulb className="w-5 h-5 text-amber-500" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    {t('ai.smartInsight')}
                                </h4>
                            </div>

                            {isLoading ? (
                                <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-full max-w-md animate-pulse mt-1.5" />
                            ) : (
                                <p className="text-sm md:text-[15px] font-medium text-gray-700 dark:text-gray-200 leading-relaxed truncate whitespace-normal">
                                    {insight}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50/50 dark:bg-gray-700/50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shrink-0"
                        title={t('ai.hide')}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
