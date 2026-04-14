/**
 * Professional Error Handler — Unified bilingual error messages
 * Maps HTTP status codes and common error patterns to clear, user-friendly messages.
 * Used across all admin and user-facing pages.
 */

import toast from 'react-hot-toast';

type Language = 'ar' | 'en';

interface ErrorMessages {
  ar: string;
  en: string;
}

interface HandleErrorOptions {
  /** The caught error object */
  error: any;
  /** Context of the action that failed */
  context?: string;
  /** Current language */
  lang?: Language;
  /** Custom field label mapping for validation errors */
  fieldLabels?: Record<string, ErrorMessages>;
  /** Toast duration in ms */
  duration?: number;
}

// ── Default field labels (common across admin pages) ──
const defaultFieldLabels: Record<string, ErrorMessages> = {
  name_ar: { ar: 'الاسم', en: 'Name' },
  name_en: { ar: 'الاسم بالإنجليزية', en: 'English Name' },
  description_ar: { ar: 'الوصف', en: 'Description' },
  price: { ar: 'السعر', en: 'Price' },
  discount_price: { ar: 'سعر الخصم', en: 'Discount price' },
  category_id: { ar: 'التصنيف', en: 'Category' },
  section_id: { ar: 'القسم', en: 'Section' },
  thumbnail: { ar: 'صورة الغلاف', en: 'Cover image' },
  ready_file: { ar: 'ملف القالب', en: 'Template file' },
  type: { ar: 'النوع', en: 'Type' },
  format: { ar: 'الصيغة', en: 'Format' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  code: { ar: 'الكود', en: 'Code' },
  amount: { ar: 'المبلغ', en: 'Amount' },
  title: { ar: 'العنوان', en: 'Title' },
  content: { ar: 'المحتوى', en: 'Content' },
  status: { ar: 'الحالة', en: 'Status' },
  slug: { ar: 'الرابط المختصر', en: 'Slug' },
  sort_order: { ar: 'الترتيب', en: 'Sort order' },
  is_active: { ar: 'الحالة', en: 'Status' },
  date: { ar: 'التاريخ', en: 'Date' },
  start_date: { ar: 'تاريخ البداية', en: 'Start date' },
  end_date: { ar: 'تاريخ النهاية', en: 'End date' },
  max_uses: { ar: 'الحد الأقصى للاستخدام', en: 'Max uses' },
  discount_type: { ar: 'نوع الخصم', en: 'Discount type' },
  discount_value: { ar: 'قيمة الخصم', en: 'Discount value' },
};

// ── Status-specific error messages ──
const statusMessages: Record<number, ErrorMessages> = {
  400: { ar: '❌ طلب غير صالح — تحقق من البيانات المُدخلة', en: '❌ Bad request — check input data' },
  401: { ar: '🔒 انتهت صلاحية الجلسة — يرجى تسجيل الدخول مرة أخرى', en: '🔒 Session expired — please log in again' },
  403: { ar: '🚫 ليس لديك صلاحية لتنفيذ هذا الإجراء', en: '🚫 You do not have permission for this action' },
  404: { ar: '⚠️ العنصر غير موجود — ربما تم حذفه مسبقاً', en: '⚠️ Item not found — may have been deleted' },
  413: { ar: '❌ حجم الملف أكبر من المسموح — تأكد من الحجم الأقصى', en: '❌ File too large — check maximum size limit' },
  422: { ar: '❌ خطأ في البيانات المدخلة — تحقق من جميع الحقول', en: '❌ Validation error — check all fields' },
  429: { ar: '⏳ طلبات كثيرة — انتظر قليلاً ثم حاول مرة أخرى', en: '⏳ Too many requests — wait and try again' },
  500: { ar: '❌ خطأ في الخادم — يرجى المحاولة لاحقاً أو التواصل مع الدعم', en: '❌ Server error — try again later or contact support' },
  502: { ar: '❌ الخادم غير متاح حالياً — يرجى المحاولة لاحقاً', en: '❌ Server unavailable — try again later' },
  503: { ar: '🔧 النظام تحت الصيانة — يرجى المحاولة لاحقاً', en: '🔧 System under maintenance — try later' },
};

/**
 * Handle any API error with professional, clear, bilingual toast messages.
 * 
 * Usage:
 * ```ts
 * try { await api.deleteTemplate(id); }
 * catch (error) { handleApiError({ error, context: 'حذف القالب' }); }
 * ```
 */
export function handleApiError({
  error,
  context,
  lang,
  fieldLabels: customLabels,
  duration = 5000,
}: HandleErrorOptions): void {
  // Detect language
  const isAr = lang === 'ar' || (typeof window !== 'undefined' && document.documentElement.lang === 'ar');
  const pick = (msgs: ErrorMessages) => isAr ? msgs.ar : msgs.en;

  const status = error?.response?.status;
  const serverMsg = error?.response?.data?.message;
  const validationErrors = error?.response?.data?.errors;
  const mergedLabels = { ...defaultFieldLabels, ...customLabels };

  // ── 1. Laravel Validation Errors (422 with field-level errors) ──
  if (validationErrors && typeof validationErrors === 'object') {
    Object.entries(validationErrors).forEach(([field, errArr]: [string, any]) => {
      const label = mergedLabels[field] ? pick(mergedLabels[field]) : field;
      if (Array.isArray(errArr)) {
        errArr.forEach((msg: string) => {
          toast.error(`❌ ${label}: ${msg}`, { duration: duration + 1000 });
        });
      }
    });
    return;
  }

  // ── 2. Known HTTP Status Codes ──
  if (status && statusMessages[status]) {
    const contextStr = context ? ` (${context})` : '';
    // For 422 with server message, prefer the server message
    if (status === 422 && serverMsg) {
      toast.error(`❌ ${serverMsg}`, { duration });
    } else {
      toast.error(`${pick(statusMessages[status])}${contextStr}`, { duration });
    }
    return;
  }

  // ── 3. Network / Timeout Errors ──
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    toast.error(isAr
      ? '⏳ انتهت مهلة الاتصال — الاتصال بطيء أو الخادم مشغول. حاول مرة أخرى'
      : '⏳ Request timed out — slow connection or busy server. Try again',
      { duration: 6000 }
    );
    return;
  }

  if (error?.message?.includes('Network Error') || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    toast.error(isAr
      ? '🌐 لا يوجد اتصال بالإنترنت — تحقق من الشبكة وحاول مرة أخرى'
      : '🌐 No internet connection — check network and try again',
      { duration: 6000 }
    );
    return;
  }

  // ── 4. Fallback with server message or generic ──
  const fallback = serverMsg || (isAr
    ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى'
    : 'An unexpected error occurred. Please try again');
  toast.error(`❌ ${fallback}`, { duration });
}

/**
 * Shorthand for ta() pattern used throughout the codebase.
 * Returns Arabic or English string based on document language.
 */
export function getErrorLang(): Language {
  if (typeof window !== 'undefined' && document.documentElement.lang === 'en') return 'en';
  return 'ar';
}
