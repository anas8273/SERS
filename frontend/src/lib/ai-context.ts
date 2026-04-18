/**
 * lib/ai-context.ts  — SERS AI Brain
 *
 * Builds rich, context-aware system prompts that make the AI understand:
 *  - What SERS is (platform knowledge)
 *  - Who the current user is and what they own
 *  - Which page/section the user is on
 *  - Real platform stats (for admin)
 */

import type { Template } from '@/types';

// ── Platform knowledge base ───────────────────────────────────────────────────
const SERS_PLATFORM_KNOWLEDGE = `
أنت مساعد ذكي متخصص لمنصة SERS (منصة الخدمات التعليمية الذكية — سجلات ونماذج وخطط وتقارير وشهادات وتحليل نتائج).

## عن المنصة:
SERS سوق إلكتروني سعودي يخدم المعلمين والمعلمات في المملكة العربية السعودية.
يتيح للمعلمين شراء وإنشاء وتصدير قوالب التسجيل والتوثيق التعليمي الاحترافية.

## أقسام المنصة الرئيسية:
- ملفات الإنجاز: توثيق إنجازات المعلم المهنية والأكاديمية
- شواهد الأداء: تقييم وتوثيق مستوى الأداء الوظيفي
- الشهادات والتقدير: شهادات تقدير رسمية احترافية
- الاختبارات والتقييم: أوراق اختبار متنوعة المستويات
- السجلات المدرسية: سجلات الحضور والغياب والمعاملات الإدارية
- خطط التدريس: خطط دروس وخطط فصلية/سنوية
- التقارير التعليمية: تقارير أداء الطلاب والفصول
- منتجات المعرفة: أبحاث ومقالات تربوية
- الأنشطة والمبادرات: خطط المبادرات والأنشطة الطلابية
- التعليم العلاجي والإثرائي: خطط دعم التعلم
- سجل المتابعة: متابعة الطلاب وأولياء الأمور

## الجمهور المستهدف:
- المعلمون والمعلمات (الجمهور الأكبر)
- الإداريون المدرسيون (المديرون والنواب)
- الموجهون التربويون
- معلمو التربية الخاصة
- معلمو رياض الأطفال

## الميزات الرئيسية:
- متجر القوالب: تصفح وشراء آلاف القوالب الجاهزة
- المحرر الذكي: تعديل القوالب وإدخال البيانات ثم تصديرها PDF
- الخدمات التعليمية: 8 خدمات متخصصة مع AI لملء الحقول تلقائياً
- الذكاء الاصطناعي: مساعدة في كتابة المحتوى وتوليد النصوص التعليمية

## قواعد الإجابة:
1. أجب باللغة العربية الفصحى دائماً ما لم يطلب الإنجليزية
2. اقتراحاتك يجب أن تكون عملية ومناسبة لسياق التعليم السعودي
3. كن مختصراً ومفيداً — تجنب التطويل
4. إذا طُلب إنشاء محتوى، استخدم اللغة المهنية المناسبة للوثائق الرسمية
`.trim();

// ── Page context descriptions (bilingual) ────────────────────────────────────
const PAGE_CONTEXTS_AR: Record<string, string> = {
  '/': 'الصفحة الرئيسية للمنصة — المستخدم يستعرض ميزات SERS',
  '/marketplace': 'صفحة متجر القوالب — المستخدم يبحث عن قوالب للشراء',
  '/marketplace/[slug]': 'صفحة تفاصيل قالب معين في المتجر',
  '/dashboard': 'لوحة تحكم المستخدم — يرى نشاطه وقوالبه وسجلاته',
  '/dashboard/achievements': 'صفحة ملفات الإنجاز',
  '/dashboard/certificates': 'صفحة الشهادات والتقدير',
  '/dashboard/plans': 'صفحة خطط التدريس',
  '/dashboard/tests': 'صفحة الاختبارات والتقييم',
  '/dashboard/distributions': 'صفحة توزيعات المنهج',
  '/dashboard/follow-up-log': 'صفحة سجل المتابعة',
  '/dashboard/knowledge-production': 'صفحة منتجات المعرفة',
  '/dashboard/work-evidence': 'صفحة شواهد الأداء',
  '/dashboard/question-bank': 'صفحة بنك الأسئلة',
  '/dashboard/worksheets': 'صفحة أوراق العمل',
  '/dashboard/ai-assistant': 'صفحة المساعد الذكي — محادثة مع AI',
  '/editor': 'محرر القوالب — المستخدم يعدّل قالباً ويدخل بياناته',
  '/admin': 'لوحة إدارة النظام — المدير يراقب ويدير المنصة',
};

const PAGE_CONTEXTS_EN: Record<string, string> = {
  '/': 'Platform homepage — User is browsing SERS features',
  '/marketplace': 'Template store — User is looking for templates to buy',
  '/marketplace/[slug]': 'Template details page in the store',
  '/dashboard': 'User dashboard — Viewing activity, templates, and records',
  '/dashboard/achievements': 'Achievement portfolio page',
  '/dashboard/certificates': 'Certificates and awards page',
  '/dashboard/plans': 'Teaching plans page',
  '/dashboard/tests': 'Tests and assessment page',
  '/dashboard/distributions': 'Curriculum distribution page',
  '/dashboard/follow-up-log': 'Follow-up log page',
  '/dashboard/knowledge-production': 'Knowledge production page',
  '/dashboard/work-evidence': 'Work evidence page',
  '/dashboard/question-bank': 'Question bank page',
  '/dashboard/worksheets': 'Worksheets page',
  '/dashboard/ai-assistant': 'AI assistant — Chat with AI',
  '/editor': 'Template editor — User is editing and filling a template',
  '/admin': 'Admin dashboard — System administrator monitoring',
};

export const PAGE_CONTEXTS = PAGE_CONTEXTS_AR;

export function getPageContext(path: string, locale: string = 'ar'): string {
  const contexts = locale === 'en' ? PAGE_CONTEXTS_EN : PAGE_CONTEXTS_AR;
  return contexts[path] || (locale === 'en' ? `Page: ${path}` : `صفحة: ${path}`);
}

// ── Role-based route access maps ──────────────────────────────────────────────
// Used to filter navigation suggestions based on user role
export const ROLE_ROUTES = {
  user: [
    '/', '/marketplace', '/about', '/services', '/contact',
    '/dashboard', '/dashboard/ai-assistant', '/my-library',
    '/wishlist', '/orders', '/settings',
    '/dashboard/achievements', '/dashboard/certificates',
    '/dashboard/plans', '/dashboard/tests', '/dashboard/distributions',
    '/dashboard/follow-up-log', '/dashboard/knowledge-production',
    '/dashboard/work-evidence', '/dashboard/question-bank',
    '/dashboard/worksheets',
  ],
  admin: [
    '/admin', '/admin/templates', '/admin/orders', '/admin/users',
    '/admin/reports', '/admin/sections', '/admin/categories',
    '/admin/ai-management', '/admin/settings', '/admin/coupons',
  ],
} as const;

// ── User context interface ────────────────────────────────────────────────────
export interface UserAIContext {
  name?: string;
  role?: string;
  ownedTemplatesCount?: number;
  recordsCount?: number;
  currentPage?: string;
  recentActivity?: string;
  // Admin-only
  totalRevenue?: number;
  totalOrders?: number;
  totalUsers?: number;
  pendingOrders?: number;
  todayRevenue?: number;
  topTemplate?: string;
}

// ── Admin stats context ───────────────────────────────────────────────────────
export interface AdminStats {
  total_revenue: number;
  total_orders: number;
  total_users: number;
  total_templates: number;
  monthly_revenue: number;
  revenue_trend: number;
  new_users_this_month: number;
  today_orders: number;
  today_revenue: number;
  orders_by_status: {
    pending: number;
    completed: number;
    cancelled: number;
    refunded: number;
  };
  top_templates?: Array<{ name_ar: string; sales_count: number; revenue: number }>;
}

// ── Build user system prompt ──────────────────────────────────────────────────
export function buildUserSystemPrompt(ctx: UserAIContext, locale: string = 'ar'): string {
  const pageName = ctx.currentPage
    ? PAGE_CONTEXTS[ctx.currentPage] || `صفحة: ${ctx.currentPage}`
    : 'المنصة';

  const userSection = [
    ctx.name ? `اسم المستخدم: ${ctx.name}` : null,
    ctx.role === 'admin' ? 'الدور: مدير النظام' : 'الدور: معلم/معلمة',
    ctx.ownedTemplatesCount !== undefined
      ? `القوالب المكتسبة: ${ctx.ownedTemplatesCount} قالب`
      : null,
    ctx.recordsCount !== undefined
      ? `عدد السجلات: ${ctx.recordsCount} سجل`
      : null,
    `الصفحة الحالية: ${pageName}`,
    ctx.recentActivity ? `آخر نشاط: ${ctx.recentActivity}` : null,
  ].filter(Boolean).join('\n');

  const langInstruction = locale === 'en'
    ? '\n\nLANGUAGE: Respond entirely in English.'
    : '\n\nاللغة: أجب بالعربية الفصحى دائماً.';

  const routeGuard = ctx.role === 'admin'
    ? ''
    : '\n\n⛔ ممنوع اقتراح أي رابط يبدأ بـ /admin — المستخدم ليس مديراً.';

  return `${SERS_PLATFORM_KNOWLEDGE}

## بيانات المستخدم الحالي:
${userSection}

## قواعد تنسيق الردود:
- عند اقتراح صفحة أو قسم، استخدم صيغة Markdown: [اسم الصفحة](/المسار)
- استخدم **نص** للتأكيد على الكلمات المهمة.
- استخدم - للقوائم و## للعناوين الفرعية.
- لا تكتب روابط كنص عادي — استخدم دائماً [النص](الرابط).

## مهمتك:
- ساعد المستخدم في الاستفادة القصوى من منصة SERS
- اقترح قوالب أو خدمات مناسبة لاحتياجاته بناءً على صفحته الحالية
- ساعده في كتابة محتوى تعليمي احترافي إذا طلب
- أجب بدقة على أسئلته عن المنصة وميزاتها${langInstruction}${routeGuard}`;
}

// ── Build admin system prompt (with real stats, bilingual) ────────────────────
export function buildAdminSystemPrompt(stats: AdminStats, locale: string = 'ar'): string {
  const isEn = locale === 'en';
  const formatSAR = (n: number) =>
    isEn
      ? `${n.toLocaleString('en-US')} SAR`
      : n.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });

  if (isEn) {
    const statsSection = `
## Live Platform Statistics (Updated Now):
- Total Revenue: ${formatSAR(stats.total_revenue)}
- Monthly Revenue: ${formatSAR(stats.monthly_revenue)}
- Revenue Trend: ${stats.revenue_trend >= 0 ? `▲ +${stats.revenue_trend}%` : `▼ ${stats.revenue_trend}%`}
- Total Orders: ${stats.total_orders.toLocaleString('en')}
- Total Users: ${stats.total_users.toLocaleString('en')}
- Total Templates: ${stats.total_templates.toLocaleString('en')}
- New Users This Month: ${stats.new_users_this_month}
- Today's Orders: ${stats.today_orders}
- Today's Revenue: ${formatSAR(stats.today_revenue)}
- Pending Orders: ${stats.orders_by_status.pending}
- Completed Orders: ${stats.orders_by_status.completed}
- Cancelled Orders: ${stats.orders_by_status.cancelled}
${stats.top_templates?.length
  ? `- Best Sellers: ${stats.top_templates.slice(0, 3).map(t => `"${t.name_ar}" (${t.sales_count} sold)`).join(', ')}`
  : ''}`.trim();

    return `You are SERS AI — an expert business analytics assistant for the SERS educational platform (Saudi Arabia).

## Your Role: System Administrator AI Advisor

${statsSection}

## Your Mission:
1. Analyze the data above and provide data-driven recommendations
2. Never invent numbers — always cite real statistics from above
3. Provide actionable recommendations (pricing, marketing, content, quality)
4. Be concise — max 5 lines for general answers
5. When actions are needed, clearly state the steps required
6. Format links as [Page Name](/path) when referencing platform pages`;
  }

  const statsSection = `
## إحصائيات المنصة الحقيقية (محدّثة الآن):
- إجمالي الإيرادات: ${formatSAR(stats.total_revenue)}
- إيرادات الشهر الحالي: ${formatSAR(stats.monthly_revenue)}
- اتجاه الإيرادات: ${stats.revenue_trend >= 0 ? `▲ +${stats.revenue_trend}%` : `▼ ${stats.revenue_trend}%`}
- إجمالي الطلبات: ${stats.total_orders.toLocaleString('ar')}
- إجمالي المستخدمين: ${stats.total_users.toLocaleString('ar')}
- إجمالي القوالب: ${stats.total_templates.toLocaleString('ar')}
- مستخدمون جدد هذا الشهر: ${stats.new_users_this_month}
- طلبات اليوم: ${stats.today_orders}
- إيرادات اليوم: ${formatSAR(stats.today_revenue)}
- الطلبات المعلقة: ${stats.orders_by_status.pending}
- الطلبات المكتملة: ${stats.orders_by_status.completed}
- الطلبات الملغاة: ${stats.orders_by_status.cancelled}
${stats.top_templates?.length
  ? `- أكثر القوالب مبيعاً: ${stats.top_templates.slice(0, 3).map(t => `"${t.name_ar}" (${t.sales_count} مبيعة)`).join('، ')}`
  : ''}`.trim();

  return `${SERS_PLATFORM_KNOWLEDGE}

## وضعك الحالي: مدير النظام في لوحة الإدارة

${statsSection}

## مهمتك كمستشار ذكاء اصطناعي للمدير:
1. حلّل البيانات أعلاه وقدّم توصيات مبنية على الأرقام الفعلية
2. لا تخترع أرقاماً — استشهد دائماً بالأرقام الحقيقية من البيانات أعلاه
3. عند السؤال عن الطلبات المعلقة، الجواب هو ${stats.orders_by_status.pending} طلب فعلي
4. قدّم توصيات قابلة للتنفيذ (تسعير، تسويق، محتوى، جودة)
5. كن مختصراً وواضحاً — لا تتجاوز 5 أسطر في الإجابات العامة
6. إذا طُلب إجراء (مثل الموافقة على الطلبات)، أذكر الخطوات المطلوبة بوضوح
7. اكتب الروابط بصيغة [اسم الصفحة](/المسار)`;
}

// ── Quick insight generator (for dashboard cards) ─────────────────────────────
export function generateQuickInsights(stats: AdminStats): string[] {
  const insights: string[] = [];
  const formatSAR = (n: number) =>
    n.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });

  // Revenue trend insight
  if (stats.revenue_trend > 20) {
    insights.push(`📈 الإيرادات ترتفع ${stats.revenue_trend}% — وقت ممتاز لإطلاق قوالب جديدة`);
  } else if (stats.revenue_trend < -10) {
    insights.push(`📉 الإيرادات انخفضت ${Math.abs(stats.revenue_trend)}% — راجع استراتيجية التسعير`);
  } else {
    insights.push(`💰 إيرادات الشهر: ${formatSAR(stats.monthly_revenue)} بنمو متوازن`);
  }

  // Pending orders insight
  if (stats.orders_by_status.pending > 10) {
    insights.push(`⏳ ${stats.orders_by_status.pending} طلب معلق يحتاج معالجة — راجع لوحة الطلبات`);
  } else if (stats.orders_by_status.pending === 0) {
    insights.push(`✅ لا توجد طلبات معلقة — المعالجة مثالية`);
  } else {
    insights.push(`📦 ${stats.orders_by_status.pending} طلب معلق — يُنصح بالمعالجة خلال 24 ساعة`);
  }

  // New users insight
  if (stats.new_users_this_month > 50) {
    insights.push(`👥 ${stats.new_users_this_month} مستخدم جديد هذا الشهر — نمو قوي في القاعدة`);
  } else if (stats.new_users_this_month < 10) {
    insights.push(`👥 ${stats.new_users_this_month} مستخدم جديد فقط — فكّر في حملة تسويقية`);
  } else {
    insights.push(`👥 ${stats.new_users_this_month} مستخدم جديد هذا الشهر`);
  }

  // Today insight
  if (stats.today_orders > 0) {
    insights.push(`🌅 اليوم: ${stats.today_orders} طلب و${formatSAR(stats.today_revenue)} إيرادات`);
  }

  return insights.slice(0, 3);
}

// ── Quick action prompts (bilingual) ─────────────────────────────────────────
export const ADMIN_QUICK_PROMPTS = [
  { label: '📊 تحليل المبيعات', labelEn: '📊 Sales Analysis', prompt: 'حلّل أداء المبيعات الحالي وقدّم 3 توصيات لزيادة الإيرادات بناءً على البيانات المتاحة', promptEn: 'Analyze current sales performance and provide 3 actionable recommendations to increase revenue based on available data' },
  { label: '👥 تقرير المستخدمين', labelEn: '👥 User Report', prompt: 'قدّم تقريراً موجزاً عن قاعدة المستخدمين والنمو الشهري، وأي استراتيجيات للاحتفاظ بهم', promptEn: 'Provide a concise report on the user base, monthly growth, and retention strategies' },
  { label: '💡 توصيات التسعير', labelEn: '💡 Pricing Tips', prompt: 'بناءً على بيانات المبيعات والطلبات، هل التسعير الحالي مناسب؟ وما التعديلات المقترحة؟', promptEn: 'Based on sales and orders data, is the current pricing appropriate? What adjustments do you suggest?' },
  { label: '⚡ أولويات اليوم', labelEn: '⚡ Today\'s Priorities', prompt: 'ما هي أهم 3 مهام يجب أن أتعامل معها اليوم كمدير للمنصة بناءً على البيانات الحالية؟', promptEn: 'What are the top 3 tasks I should handle today as platform admin based on current data?' },
  { label: '🎯 خطة النمو', labelEn: '🎯 Growth Plan', prompt: 'بناءً على الإحصائيات الحالية، ما هي خطة عمل قصيرة المدى (30 يوم) لتحسين أداء المنصة؟', promptEn: 'Based on current statistics, what is a short-term (30-day) action plan to improve platform performance?' },
] as const;
