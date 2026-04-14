// src/lib/utils.ts

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * دمج كلاسـات Tailwind بشكل ذكي
 * Merge Tailwind CSS classes intelligently
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق السعر (افتراضي: ريال سعودي)
 * Format price with currency (default: SAR)
 */
export function formatPrice(
  amount: number,
  locale?: string,
  currency: string = 'SAR'
) {
  let activeLocale = locale;
  if (!activeLocale || activeLocale === 'ar-SA') {
    if (typeof window !== 'undefined') {
      activeLocale = localStorage.getItem('language') === 'en' ? 'en-US' : 'ar-SA';
    } else {
      activeLocale = 'ar-SA';
    }
  }

  return new Intl.NumberFormat(activeLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * تنسيق التاريخ حسب اللغة
 * Format date based on locale
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale: string = 'ar'
) {
  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US';
  return new Intl.DateTimeFormat(localeCode, options).format(
    typeof date === 'string' ? new Date(date) : date
  );
}

/**
 * تنسيق التاريخ النسبي (منذ...)
 * Format relative time (e.g., "منذ 5 دقائق")
 */
export function formatRelativeTime(date: string | Date, locale: string = 'ar'): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (locale === 'en') {
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) { const m = Math.floor(diffInSeconds / 60); return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`; }
    if (diffInSeconds < 86400) { const h = Math.floor(diffInSeconds / 3600); return `${h} ${h === 1 ? 'hour' : 'hours'} ago`; }
    if (diffInSeconds < 2592000) { const d = Math.floor(diffInSeconds / 86400); return `${d} ${d === 1 ? 'day' : 'days'} ago`; }
    return formatDate(target, { year: 'numeric', month: 'short', day: 'numeric' }, 'en');
  }

  if (diffInSeconds < 60) {
    return 'الآن';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
  } else {
    return formatDate(target, { year: 'numeric', month: 'long', day: 'numeric' }, locale);
  }
}

/**
 * Debounce
 * تأخير تنفيذ الدالة (مفيد للبحث / الإدخال)
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}


/**
 * اختصار النص الطويل
 * Truncate long text
 */
export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * إنشاء slug من النص
 * Generate slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * التحقق من صحة البريد الإلكتروني
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * نسخ النص إلى الحافظة
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * الحصول على الأحرف الأولى من الاسم
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * تحويل حجم الملف إلى صيغة مقروءة
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * التحقق من أن الجهاز محمول
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * إنشاء معرف فريد
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * التحقق من صحة رابط الصور
 * Safely resolve an image URL — returns a valid URL string or null
 * Handles: full URLs, relative /storage paths, empty strings, null
 */
export function safeImageSrc(src: string | null | undefined): string | null {
  if (!src || typeof src !== 'string' || src.trim() === '') return null;
  // Full URL — valid as-is
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  // Relative path like /storage/... — valid, served via Next.js rewrite proxy
  if (src.startsWith('/')) return src;
  // Any other format (e.g., just a filename) — not renderable
  return null;
}
