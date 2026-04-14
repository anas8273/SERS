'use client';

import { useEffect, useRef } from 'react';
import { autoTranslations } from '@/i18n/auto-translations';

/**
 * AutoTranslateProvider — DOM-level auto-translation for Arabic → English.
 * 
 * This component observes the DOM and automatically translates any Arabic text
 * nodes that haven't been explicitly wrapped with ta(). It uses the same
 * dictionary as ta() (autoTranslations) for consistency.
 * 
 * Place this in the admin layout to auto-translate ALL remaining Arabic text.
 * Works by:
 * 1. Observing locale cookie changes
 * 2. Walking the DOM tree for text nodes containing Arabic
 * 3. Replacing Arabic text with English from the dictionary
 * 4. Storing original Arabic in data-attributes for reverting
 */

const AR_REGEX = /[\u0600-\u06FF]/;

// Extended dictionary for common inline patterns
const EXTENDED_DICT: Record<string, string> = {
  ...autoTranslations,
  // Stats & counts
  'إجمالي الشهادات': 'Total Certificates',
  'أنواع مختلفة': 'Different Types',
  'المعلمون': 'Teachers',
  'هذا الشهر': 'This Month',
  'إجمالي الإنجازات': 'Total Achievements',
  'موثقة': 'Verified',
  'غير موثقة': 'Unverified',
  'موثق': 'Verified',
  'غير موثق': 'Unverified',
  'التوثيق': 'Verification',
  'التوثيق:': 'Verification:',
  'التاريخ:': 'Date:',
  'الأهداف:': 'Objectives:',
  // Filter/Table
  'الجميع': 'All',
  'نتيجة': 'results',
  'سؤال': 'questions',
  'شهادة': 'certificate',
  'دقيقة': 'minutes',
  // Categories
  'لا توجد تصنيفات بعد': 'No categories yet',
  'لا توجد شهادات بعد': 'No certificates yet',
  'أضف التصنيفات الافتراضية أو أنشئ تصنيفاً جديداً': 'Add default categories or create one',
  'وصف التصنيف': 'Category description',
  'مخفي': 'Hidden',
  '🚫 مخفي': '🚫 Hidden',
  'أخرى': 'Other',
  'المعرف الفريد': 'Unique ID',
  // Forms
  'عنوان الشهادة': 'Certificate title',
  'اسم المادة': 'Subject name',
  'الصف (اختياري)': 'Grade (optional)',
  'مثال: ثالث متوسط': 'e.g. 3rd Intermediate',
  // Confirmations
  'هل أنت متأكد من الحذف؟': 'Are you sure you want to delete?',
  'تم إلغاء التوثيق': 'Verification removed',
  'تم توثيق الإنجاز ✓': 'Achievement verified ✓',
  'فشل تغيير حالة التوثيق': 'Verification toggle failed',
  // Educational services
  'إدارة وتوثيق إنجازات المعلمين': 'Manage teacher achievements',
  'إدارة سجلات متابعة الطلاب': 'Manage student follow-up records',
  'إدارة جميع اختبارات المعلمين': 'Manage all teacher tests',
  'إدارة جميع الأسئلة لجميع المعلمين': 'Manage all questions',
  'إدارة الانتاج المعرفي للمعلمين': 'Manage teacher knowledge production',
  'إدارة الخطط التعليمية': 'Manage educational plans',
  'إدارة توزيعات المناهج': 'Manage curriculum distributions',
  'إدارة توزيعات المقررات والحصص': 'Manage course distributions',
  'إدارة إنجازات المعلمين': 'Manage teacher achievements',
  'إدارة شواهد أداء المعلمين': 'Manage teacher work evidence',
  'إدارة وتكوين الخدمات التعليمية': 'Configure educational services',
  'إدارة ومعالجة الطلبات المخصصة': 'Manage custom requests',
  'إدارة ومراقبة نظام الذكاء الاصطناعي': 'AI system management',
  'إعدادات ومراقبة النظام': 'Settings & system monitoring',
  'مرحباً بك في لوحة الإدارة': 'Welcome to Admin Panel',
  'نظرة عامة سريعة على أداء المنصة': 'Quick platform overview',
  'نظام التصنيفات حسب الفئة الوظيفية': 'Job function category system',
  'تكوين ومعاينة الخدمات التعليمية المتاحة': 'Configure available services',
  // Section labels
  'السؤال': 'Question',
  'الصعوبة': 'Difficulty',
  'الدرجة': 'Score',
  'المدة': 'Duration',
  'المنهج': 'Curriculum',
  'الفصل': 'Semester',
  'الفصل:': 'Semester:',
  'الناشر': 'Publisher',
  'المعيار': 'Standard',
  'المعيار:': 'Standard:',
  // Settings misc
  'معاينة حية': 'Live Preview',
  'حفظ...': 'Saving...',
  'جاري المسح...': 'Clearing...',
};

function getLocale(): string {
  if (typeof document === 'undefined') return 'ar';
  const match = document.cookie.match(/(?:^|;\s*)locale=(\w+)/);
  return match?.[1] === 'en' ? 'en' : 'ar';
}

function translateText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed || !AR_REGEX.test(trimmed)) return null;
  
  // Direct lookup
  if (EXTENDED_DICT[trimmed]) return EXTENDED_DICT[trimmed];
  
  // Try without trailing punctuation
  const cleaned = trimmed.replace(/[.؟!:،\s]+$/, '').trim();
  if (EXTENDED_DICT[cleaned]) return EXTENDED_DICT[cleaned];
  
  return null;
}

function processTextNode(node: Text, locale: string) {
  if (locale === 'ar') {
    // Revert to original
    const original = (node as any).__originalText;
    if (original && node.textContent !== original) {
      node.textContent = original;
    }
    return;
  }
  
  const text = node.textContent;
  if (!text || !AR_REGEX.test(text)) return;
  
  // Store original
  if (!(node as any).__originalText) {
    (node as any).__originalText = text;
  }
  
  const translated = translateText(text);
  if (translated) {
    node.textContent = translated;
    return;
  }
  
  // Try partial: "123 نتيجة" → "123 results"
  const parts = text.match(/^(\d+)\s+([\u0600-\u06FF]+)$/);
  if (parts) {
    const word = EXTENDED_DICT[parts[2]];
    if (word) {
      node.textContent = `${parts[1]} ${word}`;
      return;
    }
  }
}

function walkDOM(root: Node, locale: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    // Skip script/style/input elements
    const parent = node.parentElement;
    if (!parent) continue;
    const tag = parent.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') continue;
    
    processTextNode(node, locale);
  }
}

export function AutoTranslateProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const localeRef = useRef(getLocale());
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let animFrame: number;
    
    const runTranslation = () => {
      const locale = getLocale();
      localeRef.current = locale;
      walkDOM(container, locale);
    };
    
    // Initial pass (delayed to let React render)
    const timer = setTimeout(runTranslation, 100);
    
    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(runTranslation);
    });
    
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    
    // Poll for locale changes
    const localeInterval = setInterval(() => {
      const newLocale = getLocale();
      if (newLocale !== localeRef.current) {
        localeRef.current = newLocale;
        runTranslation();
      }
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrame);
      observer.disconnect();
      clearInterval(localeInterval);
    };
  }, []);
  
  return <div ref={containerRef}>{children}</div>;
}
