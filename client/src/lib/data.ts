// بيانات الأقسام والخدمات - الهيكلة الشاملة v4
// 13 قسم رئيسي: 10 تفاعلي+متجر، 1 متجر فقط (مجمّع)، 1 أدوات، 1 خطط (قادم قريباً)

export type ServiceMode = "interactive" | "store" | "both";
export type ServiceFormat = "pdf" | "word" | "pptx" | "google-sites" | "online";
export type UserRole = "teacher" | "admin" | "counselor" | "activity" | "kindergarten" | "special-ed" | "all";

export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  mode: ServiceMode;
  price: number;
  format?: ServiceFormat[];
  roles?: UserRole[];
  category?: string;
  tags?: string[];
  comingSoon?: boolean;
}

export interface Section {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  hasInteractive: boolean;
  hasStore: boolean;
  comingSoon?: boolean;
  route?: string;
  services: Service[];
}

// تعريف الوظائف المتاحة للفلترة
export const USER_ROLES: { id: UserRole; label: string; icon: string }[] = [
  { id: "all", label: "جميع الخدمات", icon: "LayoutGrid" },
  { id: "teacher", label: "المعلمين والمعلمات", icon: "GraduationCap" },
  { id: "admin", label: "الإدارة المدرسية", icon: "Building2" },
  { id: "counselor", label: "التوجيه والإرشاد", icon: "HeartHandshake" },
  { id: "activity", label: "النشاط الطلابي", icon: "Trophy" },
  { id: "kindergarten", label: "رياض الأطفال", icon: "Baby" },
  { id: "special-ed", label: "التربية الخاصة", icon: "Accessibility" },
];

export const sections: Section[] = [
  // ═══════════════════════════════════════════════════════════════
  // القسم 1: شواهد الأداء الوظيفي (موجود + متجر)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "1",
    slug: "performance-evidence",
    title: "شواهد الأداء الوظيفي",
    description: "توثيق شواهد الأداء الوظيفي لجميع شاغلي الوظائف التعليمية وفق معايير وزارة التعليم مع تصنيف ذكي بالذكاء الاصطناعي",
    icon: "Award",
    color: "#059669",
    hasInteractive: true,
    hasStore: true,
    route: "/performance-evidence",
    services: [
      { id: "1-1", slug: "smart-evidence-builder", title: "منشئ الشواهد الذكي", description: "أداة تفاعلية شاملة لإنشاء وتصنيف شواهد الأداء الوظيفي مع دعم AI", mode: "interactive", price: 0, roles: ["teacher", "admin", "counselor", "activity", "special-ed"] },
      { id: "1-2", slug: "evidence-portfolio-template", title: "قالب ملف شواهد جاهز - معلم", description: "ملف شواهد أداء وظيفي جاهز للمعلمين بتصميم احترافي", mode: "store", price: 29, format: ["pdf", "word"], roles: ["teacher"] },
      { id: "1-3", slug: "evidence-portfolio-admin", title: "قالب ملف شواهد - إداري", description: "ملف شواهد أداء وظيفي جاهز للإداريين", mode: "store", price: 29, format: ["pdf", "word"], roles: ["admin"] },
      { id: "1-4", slug: "evidence-portfolio-counselor", title: "قالب ملف شواهد - موجه", description: "ملف شواهد أداء وظيفي جاهز للموجهين", mode: "store", price: 29, format: ["pdf", "word"], roles: ["counselor"] },
      { id: "1-5", slug: "evidence-google-sites", title: "قالب شواهد Google Sites", description: "ملف شواهد أداء وظيفي على Google Sites جاهز للتخصيص", mode: "store", price: 39, format: ["google-sites"], roles: ["teacher", "admin"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 2: ملف الإنجاز (جديد)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "2",
    slug: "achievement-portfolio",
    title: "ملف الإنجاز",
    description: "إنشاء السجل المهني الشامل بالذكاء الاصطناعي مع قوالب احترافية متعددة التصاميم",
    icon: "FolderOpen",
    color: "#7C3AED",
    hasInteractive: true,
    hasStore: true,
    route: "/portfolio",
    services: [
      { id: "2-1", slug: "ai-portfolio-builder", title: "منشئ ملف الإنجاز الذكي", description: "أداة تفاعلية شاملة بالذكاء الاصطناعي لإنشاء ملف إنجاز احترافي متكامل", mode: "interactive", price: 0, roles: ["teacher", "admin", "counselor", "activity", "special-ed"] },
      { id: "2-2", slug: "portfolio-template-modern", title: "قالب ملف إنجاز - تصميم عصري", description: "ملف إنجاز جاهز بتصميم عصري واحترافي", mode: "store", price: 35, format: ["pdf", "word"], roles: ["all"] },
      { id: "2-3", slug: "portfolio-template-classic", title: "قالب ملف إنجاز - تصميم كلاسيكي", description: "ملف إنجاز جاهز بتصميم كلاسيكي رسمي", mode: "store", price: 35, format: ["pdf", "word"], roles: ["all"] },
      { id: "2-4", slug: "portfolio-google-sites", title: "قالب ملف إنجاز Google Sites", description: "ملف إنجاز إلكتروني على Google Sites", mode: "store", price: 45, format: ["google-sites"], roles: ["all"] },
      { id: "2-5", slug: "portfolio-pptx", title: "قالب ملف إنجاز PowerPoint", description: "ملف إنجاز بصيغة PowerPoint قابل للتعديل", mode: "store", price: 29, format: ["pptx"], roles: ["all"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 3: مركز التقارير الشامل (جديد)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "3",
    slug: "reports-center",
    title: "مركز التقارير الشامل",
    description: "إنشاء جميع أنواع التقارير التعليمية والتوثيقية بنماذج ديناميكية مدعومة بالذكاء الاصطناعي",
    icon: "FileText",
    color: "#2563EB",
    hasInteractive: true,
    hasStore: true,
    route: "/reports",
    services: [
      { id: "3-1", slug: "ai-report-builder", title: "منشئ التقارير الذكي", description: "أداة تفاعلية بالذكاء الاصطناعي لإنشاء تقارير مخصصة مع حقول ديناميكية", mode: "interactive", price: 0, roles: ["teacher", "admin", "counselor", "activity"] },
      { id: "3-2", slug: "documentation-report", title: "تقرير توثيق نشاط/فعالية", description: "نموذج تقرير توثيق شامل لأي نشاط أو فعالية", mode: "interactive", price: 0, roles: ["teacher", "admin", "activity"] },
      { id: "3-3", slug: "educational-report", title: "تقرير تعليمي", description: "نموذج تقرير تعليمي شامل", mode: "interactive", price: 0, roles: ["teacher", "admin"] },
      { id: "3-4", slug: "strategy-report", title: "تقرير تطبيق استراتيجية تدريس", description: "تقرير توثيق تطبيق استراتيجية تدريس", mode: "interactive", price: 0, roles: ["teacher"] },
      { id: "3-5", slug: "plc-report", title: "تقرير مجتمعات التعلم المهنية", description: "تقرير جلسات مجتمعات التعلم المهنية", mode: "interactive", price: 0, roles: ["teacher", "admin"] },
      { id: "3-6", slug: "peer-visits-report", title: "تقرير تبادل الزيارات", description: "استمارة وتقرير تبادل الزيارات بين المعلمين", mode: "interactive", price: 0, roles: ["teacher", "admin"] },
      { id: "3-7", slug: "workshop-report", title: "تقرير ورشة عمل", description: "نموذج تقرير ورشة عمل أو برنامج تدريبي", mode: "interactive", price: 0, roles: ["teacher", "admin"] },
      { id: "3-8", slug: "action-research", title: "البحث الإجرائي", description: "نموذج البحث الإجرائي", mode: "interactive", price: 0, roles: ["teacher"] },
      { id: "3-9", slug: "lesson-study", title: "بحث الدّرس", description: "نموذج بحث الدرس", mode: "interactive", price: 0, roles: ["teacher"] },
      { id: "3-10", slug: "report-templates-store", title: "قوالب تقارير جاهزة", description: "مجموعة قوالب تقارير متنوعة جاهزة للتحميل", mode: "store", price: 19, format: ["pdf", "word"], roles: ["all"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 4: صانع الشهادات (محسّن)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "4",
    slug: "certificate-builder",
    title: "صانع الشهادات",
    description: "أداة تفاعلية شاملة لإنشاء جميع أنواع الشهادات بثيمات وقوالب متعددة مع تصدير PDF",
    icon: "Medal",
    color: "#D97706",
    hasInteractive: true,
    hasStore: true,
    route: "/certificates",
    services: [
      { id: "4-1", slug: "certificate-maker", title: "صانع الشهادات التفاعلي", description: "أداة شاملة لإنشاء شهادات الشكر والتقدير والحضور والتخرج بثيمات متعددة", mode: "interactive", price: 0, roles: ["all"] },
      { id: "4-2", slug: "appreciation-certs-pack", title: "حزمة شهادات شكر وتقدير", description: "مجموعة شهادات شكر وتقدير بتصاميم متنوعة", mode: "store", price: 19, format: ["pdf", "word"], roles: ["all"] },
      { id: "4-3", slug: "graduation-certs-pack", title: "حزمة شهادات تخرج", description: "شهادات تخرج لجميع المراحل بتصاميم احترافية", mode: "store", price: 19, format: ["pdf", "word"], roles: ["all"] },
      { id: "4-4", slug: "occasion-certs-pack", title: "حزمة شهادات المناسبات", description: "شهادات اليوم الوطني ويوم المعلم ويوم التأسيس", mode: "store", price: 15, format: ["pdf"], roles: ["all"] },
      { id: "4-5", slug: "training-certs-pack", title: "حزمة شهادات تدريبية", description: "شهادات حضور دورات وورش عمل ومشاركة", mode: "store", price: 19, format: ["pdf", "word"], roles: ["all"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 5: السيرة الذاتية الذكية (جديد)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "5",
    slug: "smart-resume",
    title: "السيرة الذاتية الذكية",
    description: "صانع سيرة ذاتية تفاعلي بالذكاء الاصطناعي مع قوالب متعددة ودعم QR للمرفقات",
    icon: "UserCircle",
    color: "#0891B2",
    hasInteractive: true,
    hasStore: true,
    route: "/smart-cv",
    services: [
      { id: "5-1", slug: "ai-resume-builder", title: "منشئ السيرة الذاتية الذكي", description: "أداة تفاعلية بالذكاء الاصطناعي لإنشاء سيرة ذاتية احترافية مع QR للمرفقات", mode: "interactive", price: 0, roles: ["all"] },
      { id: "5-2", slug: "resume-template-modern", title: "قالب سيرة ذاتية عصري", description: "قالب سيرة ذاتية بتصميم عصري وأنيق", mode: "store", price: 15, format: ["pdf", "word"], roles: ["all"] },
      { id: "5-3", slug: "resume-template-academic", title: "قالب سيرة ذاتية أكاديمي", description: "قالب سيرة ذاتية مخصص للمجال الأكاديمي والتعليمي", mode: "store", price: 15, format: ["pdf", "word"], roles: ["all"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 6: الخطط العلاجية والإثرائية (محسّن)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "6",
    slug: "treatment-plans",
    title: "الخطط العلاجية والإثرائية",
    description: "أداة تفاعلية متكاملة لإنشاء الخطط العلاجية والإثرائية مع متجر قوالب جاهزة",
    icon: "HeartPulse",
    color: "#DC2626",
    hasInteractive: true,
    hasStore: true,
    route: "/treatment-plans",
    services: [
      { id: "6-1", slug: "treatment-plan-builder", title: "منشئ الخطط العلاجية والإثرائية", description: "أداة تفاعلية شاملة لإنشاء خطط علاجية وإثرائية فردية وجماعية", mode: "interactive", price: 0, roles: ["teacher", "special-ed", "counselor"] },
      { id: "6-2", slug: "remedial-plans-pack", title: "حزمة خطط علاجية جاهزة", description: "مجموعة خطط علاجية جاهزة لجميع المراحل والمواد", mode: "store", price: 25, format: ["pdf", "word"], roles: ["teacher", "special-ed"] },
      { id: "6-3", slug: "enrichment-plans-pack", title: "حزمة خطط إثرائية جاهزة", description: "مجموعة خطط إثرائية جاهزة للطلاب المتفوقين", mode: "store", price: 25, format: ["pdf", "word"], roles: ["teacher"] },
      { id: "6-4", slug: "iep-plans-pack", title: "حزمة خطط IEP", description: "خطط تعليمية فردية لذوي الاحتياجات الخاصة", mode: "store", price: 29, format: ["pdf", "word"], roles: ["special-ed"] },
      { id: "6-5", slug: "behavior-support-plans", title: "خطط دعم السلوك الإيجابي", description: "خطط دعم السلوك الإيجابي جاهزة", mode: "store", price: 19, format: ["pdf", "word"], roles: ["counselor", "special-ed"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 7: منصة الاختبارات الذكية (جديد)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "7",
    slug: "smart-tests",
    title: "منصة الاختبارات الذكية",
    description: "منشئ اختبارات تفاعلي شامل للمنهج السعودي مدعوم بالذكاء الاصطناعي مع متجر نماذج جاهزة",
    icon: "ClipboardCheck",
    color: "#9333EA",
    hasInteractive: true,
    hasStore: true,
    route: "/exams",
    services: [
      { id: "7-1", slug: "ai-test-builder", title: "منشئ الاختبارات الذكي", description: "أداة تفاعلية بالذكاء الاصطناعي لإنشاء اختبارات وفق المنهج السعودي", mode: "interactive", price: 0, roles: ["teacher"] },
      { id: "7-2", slug: "test-specs-builder", title: "جدول مواصفات اختبار", description: "أداة إنشاء جدول مواصفات اختبار تفاعلي", mode: "interactive", price: 0, roles: ["teacher"] },
      { id: "7-3", slug: "nafs-arabic", title: "نافس - اللغة العربية", description: "ملف الاختبارات الوطنية نافس مادة اللغة العربية", mode: "store", price: 29, format: ["pdf"], roles: ["teacher"] },
      { id: "7-4", slug: "nafs-math", title: "نافس - الرياضيات", description: "ملف الاختبارات الوطنية نافس مادة الرياضيات", mode: "store", price: 29, format: ["pdf"], roles: ["teacher"] },
      { id: "7-5", slug: "nafs-science", title: "نافس - العلوم", description: "ملف الاختبارات الوطنية نافس مادة العلوم", mode: "store", price: 29, format: ["pdf"], roles: ["teacher"] },
      { id: "7-6", slug: "test-templates-pack", title: "حزمة نماذج اختبارات جاهزة", description: "نماذج اختبارات فترية ونهائية لجميع المواد", mode: "store", price: 25, format: ["pdf", "word"], roles: ["teacher"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 8: تحليل النتائج والتصحيح الآلي (محسّن)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "8",
    slug: "grade-analysis",
    title: "تحليل النتائج والتصحيح الآلي",
    description: "نظام تفاعلي متكامل لتحليل النتائج وتصحيح الاختبارات بالذكاء الاصطناعي مع رسوم بيانية وتقارير",
    icon: "TrendingUp",
    color: "#EA580C",
    hasInteractive: true,
    hasStore: false,
    route: "/grade-analysis",
    services: [
      { id: "8-1", slug: "grades-analyzer", title: "محلل النتائج التفاعلي", description: "تحليل شامل لنتائج الطلاب مع رسوم بيانية وتقارير إحصائية", mode: "interactive", price: 0, roles: ["teacher", "admin"] },
      { id: "8-2", slug: "ai-auto-correction", title: "التصحيح الآلي بالذكاء الاصطناعي", description: "رفع صور الاختبارات وتصحيحها تلقائياً مع دعم الأسئلة الموضوعية والمقالية", mode: "interactive", price: 0, roles: ["teacher"] },
      { id: "8-3", slug: "student-performance-tracker", title: "متابعة أداء الطلاب", description: "سجل متابعة أداء الطلاب عبر الفترات مع مقارنات", mode: "interactive", price: 0, roles: ["teacher", "admin", "counselor"] },
      { id: "8-4", slug: "classification-reports", title: "تقارير التصنيف", description: "تصنيف الطلاب حسب التحصيل وأنماط التعلم", mode: "interactive", price: 0, roles: ["teacher", "counselor"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 9: صانع الإذاعة المدرسية (جديد)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "9",
    slug: "school-broadcast",
    title: "صانع الإذاعة المدرسية",
    description: "أداة تفاعلية بالذكاء الاصطناعي لتوليد إذاعات مدرسية كاملة مع تصدير PDF بهوية بصرية احترافية",
    icon: "Radio",
    color: "#F59E0B",
    hasInteractive: true,
    hasStore: true,
    route: "/school-radio",
    services: [
      { id: "9-1", slug: "ai-broadcast-builder", title: "منشئ الإذاعة الذكي", description: "أداة بالذكاء الاصطناعي لتوليد إذاعة مدرسية كاملة من موضوع واحد", mode: "interactive", price: 0, roles: ["teacher", "activity"] },
      { id: "9-2", slug: "broadcast-national-day", title: "إذاعة اليوم الوطني", description: "إذاعة مدرسية جاهزة عن اليوم الوطني", mode: "store", price: 0, format: ["pdf"], roles: ["all"] },
      { id: "9-3", slug: "broadcast-teacher-day", title: "إذاعة يوم المعلم", description: "إذاعة مدرسية جاهزة عن يوم المعلم", mode: "store", price: 0, format: ["pdf"], roles: ["all"] },
      { id: "9-4", slug: "broadcast-pack", title: "حزمة إذاعات مدرسية متنوعة", description: "مجموعة إذاعات مدرسية جاهزة لمختلف المواضيع والمناسبات", mode: "store", price: 19, format: ["pdf"], roles: ["all"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 10: التحضير وخطط الدروس (قادم قريباً)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "10",
    slug: "lesson-planning",
    title: "التحضير وخطط الدروس",
    description: "واجهة تفاعلية مدعومة بالذكاء الاصطناعي لتوزيع المناهج وخطط الوحدات والتحضير الأسبوعي والفصلي",
    icon: "CalendarDays",
    color: "#0D9488",
    hasInteractive: true,
    hasStore: true,
    comingSoon: true,
    services: [
      { id: "10-1", slug: "curriculum-distribution", title: "توزيع المنهج الدراسي", description: "أداة تفاعلية لتوزيع المنهج على الأسابيع الدراسية", mode: "interactive", price: 0, roles: ["teacher"], comingSoon: true },
      { id: "10-2", slug: "weekly-plan-builder", title: "الخطة الأسبوعية", description: "إنشاء خطط أسبوعية تفاعلية", mode: "interactive", price: 0, roles: ["teacher"], comingSoon: true },
      { id: "10-3", slug: "unit-plan-builder", title: "تخطيط الوحدات", description: "إنشاء خطط وحدات دراسية", mode: "interactive", price: 0, roles: ["teacher"], comingSoon: true },
      { id: "10-4", slug: "daily-lesson-builder", title: "إعداد الدروس اليومية", description: "تحضير دروس يومية بالذكاء الاصطناعي", mode: "interactive", price: 0, roles: ["teacher"], comingSoon: true },
      { id: "10-5", slug: "lesson-plans-pack", title: "حزمة تحاضير جاهزة", description: "تحاضير جاهزة لجميع المواد والمراحل", mode: "store", price: 35, format: ["pdf", "word"], roles: ["teacher"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 11: المتجر الرقمي (المنتجات الجاهزة المجمّعة)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "11",
    slug: "digital-store",
    title: "المتجر الرقمي",
    description: "متجر إلكتروني شامل للمنتجات الرقمية التعليمية: قوالب، ملفات، واستراتيجيات جاهزة للتحميل",
    icon: "ShoppingBag",
    color: "#BE185D",
    hasInteractive: false,
    hasStore: true,
    route: "/store",
    services: [
      // الفاقد التعليمي
      { id: "11-1", slug: "learning-loss-plans", title: "خطط الفاقد التعليمي", description: "خطط معالجة الفاقد التعليمي لجميع المراحل", mode: "store", price: 25, format: ["pdf", "word"], roles: ["teacher", "special-ed"], category: "الفاقد التعليمي" },
      // الإنتاج المعرفي
      { id: "11-2", slug: "knowledge-production-templates", title: "نماذج الإنتاج المعرفي", description: "نماذج توثيق الإنتاج المعرفي للمعلمين", mode: "store", price: 19, format: ["pdf", "word"], roles: ["teacher"], category: "الإنتاج المعرفي" },
      // المبادرات
      { id: "11-3", slug: "school-initiatives", title: "مبادرات مدرسية جاهزة", description: "مبادرات مدرسية جاهزة للتطبيق مع نماذج التوثيق", mode: "store", price: 19, format: ["pdf", "word"], roles: ["teacher", "admin", "activity"], category: "المبادرات" },
      { id: "11-4", slug: "community-partnership", title: "نماذج الشراكة المجتمعية", description: "نماذج توثيق الشراكة المجتمعية", mode: "store", price: 15, format: ["pdf", "word"], roles: ["admin", "activity"], category: "المبادرات" },
      // ورش العمل والبرامج التدريبية
      { id: "11-5", slug: "training-kits", title: "حقائب تدريبية مهنية", description: "حقائب تدريبية مهنية جاهزة", mode: "store", price: 39, format: ["pdf", "pptx"], roles: ["teacher", "admin"], category: "ورش العمل والتدريب" },
      { id: "11-6", slug: "training-plans-templates", title: "نماذج خطط تدريبية", description: "نماذج خطط وتقييم برامج تدريبية", mode: "store", price: 15, format: ["pdf", "word"], roles: ["teacher", "admin"], category: "ورش العمل والتدريب" },
      // الدروس التطبيقية
      { id: "11-7", slug: "applied-lessons", title: "نماذج دروس تطبيقية", description: "نماذج توثيق الدروس التطبيقية والمصغرة", mode: "store", price: 15, format: ["pdf", "word"], roles: ["teacher"], category: "الدروس التطبيقية" },
      // البحوث الإجرائية
      { id: "11-8", slug: "action-research-templates", title: "نماذج بحوث إجرائية", description: "نماذج بحوث إجرائية وبحث الدرس جاهزة", mode: "store", price: 19, format: ["pdf", "word"], roles: ["teacher"], category: "البحوث الإجرائية" },
      // السجلات المدرسية
      { id: "11-9", slug: "admin-records-pack", title: "حزمة السجلات الإدارية", description: "جميع السجلات الإدارية المطلوبة في المدارس", mode: "store", price: 35, format: ["pdf", "word"], roles: ["admin"], category: "السجلات المدرسية" },
      { id: "11-10", slug: "teacher-records-pack", title: "حزمة سجلات المعلم", description: "سجلات المتابعة والحضور والدرجات للمعلمين", mode: "store", price: 25, format: ["pdf", "word"], roles: ["teacher"], category: "السجلات المدرسية" },
      { id: "11-11", slug: "counselor-records-pack", title: "حزمة سجلات التوجيه", description: "سجلات التوجيه الطلابي والصحي والسلوكي", mode: "store", price: 25, format: ["pdf", "word"], roles: ["counselor"], category: "السجلات المدرسية" },
      { id: "11-12", slug: "activity-records-pack", title: "حزمة سجلات النشاط", description: "سجلات النشاط الطلابي واللاصفي", mode: "store", price: 19, format: ["pdf", "word"], roles: ["activity"], category: "السجلات المدرسية" },
      // الكشوفات والبيانات
      { id: "11-13", slug: "data-sheets-pack", title: "حزمة الكشوفات والبيانات", description: "كشوفات الطلاب والمعلمين والجداول المدرسية", mode: "store", price: 19, format: ["pdf", "word"], roles: ["teacher", "admin"], category: "الكشوفات والبيانات" },
      // الاستراتيجيات والوسائل
      { id: "11-14", slug: "teaching-strategies-pack", title: "حزمة استراتيجيات تعليمية", description: "استراتيجيات تدريس وإدارة صفية جاهزة", mode: "store", price: 25, format: ["pdf", "pptx"], roles: ["teacher"], category: "الاستراتيجيات والوسائل" },
      { id: "11-15", slug: "teaching-aids-pack", title: "وسائل تعليمية جاهزة", description: "وسائل تعليمية وبرامج تقنية جاهزة", mode: "store", price: 19, format: ["pdf", "pptx"], roles: ["teacher"], category: "الاستراتيجيات والوسائل" },
      // الخطابات والمراسلات
      { id: "11-16", slug: "letters-pack", title: "حزمة الخطابات الرسمية", description: "نماذج خطابات رسمية ومراسلات إدارية", mode: "store", price: 15, format: ["pdf", "word"], roles: ["admin"], category: "الخطابات والمراسلات" },
      // الأيام العالمية
      { id: "11-17", slug: "international-days-pack", title: "حزمة الأيام العالمية", description: "نماذج توثيق الأيام العالمية والمناسبات", mode: "store", price: 15, format: ["pdf"], roles: ["teacher", "activity"], category: "المناسبات والأيام العالمية" },
      // أغلفة وفواصل
      { id: "11-18", slug: "covers-dividers-pack", title: "أغلفة وفواصل احترافية", description: "أغلفة وفواصل لجميع المواد الدراسية بتصاميم متعددة", mode: "store", price: 15, format: ["pdf"], roles: ["teacher"], category: "أغلفة وفواصل" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 12: الأدوات والخدمات الإلكترونية (محسّن)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "12",
    slug: "digital-tools",
    title: "الأدوات والخدمات الإلكترونية",
    description: "أدوات مساعدة إلكترونية ذكية للمعلمين والإداريين مع دعم الذكاء الاصطناعي",
    icon: "Wrench",
    color: "#475569",
    hasInteractive: true,
    hasStore: false,
    route: "/section/12",
    services: [
      { id: "12-1", slug: "ai-assistant", title: "المساعد الذكي بالذكاء الاصطناعي", description: "مساعد ذكي لكتابة التقارير والمحتوى التربوي", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-2", slug: "file-to-qr", title: "تحويل الملف إلى باركود QR", description: "تحويل أي ملف إلى باركود QR", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-3", slug: "create-qr", title: "إنشاء كود QR", description: "إنشاء كود QR لأي رابط", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-4", slug: "contact-qr-card", title: "بطاقة التواصل QR", description: "إنشاء بطاقة تواصل بكود QR", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-5", slug: "pdf-signature", title: "توقيع ملفات PDF", description: "توقيع ملفات PDF أونلاين", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-6", slug: "noor-reports-export", title: "تصدير تقارير نظام نور", description: "تصدير تقارير نظام نور", mode: "interactive", price: 0, roles: ["teacher", "admin"] },
      { id: "12-7", slug: "weighted-percentage-calc", title: "حاسبة النسبة الموزونة", description: "حاسبة النسبة الموزونة", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-8", slug: "retirement-calc", title: "حاسبة التقاعد", description: "حاسبة التقاعد للمعلمين", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-9", slug: "image-compress-convert", title: "ضغط وتحويل الصور", description: "ضغط وتحويل تنسيق الصور", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-10", slug: "url-shortener", title: "اختصار الروابط", description: "اختصار الروابط الطويلة", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-11", slug: "academic-calendar", title: "التقويم الدراسي", description: "التقويم الدراسي الرسمي", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-12", slug: "learning-styles-survey", title: "استبيان أنماط التعلم", description: "استبيان أنماط التعلم للأطفال والكبار مع تصنيف", mode: "interactive", price: 0, roles: ["teacher", "counselor"] },
      { id: "12-13", slug: "surveys-polls", title: "الاستبانات", description: "إنشاء استبانات تعليمية", mode: "interactive", price: 0, roles: ["all"] },
      { id: "12-14", slug: "wall-posters", title: "جداريات مدرسية", description: "تصميم جداريات مدرسية", mode: "interactive", price: 0, roles: ["teacher", "activity"] },
      { id: "12-15", slug: "cover-builder", title: "صانع الأغلفة والفواصل", description: "أداة تفاعلية لإنشاء أغلفة وفواصل احترافية", mode: "interactive", price: 0, roles: ["teacher"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // القسم 13: أغلفة وفواصل (موجود - يبقى كأداة تفاعلية)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "13",
    slug: "covers-dividers",
    title: "أغلفة وفواصل",
    description: "أداة تفاعلية لإنشاء أغلفة وفواصل احترافية لجميع المواد الدراسية بتصاميم وألوان متعددة",
    icon: "BookOpen",
    color: "#6366F1",
    hasInteractive: true,
    hasStore: true,
    route: "/covers",
    services: [
      { id: "13-1", slug: "cover-maker", title: "صانع الأغلفة التفاعلي", description: "أداة تفاعلية لإنشاء أغلفة بتصاميم وألوان متعددة", mode: "interactive", price: 0, roles: ["teacher"] },
      { id: "13-2", slug: "covers-pack", title: "حزمة أغلفة جاهزة", description: "أغلفة جاهزة لجميع المواد بتصاميم احترافية", mode: "store", price: 15, format: ["pdf"], roles: ["teacher"] },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════════

export function getAllServices(): Service[] {
  return sections.flatMap((s) => s.services);
}

export function getTotalServicesCount(): number {
  return sections.reduce((acc, s) => acc + s.services.length, 0);
}

export function getInteractiveCount(): number {
  return getAllServices().filter((s) => s.mode === "interactive" || s.mode === "both").length;
}

export function getStoreCount(): number {
  return getAllServices().filter((s) => s.mode === "store" || s.mode === "both").length;
}

export function getPaidCount(): number {
  return getAllServices().filter((s) => s.price > 0).length;
}

export function getFreeCount(): number {
  return getAllServices().filter((s) => s.price === 0).length;
}

export function getServicesByRole(role: UserRole): { section: Section; service: Service }[] {
  if (role === "all") {
    return sections.flatMap((s) => s.services.map((svc) => ({ section: s, service: svc })));
  }
  const results: { section: Section; service: Service }[] = [];
  for (const section of sections) {
    for (const service of section.services) {
      if (!service.roles || service.roles.includes("all") || service.roles.includes(role)) {
        results.push({ section, service });
      }
    }
  }
  return results;
}

export function getSectionsByRole(role: UserRole): Section[] {
  if (role === "all") return sections;
  return sections.filter((section) =>
    section.services.some(
      (svc) => !svc.roles || svc.roles.includes("all") || svc.roles.includes(role)
    )
  );
}

export function getStoreCategories(): string[] {
  const storeSection = sections.find((s) => s.id === "11");
  if (!storeSection) return [];
  const cats = new Set<string>();
  storeSection.services.forEach((svc) => {
    if (svc.category) cats.add(svc.category);
  });
  return Array.from(cats);
}

export function searchServices(query: string): { section: Section; service: Service }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: { section: Section; service: Service }[] = [];
  for (const section of sections) {
    for (const service of section.services) {
      if (
        service.title.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q) ||
        section.title.toLowerCase().includes(q) ||
        (service.category && service.category.toLowerCase().includes(q)) ||
        (service.tags && service.tags.some((t) => t.toLowerCase().includes(q)))
      ) {
        results.push({ section, service });
      }
    }
  }
  return results;
}
