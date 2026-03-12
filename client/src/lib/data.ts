// SERS - Smart Educational Records System
// بيانات الأقسام والخدمات النهائية المعدّلة v3

export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: "interactive" | "downloadable" | "both";
  price: number;
  category?: string;
  tags?: string[];
}

export interface Section {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  services: Service[];
}

export const sections: Section[] = [
  {
    id: "1",
    slug: "performance-evidence",
    title: "شواهد الأداء الوظيفي",
    description: "توثيق شواهد الأداء الوظيفي لجميع شاغلي الوظائف التعليمية وفق معايير وزارة التعليم",
    icon: "Award",
    color: "#059669",
    services: [
      { id: "1-1", slug: "teacher-performance-evidence", title: "شواهد الأداء الوظيفي للمعلم/ة", description: "توثيق شواهد الأداء الوظيفي للمعلم والمعلمة وفق معايير وزارة التعليم مع دعم الباركودات التفاعلية", type: "interactive", price: 0, category: "معلم", tags: ["أداء وظيفي", "معلم", "شواهد"] },
      { id: "1-2", slug: "principal-performance-evidence", title: "شواهد الأداء الوظيفي لمدير/ة المدرسة", description: "توثيق شواهد الأداء الوظيفي لمدير ومديرة المدرسة", type: "interactive", price: 0, category: "إداري" },
      { id: "1-3", slug: "vice-principal-performance-evidence", title: "شواهد الأداء الوظيفي لوكيل/ة المدرسة", description: "توثيق شواهد الأداء الوظيفي لوكيل ووكيلة المدرسة", type: "interactive", price: 0, category: "إداري" },
      { id: "1-4", slug: "counselor-performance-evidence", title: "شواهد الأداء الوظيفي للموجه/ة الطلابي/ة", description: "توثيق شواهد الأداء الوظيفي للموجه والموجهة الطلابية", type: "interactive", price: 0, category: "إداري" },
      { id: "1-5", slug: "health-counselor-performance-evidence", title: "شواهد الأداء الوظيفي للموجه/ة الصحي/ة", description: "توثيق شواهد الأداء الوظيفي للموجه والموجهة الصحية", type: "interactive", price: 0, category: "إداري" },
      { id: "1-6", slug: "supervisor-performance-evidence", title: "شواهد الأداء الوظيفي للمشرف/ة التربوي/ة", description: "توثيق شواهد الأداء الوظيفي للمشرف والمشرفة التربوية", type: "interactive", price: 0, category: "إداري" },
      { id: "1-7", slug: "librarian-performance-evidence", title: "شواهد الأداء الوظيفي لأمين/ة المصادر", description: "توثيق شواهد الأداء الوظيفي لأمين وأمينة مصادر التعلم", type: "interactive", price: 0, category: "إداري" },
      { id: "1-8", slug: "kindergarten-performance-evidence", title: "شواهد الأداء الوظيفي لمعلمة رياض الأطفال", description: "توثيق شواهد الأداء الوظيفي لمعلمة رياض الأطفال", type: "interactive", price: 0, category: "رياض أطفال" },
      { id: "1-9", slug: "special-ed-performance-evidence", title: "شواهد الأداء الوظيفي لمعلم/ة التربية الخاصة", description: "توثيق شواهد الأداء الوظيفي لمعلم ومعلمة التربية الخاصة", type: "interactive", price: 0, category: "تربية خاصة" },
      { id: "1-10", slug: "admin-assistant-performance-evidence", title: "شواهد الأداء الوظيفي للمساعد/ة الإداري/ة", description: "توثيق شواهد الأداء الوظيفي للمساعد والمساعدة الإدارية", type: "interactive", price: 0, category: "إداري" },
      { id: "1-11", slug: "activity-leader-performance-evidence", title: "شواهد الأداء الوظيفي لرائد/ة النشاط", description: "توثيق شواهد الأداء الوظيفي للمعلم المسند له نشاط طلابي (رائد/ة النشاط) وفق المعايير الرسمية", type: "interactive", price: 0, category: "معلم", tags: ["رائد نشاط", "نشاط طلابي"] },
      { id: "1-12", slug: "lab-technician-performance-evidence", title: "شواهد الأداء الوظيفي لمحضر/ة المختبر", description: "توثيق شواهد الأداء الوظيفي لمحضر ومحضرة المختبر وفق المعايير الرسمية", type: "interactive", price: 0, category: "إداري", tags: ["محضر مختبر", "مختبر"] },
      { id: "1-13", slug: "classroom-evaluation-visit", title: "زيارة التقييم الصفيّة", description: "نموذج زيارة التقييم الصفية للمعلم وفق معايير التقييم المعتمدة", type: "interactive", price: 0, category: "معلم" },
    ],
  },
  {
    id: "2",
    slug: "achievement-portfolios",
    title: "ملفات الإنجاز",
    description: "ملفات إنجاز إلكترونية ذكية شاملة لتوثيق الأعمال والإنجازات المهنية بالباركودات التفاعلية",
    icon: "FolderOpen",
    color: "#7C3AED",
    services: [
      { id: "2-1", slug: "smart-portfolio-general", title: "حقيبة ملف الإنجاز الذكي - عام لجميع التخصصات", description: "شامل ملف الأداء الوظيفي مع إنشاء الباركودات التفاعلية و 39 ملف متنوع", type: "both", price: 49 },
      { id: "2-2", slug: "smart-portfolio-kindergarten", title: "حقيبة ملف الإنجاز الذكي - رياض الأطفال", description: "ملف إنجاز ذكي مخصص لمعلمات رياض الأطفال بتصاميم مميزة", type: "both", price: 49, category: "رياض أطفال" },
      { id: "2-3", slug: "smart-portfolio-special-ed", title: "حقيبة ملف الإنجاز الذكي - تربية خاصة", description: "شامل ملف الأداء الوظيفي مع إنشاء الباركودات التفاعلية و39 ملف", type: "both", price: 49, category: "تربية خاصة" },
      { id: "2-4", slug: "smart-portfolio-principal", title: "ملف الإنجاز الذكي - مدير/ة المدرسة", description: "شامل ملف الأداء الوظيفي مع إنشاء الباركودات التفاعلية", type: "both", price: 49, category: "إداري" },
      { id: "2-5", slug: "smart-portfolio-admin-assistant", title: "ملف الإنجاز الذكي للمساعد الإداري", description: "بالباركودات التفاعلية قابل للطباعة بالهوية الرسمية للوزارة", type: "both", price: 49, category: "إداري" },
      { id: "2-6", slug: "smart-portfolio-teacher", title: "ملف الإنجاز الذكي للمعلم/ة", description: "ملف إنجاز ذكي شامل للمعلم والمعلمة مع باركودات تفاعلية", type: "both", price: 49, category: "معلم" },
      { id: "2-7", slug: "smart-portfolio-counselor", title: "ملف الإنجاز الذكي للموجه/ة الطلابي/ة", description: "ملف إنجاز ذكي مخصص للموجه والموجهة الطلابية", type: "both", price: 49, category: "إداري" },
      { id: "2-8", slug: "create-evidence-file", title: "إنشاء ملف الشواهد", description: "أداة تفاعلية لإنشاء ملف شواهد الأداء الوظيفي من الصفر", type: "interactive", price: 0 },
    ],
  },
  {
    id: "3",
    slug: "documentation-templates",
    title: "نماذج وتقارير التوثيق",
    description: "نماذج احترافية لتوثيق البرامج والأنشطة والمبادرات بتصاميم متعددة مع أغلفة وفواصل وفهارس",
    icon: "FileText",
    color: "#0284C7",
    services: [
      { id: "3-1", slug: "program-documentation-template", title: "أفضل نموذج لتوثيق برنامج أو نشاط (المطور)", description: "نموذج شامل لتوثيق البرامج والأنشطة بشكل احترافي", type: "interactive", price: 0 },
      { id: "3-2", slug: "strategy-execution-template", title: "نموذج تنفيذ استراتيجية مختصرة", description: "نموذج مختصر لتوثيق تنفيذ الاستراتيجيات التعليمية", type: "interactive", price: 0 },
      { id: "3-3", slug: "program-coverage-report", title: "تقرير تنفيذ برنامج (تغطية)", description: "تقرير تغطية شامل لتنفيذ البرامج التعليمية", type: "interactive", price: 0 },
      { id: "3-4", slug: "program-coverage-2-evidence", title: "تقرير تنفيذ برنامج (تغطية) شاهدين", description: "تقرير تغطية مع شاهدين مرفقين", type: "interactive", price: 0 },
      { id: "3-5", slug: "program-coverage-4-evidence", title: "تقرير تنفيذ برنامج (تغطية) 4 شواهد", description: "تقرير تغطية مع 4 شواهد مرفقة", type: "interactive", price: 0 },
      { id: "3-6", slug: "additional-evidence-appendix", title: "ملحق شواهد إضافية", description: "ملحق شواهد إضافية لأي تقرير", type: "interactive", price: 0 },
      { id: "3-7", slug: "report-cover", title: "غلاف لأي تقرير أو ملف", description: "غلاف احترافي قابل للتخصيص لأي تقرير", type: "interactive", price: 0 },
      { id: "3-8", slug: "report-cover-landscape", title: "غلاف أفقي لأي تقرير أو ملف", description: "غلاف بالعرض (أفقي) لأي تقرير أو ملف", type: "interactive", price: 0 },
      { id: "3-9", slug: "internal-sub-cover", title: "غلاف فرعي داخلي", description: "غلاف فرعي داخلي لأي تقرير أو ملف", type: "interactive", price: 0 },
      { id: "3-10", slug: "interactive-index", title: "فهرس تفاعلي", description: "فهرس تفاعلي لأي تقرير أو ملف", type: "interactive", price: 0 },
      { id: "3-11", slug: "report-dividers", title: "فواصل لأي تقرير أو ملف", description: "فواصل احترافية لتنظيم التقارير والملفات", type: "interactive", price: 0 },
      { id: "3-12", slug: "general-template", title: "النموذج العام", description: "نموذج عام قابل للتخصيص لأي غرض", type: "interactive", price: 0 },
      { id: "3-13", slug: "daily-weekly-achievement-report", title: "تقرير الإنجاز اليومي أو الأسبوعي", description: "تقرير إنجاز يومي أو أسبوعي للمعلم", type: "interactive", price: 0 },
      { id: "3-14", slug: "post-documentation", title: "توثيق منشور", description: "نموذج توثيق منشور تعليمي", type: "interactive", price: 0 },
      { id: "3-15", slug: "record-cover", title: "غلاف السجل", description: "غلاف احترافي للسجلات المدرسية", type: "interactive", price: 0 },
    ],
  },
  {
    id: "4",
    slug: "educational-reports",
    title: "التقارير التعليمية",
    description: "تقارير شاملة لتوثيق البرامج والأنشطة والإنجازات التعليمية وتوظيف التقنية",
    icon: "BarChart3",
    color: "#EA580C",
    services: [
      { id: "4-1", slug: "daily-report", title: "التقرير اليومي", description: "تقرير يومي شامل للمعلم", type: "interactive", price: 0 },
      { id: "4-2", slug: "weekly-report", title: "التقرير الأسبوعي", description: "تقرير أسبوعي شامل للمعلم", type: "interactive", price: 0 },
      { id: "4-3", slug: "monthly-report", title: "التقرير الشهري", description: "تقرير شهري شامل للمعلم", type: "interactive", price: 0 },
      { id: "4-4", slug: "applied-lesson-report", title: "تقرير تنفيذ درس تطبيقي", description: "تقرير توثيق تنفيذ درس تطبيقي", type: "interactive", price: 0 },
      { id: "4-5", slug: "student-honor-report", title: "تقرير برنامج تكريم وتعزيز الطلاب", description: "تقرير توثيق برنامج تكريم الطلاب", type: "interactive", price: 0 },
      { id: "4-6", slug: "ms-forms-report", title: "تقرير توظيف Microsoft Forms", description: "تقرير توظيف برنامج Microsoft Forms في العملية التعليمية", type: "interactive", price: 0 },
      { id: "4-7", slug: "google-classroom-report", title: "تقرير توظيف Google Classroom", description: "تقرير توظيف برنامج Google Classroom في العملية التعليمية", type: "interactive", price: 0 },
      { id: "4-8", slug: "classdojo-report", title: "تقرير توظيف ClassDojo", description: "تقرير توظيف برنامج ClassDojo في العملية التعليمية", type: "interactive", price: 0 },
      { id: "4-9", slug: "padlet-report", title: "تقرير توظيف Padlet", description: "تقرير توظيف برنامج Padlet في العملية التعليمية", type: "interactive", price: 0 },
      { id: "4-10", slug: "canva-education-report", title: "تقرير توظيف Canva for Education", description: "تقرير توظيف برنامج Canva for Education", type: "interactive", price: 0 },
      { id: "4-11", slug: "quizizz-report", title: "تقرير توظيف Quizizz", description: "تقرير توظيف برنامج Quizizz في العملية التعليمية", type: "interactive", price: 0 },
      { id: "4-12", slug: "projector-usage-report", title: "تقرير استخدام أجهزة العرض الضوئي", description: "تقرير استخدام أجهزة العرض الضوئي (Projector)", type: "interactive", price: 0 },
      { id: "4-13", slug: "community-participation-report", title: "تقرير مشاركة مجتمعية", description: "تقرير توثيق المشاركات المجتمعية", type: "interactive", price: 0 },
      { id: "4-14", slug: "events-participation-report", title: "تقرير المشاركة في تنفيذ فعاليات", description: "تقرير توثيق المشاركة في الفعاليات", type: "interactive", price: 0 },
      { id: "4-15", slug: "end-of-year-report", title: "تقرير نهاية العام الدراسي", description: "تقرير شامل لنهاية العام الدراسي", type: "interactive", price: 0 },
      { id: "4-16", slug: "behavior-attendance-report", title: "تقرير السلوك والمواظبة", description: "تقرير متابعة السلوك والمواظبة", type: "interactive", price: 0 },
      { id: "4-17", slug: "parent-communication-report", title: "تقرير التواصل مع أولياء الأمور", description: "تقرير التواصل مع أولياء الأمور عبر منصة مدرستي", type: "interactive", price: 0 },
      { id: "4-18", slug: "first-parent-meeting-report", title: "تقرير الاجتماع الأول لأولياء الأمور", description: "تقرير توثيق الاجتماع الأول لأولياء الأمور", type: "interactive", price: 0 },
      { id: "4-19", slug: "strategy-application-report", title: "نموذج تقرير تطبيق استراتيجية تدريس", description: "تقرير توثيق تطبيق استراتيجية تدريس", type: "interactive", price: 0 },
    ],
  },
  {
    id: "5",
    slug: "results-analysis",
    title: "تحليل النتائج والدرجات",
    description: "أدوات تحليل نتائج الطلاب وتشخيص المستويات مع رسوم بيانية تفاعلية وتقارير إحصائية",
    icon: "TrendingUp",
    color: "#DC2626",
    services: [
      { id: "5-1", slug: "single-subject-analysis", title: "تحليل نتائج مادة لصف واحد", description: "تحليل شامل لنتائج مادة واحدة لصف واحد مع رسوم بيانية", type: "interactive", price: 0 },
      { id: "5-2", slug: "period-comparison-analysis", title: "تحليل نتائج مقارنة الفترات", description: "مقارنة نتائج الطلاب بين الفترات الدراسية المختلفة", type: "interactive", price: 0 },
      { id: "5-3", slug: "grades-analysis-with-logo", title: "تحليل درجات مع شعار المدرسة", description: "تحليل درجات مع إمكانية رفع شعار المدرسة والوزارة", type: "interactive", price: 0 },
      { id: "5-4", slug: "student-data-analysis", title: "تحليل بيانات الطلاب", description: "تحليل شامل لبيانات الطلاب وتصنيفهم", type: "interactive", price: 0 },
      { id: "5-5", slug: "achievement-classification", title: "تقرير تصنيف الطلاب حسب التحصيل", description: "تصنيف الطلاب حسب مستوى التحصيل الدراسي", type: "interactive", price: 0 },
      { id: "5-6", slug: "learning-styles-classification", title: "تقرير تصنيف الطلاب حسب أنماط التعلم", description: "تصنيف الطلاب حسب أنماط التعلم المختلفة", type: "interactive", price: 0 },
      { id: "5-7", slug: "top-low-students-report", title: "تقرير المتفوقين والمتأخرين دراسياً", description: "تقرير تفصيلي للطلاب المتفوقين والمتأخرين", type: "interactive", price: 0 },
      { id: "5-8", slug: "auto-correction", title: "التصحيح الآلي", description: "نظام تصحيح آلي للاختبارات", type: "interactive", price: 0 },
    ],
  },
  {
    id: "6",
    slug: "remedial-enrichment-plans",
    title: "الخطط العلاجية والإثرائية",
    description: "خطط علاجية وإثرائية شاملة لجميع المراحل والمواد الدراسية مع متابعة التقدم",
    icon: "HeartPulse",
    color: "#DB2777",
    services: [
      { id: "6-1", slug: "individual-remedial-plan", title: "خطة علاجية فردية", description: "خطة علاجية للطلاب والطالبات بشكل فردي", type: "interactive", price: 0 },
      { id: "6-2", slug: "group-remedial-plan", title: "خطة علاجية جماعية", description: "خطة علاجية جماعية لأكثر من طالب", type: "interactive", price: 0 },
      { id: "6-3", slug: "individual-enrichment-plan", title: "خطة إثرائية فردية", description: "خطة إثرائية للطلاب والطالبات بشكل فردي", type: "interactive", price: 0 },
      { id: "6-4", slug: "group-enrichment-plan", title: "خطة إثرائية جماعية", description: "خطة إثرائية جماعية لأكثر من طالب", type: "interactive", price: 0 },
      { id: "6-5", slug: "iep-plan", title: "الخطة التعليمية الفردية (IEP)", description: "خطة تعليمية فردية لذوي الاحتياجات الخاصة", type: "interactive", price: 0, category: "تربية خاصة" },
      { id: "6-6", slug: "learning-loss-plan", title: "خطة الفاقد التعليمي", description: "خطة معالجة الفاقد التعليمي للطلاب", type: "interactive", price: 0 },
      { id: "6-7", slug: "positive-behavior-plan", title: "خطة دعم السلوك الإيجابي", description: "خطة دعم السلوك الإيجابي لدى الطلاب", type: "interactive", price: 0 },
    ],
  },
  {
    id: "7",
    slug: "planning-preparation",
    title: "الخطط والتحضير",
    description: "أدوات تحضير الدروس والتخطيط التعليمي وتوزيع المناهج والخطط الأسبوعية",
    icon: "CalendarDays",
    color: "#2563EB",
    services: [
      { id: "7-1", slug: "single-subject-weekly-plan", title: "خطة أسبوعية لمادة واحدة", description: "خطة أسبوعية تفصيلية لمادة واحدة", type: "interactive", price: 0 },
      { id: "7-2", slug: "multi-subject-weekly-plan", title: "خطة أسبوعية لأكثر من مادة", description: "خطة أسبوعية شاملة لعدة مواد", type: "interactive", price: 0 },
      { id: "7-3", slug: "daily-lesson-plan", title: "نموذج تحضير درس يومي", description: "نموذج تحضير درس يومي تفصيلي", type: "interactive", price: 0 },
      { id: "7-4", slug: "unit-plan", title: "نموذج تحضير وحدة دراسية", description: "نموذج تحضير وحدة دراسية كاملة", type: "interactive", price: 0 },
      { id: "7-5", slug: "curriculum-distribution", title: "نموذج توزيع المنهج الدراسي", description: "توزيع المنهج على الأسابيع الدراسية", type: "interactive", price: 0 },
      { id: "7-6", slug: "daily-achievement-log", title: "نموذج سجل الإنجاز اليومي", description: "سجل الإنجاز اليومي للمعلم", type: "interactive", price: 0 },
      { id: "7-7", slug: "content-analysis", title: "نموذج تحليل المحتوى الدراسي", description: "تحليل المحتوى الدراسي للمادة", type: "interactive", price: 0 },
      { id: "7-8", slug: "learning-outcomes-map", title: "خريطة نواتج التعلّم", description: "خريطة نواتج التعلم للمادة الدراسية", type: "interactive", price: 0 },
    ],
  },
  {
    id: "8",
    slug: "tests-assessment",
    title: "الاختبارات والتقويم",
    description: "أدوات إعداد الاختبارات والتقويم المستمر وتحليل النتائج واختبارات نافس الوطنية",
    icon: "ClipboardCheck",
    color: "#9333EA",
    services: [
      { id: "8-1", slug: "create-test", title: "إنشاء اختبار", description: "أداة إنشاء اختبارات تفاعلية", type: "interactive", price: 0 },
      { id: "8-2", slug: "period-test-template", title: "نموذج اختبار فترة", description: "نموذج اختبار فترة جاهز للتعبئة", type: "interactive", price: 0 },
      { id: "8-3", slug: "final-test-template", title: "نموذج اختبار نهائي", description: "نموذج اختبار نهائي جاهز للتعبئة", type: "interactive", price: 0 },
      { id: "8-4", slug: "test-specifications-table", title: "جدول مواصفات اختبار", description: "نموذج جدول مواصفات اختبار", type: "interactive", price: 0 },
      { id: "8-5", slug: "test-analysis", title: "نموذج تحليل اختبار", description: "تحليل شامل لنتائج الاختبار", type: "interactive", price: 0 },
      { id: "8-6", slug: "grades-entry", title: "نموذج رصد درجات", description: "نموذج رصد درجات الطلاب", type: "interactive", price: 0 },
      { id: "8-7", slug: "continuous-assessment", title: "كشف متابعة التقويم المستمر", description: "كشف متابعة التقويم المستمر للطلاب", type: "interactive", price: 0 },
      { id: "8-8", slug: "exam-schedule", title: "جدول الاختبارات", description: "جدول اختبارات المدرسة", type: "interactive", price: 0 },
      { id: "8-9", slug: "exam-committees-boards", title: "لوحات لجان الاختبارات", description: "لوحات لجان الاختبارات - رقمي أو اسمي", type: "interactive", price: 0 },
      { id: "8-10", slug: "nafs-arabic", title: "نافس - اللغة العربية", description: "ملف الاختبارات الوطنية نافس مادة اللغة العربية", type: "both", price: 29 },
      { id: "8-11", slug: "nafs-math", title: "نافس - الرياضيات", description: "ملف الاختبارات الوطنية نافس مادة الرياضيات", type: "both", price: 29 },
      { id: "8-12", slug: "nafs-science", title: "نافس - العلوم", description: "ملف الاختبارات الوطنية نافس مادة العلوم", type: "both", price: 29 },
      { id: "8-13", slug: "nafs-practice", title: "التدرب على اختبارات نافس", description: "نماذج تدريبية لاختبارات نافس الوطنية", type: "interactive", price: 0 },
    ],
  },
  {
    id: "9",
    slug: "appreciation-certificates",
    title: "شهادات الشكر والتقدير",
    description: "شهادات شكر وتقدير بتصاميم احترافية متعددة قابلة للتخصيص مع دعم الباركودات",
    icon: "Medal",
    color: "#CA8A04",
    services: [
      { id: "9-1", slug: "male-students-teachers-cert", title: "شهادة شكر وتقدير للطلاب والمعلمين", description: "شهادة شكر وتقدير مخصصة للطلاب والمعلمين", type: "interactive", price: 0 },
      { id: "9-2", slug: "female-students-teachers-cert", title: "شهادة شكر وتقدير للطالبات والمعلمات", description: "شهادة شكر وتقدير مخصصة للطالبات والمعلمات", type: "interactive", price: 0 },
      { id: "9-3", slug: "all-students-cert", title: "شهادة شكر وتقدير للطلاب والطالبات", description: "شهادة شكر وتقدير عامة", type: "interactive", price: 0 },
      { id: "9-4", slug: "subject-specific-cert", title: "شهادة شكر وتقدير لمادة محددة", description: "شهادة شكر وتقدير للتفوق في مادة محددة", type: "interactive", price: 0 },
      { id: "9-5", slug: "nafs-students-cert", title: "شهادات شكر نافس للطلاب", description: "شهادات شكر وتقدير نافس للطلاب والطالبات", type: "interactive", price: 0 },
      { id: "9-6", slug: "nafs-parents-cert", title: "شهادات شكر نافس لأسر الطلاب", description: "شهادات شكر وتقدير نافس لأسر الطلاب", type: "interactive", price: 0 },
      { id: "9-7", slug: "national-day-cert", title: "شهادات اليوم الوطني", description: "شهادات شكر وتقدير اليوم الوطني", type: "interactive", price: 0 },
      { id: "9-8", slug: "teacher-day-cert", title: "شهادات يوم المعلم", description: "شهادات شكر وتقدير يوم المعلم", type: "interactive", price: 0 },
      { id: "9-9", slug: "foundation-day-cert", title: "شهادات يوم التأسيس", description: "شهادات شكر وتقدير يوم التأسيس", type: "interactive", price: 0 },
      { id: "9-10", slug: "arabic-language-day-cert", title: "شهادات اليوم العالمي للغة العربية", description: "شهادات شكر وتقدير اليوم العالمي للغة العربية", type: "interactive", price: 0 },
      { id: "9-11", slug: "official-editable-cert", title: "شهادة شكر رسمية قابلة للتعديل", description: "شهادة شكر رسمية قابلة للتعديل الكامل", type: "interactive", price: 0 },
      { id: "9-12", slug: "honor-board", title: "لوحة شرف الطلاب", description: "لوحة شرف الطلاب المتفوقين", type: "interactive", price: 0 },
      { id: "9-13", slug: "barcode-cert", title: "شهادة شكر مع باركود", description: "شهادة شكر وتقدير مع باركود QR تفاعلي", type: "interactive", price: 0 },
    ],
  },
  {
    id: "10",
    slug: "various-certificates",
    title: "الشهادات المتنوعة",
    description: "شهادات تخرج ونجاح وحضور ومشاركة وتطوع بتصاميم احترافية متعددة",
    icon: "GraduationCap",
    color: "#0891B2",
    services: [
      { id: "10-1", slug: "graduation-cert-general", title: "شهادة تخرج للطلاب والطالبات", description: "شهادة تخرج عامة", type: "interactive", price: 0 },
      { id: "10-2", slug: "graduation-cert-elementary", title: "شهادة تخرج لطلاب الابتدائي", description: "شهادة تخرج مخصصة للمرحلة الابتدائية", type: "interactive", price: 0 },
      { id: "10-3", slug: "success-cert-general", title: "شهادة نجاح للطلاب والطالبات", description: "شهادة نجاح عامة", type: "interactive", price: 0 },
      { id: "10-4", slug: "success-cert-elementary", title: "شهادة نجاح لطلاب الابتدائي", description: "شهادة نجاح مخصصة للمرحلة الابتدائية", type: "interactive", price: 0 },
      { id: "10-5", slug: "course-cert-male", title: "شهادة حضور دورة للمعلمين", description: "شهادة حضور دورة تدريبية للمعلمين", type: "interactive", price: 0 },
      { id: "10-6", slug: "course-cert-female", title: "شهادة حضور دورة للمعلمات", description: "شهادة حضور دورة تدريبية للمعلمات", type: "interactive", price: 0 },
      { id: "10-7", slug: "training-execution-cert", title: "شهادة تنفيذ تدريب أو دورة", description: "شهادة تنفيذ تدريب أو دورة", type: "interactive", price: 0 },
      { id: "10-8", slug: "workshop-participation-cert", title: "شهادة مشاركة في ورشة عمل", description: "شهادة مشاركة في ورشة عمل", type: "interactive", price: 0 },
      { id: "10-9", slug: "academic-excellence-cert", title: "شهادة تفوق دراسي", description: "شهادة تفوق دراسي", type: "interactive", price: 0 },
      { id: "10-10", slug: "good-behavior-cert", title: "شهادة حسن سلوك ومواظبة", description: "شهادة حسن سلوك ومواظبة", type: "interactive", price: 0 },
      { id: "10-11", slug: "volunteer-cert", title: "شهادة تطوع", description: "شهادة تطوع", type: "interactive", price: 0 },
    ],
  },
  {
    id: "11",
    slug: "school-records",
    title: "السجلات المدرسية",
    description: "جميع السجلات الإدارية والتعليمية المطلوبة في المدارس شاملة التقويم والشراكات والنشاط الطلابي",
    icon: "BookOpen",
    color: "#16A34A",
    services: [
      { id: "11-1", slug: "daily-attendance-record", title: "سجل الحضور والغياب اليومي", description: "سجل الحضور والغياب اليومي للطلاب", type: "interactive", price: 0 },
      { id: "11-2", slug: "grades-record", title: "سجل الدرجات والتقييمات", description: "سجل الدرجات والتقييمات", type: "interactive", price: 0 },
      { id: "11-3", slug: "daily-follow-up-record", title: "سجل المتابعة اليومية", description: "سجل المتابعة اليومية للطلاب", type: "interactive", price: 0 },
      { id: "11-4", slug: "behavioral-notes-record", title: "سجل الملاحظات السلوكية", description: "سجل الملاحظات السلوكية", type: "interactive", price: 0 },
      { id: "11-5", slug: "parent-communication-record", title: "سجل التواصل مع أولياء الأمور", description: "سجل التواصل مع أولياء الأمور", type: "interactive", price: 0 },
      { id: "11-6", slug: "classroom-visits-record", title: "سجل الزيارات الصفية", description: "سجل الزيارات الصفية", type: "interactive", price: 0 },
      { id: "11-7", slug: "school-meetings-record", title: "سجل الاجتماعات المدرسية", description: "سجل الاجتماعات المدرسية", type: "interactive", price: 0 },
      { id: "11-8", slug: "school-assets-record", title: "سجل العهد المدرسية", description: "سجل العهد المدرسية", type: "interactive", price: 0 },
      { id: "11-9", slug: "correspondence-log", title: "سجل الصادر والوارد", description: "سجل الصادر والوارد", type: "interactive", price: 0 },
      { id: "11-10", slug: "labs-record", title: "سجل المعامل والمختبرات", description: "سجل المعامل والمختبرات", type: "interactive", price: 0 },
      { id: "11-11", slug: "library-record", title: "سجل المكتبة المدرسية", description: "سجل المكتبة المدرسية", type: "interactive", price: 0 },
      { id: "11-12", slug: "school-calendar", title: "التقويم المدرسي", description: "التقويم المدرسي الرسمي", type: "interactive", price: 0 },
      { id: "11-13", slug: "community-partnership-record", title: "سجل الشراكة المجتمعية", description: "سجل الشراكة المجتمعية", type: "interactive", price: 0 },
      { id: "11-14", slug: "gifted-students-record", title: "سجل الموهبة والموهوبين", description: "سجل الموهبة والموهوبين", type: "interactive", price: 0 },
      { id: "11-15", slug: "activity-leader-record", title: "سجل رائدة النشاط", description: "سجل رائدة النشاط", type: "interactive", price: 0 },
      { id: "11-16", slug: "waiting-class-record", title: "سجل حصة الانتظار", description: "سجل حصة الانتظار", type: "interactive", price: 0 },
      { id: "11-17", slug: "supervision-duty-record", title: "سجل الإشراف والمناوبة", description: "سجل الإشراف والمناوبة", type: "interactive", price: 0 },
      { id: "11-18", slug: "student-activity-record", title: "سجل النشاط الطلابي", description: "سجل النشاط الطلابي", type: "interactive", price: 0 },
      { id: "11-19", slug: "extracurricular-activities-record", title: "سجل الأنشطة اللاصفية", description: "سجل الأنشطة اللاصفية", type: "interactive", price: 0 },
      { id: "11-20", slug: "student-counseling-record", title: "سجل التوجيه الطلابي", description: "سجل التوجيه الطلابي", type: "interactive", price: 0 },
      { id: "11-21", slug: "health-counseling-record", title: "سجل التوجيه الصحي", description: "سجل التوجيه الصحي", type: "interactive", price: 0 },
      { id: "11-22", slug: "distinguished-behavior-record", title: "سجل السلوك المتميز", description: "سجل السلوك المتميز", type: "interactive", price: 0 },
    ],
  },
  {
    id: "12",
    slug: "school-broadcasts",
    title: "الإذاعة المدرسية",
    description: "نماذج إذاعات مدرسية جاهزة ومتنوعة لجميع المناسبات والمواضيع",
    icon: "Radio",
    color: "#F59E0B",
    services: [
      { id: "12-1", slug: "future-careers-broadcast", title: "إذاعة مهن المستقبل", description: "إذاعة مدرسية عن مهن المستقبل", type: "interactive", price: 0 },
      { id: "12-2", slug: "cleanliness-broadcast", title: "إذاعة عن النظافة", description: "إذاعة مدرسية عن النظافة", type: "interactive", price: 0 },
      { id: "12-3", slug: "national-day-broadcast", title: "إذاعة اليوم الوطني", description: "إذاعة مدرسية عن اليوم الوطني", type: "interactive", price: 0 },
      { id: "12-4", slug: "teacher-day-broadcast", title: "إذاعة يوم المعلم", description: "إذاعة مدرسية عن يوم المعلم", type: "interactive", price: 0 },
      { id: "12-5", slug: "arabic-language-broadcast", title: "إذاعة اليوم العالمي للغة العربية", description: "إذاعة مدرسية عن اليوم العالمي للغة العربية", type: "interactive", price: 0 },
      { id: "12-6", slug: "custom-broadcast", title: "إذاعة مدرسية قابلة للتخصيص", description: "نموذج إذاعة مدرسية قابل للتخصيص لأي موضوع", type: "interactive", price: 0 },
    ],
  },
  {
    id: "13",
    slug: "data-sheets",
    title: "الكشوفات والبيانات",
    description: "كشوفات الطلاب والبيانات الإدارية والجداول المدرسية وسجلات المتابعة",
    icon: "Table2",
    color: "#6366F1",
    services: [
      { id: "13-1", slug: "student-data-sheet", title: "كشف بيانات الطلاب", description: "كشف بيانات الطلاب الشامل", type: "interactive", price: 0 },
      { id: "13-2", slug: "student-grades-sheet", title: "كشف درجات الطلاب", description: "كشف درجات الطلاب", type: "interactive", price: 0 },
      { id: "13-3", slug: "attendance-sheet", title: "كشف الحضور والغياب", description: "كشف الحضور والغياب", type: "interactive", price: 0 },
      { id: "13-4", slug: "class-distribution-sheet", title: "كشف توزيع الطلاب على الفصول", description: "كشف توزيع الطلاب على الفصول", type: "interactive", price: 0 },
      { id: "13-5", slug: "teachers-schedule-sheet", title: "كشف المعلمين والجداول", description: "كشف المعلمين والجداول", type: "interactive", price: 0 },
      { id: "13-6", slug: "substitute-classes-sheet", title: "كشف الحصص الاحتياطية", description: "كشف الحصص الاحتياطية", type: "interactive", price: 0 },
      { id: "13-7", slug: "duty-roster-sheet", title: "كشف المناوبات", description: "كشف المناوبات", type: "interactive", price: 0 },
      { id: "13-8", slug: "school-schedule", title: "جدول المدرسة", description: "جدول المدرسة الأسبوعي", type: "interactive", price: 0 },
      { id: "13-9", slug: "follow-up-sheets", title: "كشوف المتابعة", description: "كشوف متابعة الطلاب", type: "interactive", price: 0 },
      { id: "13-10", slug: "printed-follow-up-record", title: "طباعة سجل متابعة", description: "طباعة سجل متابعة بتصاميم متعددة", type: "interactive", price: 0 },
      { id: "13-11", slug: "printed-cover", title: "طباعة غلاف", description: "أغلفة لجميع المواد الدراسية", type: "interactive", price: 0 },
    ],
  },
  {
    id: "14",
    slug: "initiatives-projects",
    title: "المبادرات والمشاريع",
    description: "نماذج توثيق المبادرات التعليمية والمشاريع المدرسية والشراكات المجتمعية",
    icon: "Lightbulb",
    color: "#F97316",
    services: [
      { id: "14-1", slug: "quality-initiative", title: "المبادرة النوعية", description: "نموذج توثيق المبادرة النوعية", type: "interactive", price: 0 },
      { id: "14-2", slug: "community-partnership", title: "الشراكة المجتمعية", description: "نموذج توثيق الشراكة المجتمعية", type: "interactive", price: 0 },
      { id: "14-3", slug: "ready-school-initiatives", title: "مبادرات مدرسية جاهزة", description: "مبادرات مدرسية جاهزة للتطبيق", type: "both", price: 0 },
      { id: "14-4", slug: "international-days-events", title: "أيام عالمية ومناسبات", description: "نماذج توثيق الأيام العالمية والمناسبات", type: "both", price: 0 },
      { id: "14-5", slug: "knowledge-production", title: "الإنتاج المعرفي", description: "نماذج توثيق الإنتاج المعرفي للمعلمين", type: "interactive", price: 0 },
    ],
  },
  {
    id: "15",
    slug: "professional-communities",
    title: "المجتمعات المهنية والبحوث",
    description: "نماذج وتقارير مجتمعات التعلم المهنية وبحث الدرس والبحوث الإجرائية والزيارات التبادلية",
    icon: "Users",
    color: "#0D9488",
    services: [
      { id: "15-1", slug: "plc-sessions-report", title: "تقرير جلسات مجتمعات التعلم المهنية", description: "تقرير جلسات مجتمعات التعلم المهنية", type: "interactive", price: 0 },
      { id: "15-2", slug: "specialty-meeting-template", title: "نموذج اجتماع التخصص", description: "نموذج المجتمعات المهنية (اجتماع التخصص)", type: "interactive", price: 0 },
      { id: "15-3", slug: "peer-visits-report", title: "تقرير تبادل الزيارات بين المعلمين", description: "استمارة وتقرير تبادل الزيارات بين المعلمين", type: "interactive", price: 0 },
      { id: "15-4", slug: "action-research", title: "البحث الإجرائي", description: "نموذج البحث الإجرائي", type: "interactive", price: 0 },
      { id: "15-5", slug: "lesson-study", title: "بحث الدّرس", description: "نموذج بحث الدرس", type: "interactive", price: 0 },
      { id: "15-6", slug: "peer-observation", title: "نموذج تبادل الزيارات الصفية", description: "نموذج تبادل الزيارات الصفية", type: "interactive", price: 0 },
    ],
  },
  {
    id: "16",
    slug: "workshops-training",
    title: "ورش العمل والبرامج التدريبية",
    description: "نماذج وتقارير ورش العمل والبرامج التدريبية والحقائب التدريبية المهنية",
    icon: "Presentation",
    color: "#BE185D",
    services: [
      { id: "16-1", slug: "workshop-report", title: "نموذج تقرير ورشة عمل", description: "نموذج تقرير ورشة عمل", type: "interactive", price: 0 },
      { id: "16-2", slug: "training-plan", title: "نموذج خطة تدريبية", description: "نموذج خطة تدريبية", type: "interactive", price: 0 },
      { id: "16-3", slug: "training-evaluation", title: "نموذج تقييم برنامج تدريبي", description: "نموذج تقييم برنامج تدريبي", type: "interactive", price: 0 },
      { id: "16-4", slug: "training-kit", title: "نموذج حقيبة تدريبية", description: "نموذج حقيبة تدريبية مهنية", type: "both", price: 39 },
      { id: "16-5", slug: "training-course-report", title: "نموذج تقرير دورة تدريبية", description: "نموذج تقرير دورة تدريبية", type: "interactive", price: 0 },
      { id: "16-6", slug: "training-survey", title: "نموذج استبيان تقييم التدريب", description: "نموذج استبيان تقييم التدريب", type: "interactive", price: 0 },
    ],
  },
  {
    id: "17",
    slug: "teaching-strategies",
    title: "الاستراتيجيات التعليمية والدروس التطبيقية",
    description: "استراتيجيات تدريس جاهزة والدروس التطبيقية والمصغرة مع نماذج تقارير ووسائل تعليمية",
    icon: "Zap",
    color: "#7C3AED",
    services: [
      { id: "17-1", slug: "active-learning-strategy", title: "استراتيجية التعلّم النشط", description: "استراتيجية التعلم النشط جاهزة للتطبيق", type: "both", price: 0 },
      { id: "17-2", slug: "ready-teaching-strategies", title: "استراتيجيات تعليمية جاهزة", description: "مجموعة استراتيجيات تعليمية جاهزة للتطبيق", type: "both", price: 0 },
      { id: "17-3", slug: "classroom-management-strategies", title: "استراتيجيات الإدارة الصفية", description: "استراتيجيات الإدارة الصفية جاهزة", type: "both", price: 0 },
      { id: "17-4", slug: "ready-teaching-aids", title: "وسائل تعليمية جاهزة", description: "وسائل تعليمية جاهزة للاستخدام", type: "both", price: 0 },
      { id: "17-5", slug: "applied-lesson", title: "الدرس التطبيقي", description: "نموذج توثيق الدرس التطبيقي", type: "interactive", price: 0 },
      { id: "17-6", slug: "micro-lesson", title: "الدرس المصغّر", description: "نموذج توثيق الدرس المصغر", type: "interactive", price: 0 },
      { id: "17-7", slug: "ready-tech-programs", title: "برامج تقنية جاهزة", description: "برامج تقنية جاهزة للتطبيق", type: "both", price: 0 },
    ],
  },
  {
    id: "18",
    slug: "digital-tools",
    title: "الأدوات والخدمات الإلكترونية",
    description: "أدوات مساعدة إلكترونية ذكية للمعلمين والإداريين مع دعم الذكاء الاصطناعي",
    icon: "Wrench",
    color: "#475569",
    services: [
      { id: "18-1", slug: "ai-assistant", title: "المساعد الذكي بالذكاء الاصطناعي", description: "مساعد ذكي لكتابة التقارير التربوية", type: "interactive", price: 0 },
      { id: "18-2", slug: "file-to-qr", title: "تحويل الملف إلى باركود QR", description: "تحويل أي ملف إلى باركود QR", type: "interactive", price: 0 },
      { id: "18-3", slug: "create-qr", title: "إنشاء كود QR", description: "إنشاء كود QR لأي رابط", type: "interactive", price: 0 },
      { id: "18-4", slug: "contact-qr-card", title: "QR Code بطاقة التواصل", description: "إنشاء بطاقة تواصل بكود QR", type: "interactive", price: 0 },
      { id: "18-5", slug: "pdf-signature", title: "توقيعك على ملفات PDF", description: "توقيع ملفات PDF أونلاين", type: "interactive", price: 0 },
      { id: "18-6", slug: "noor-reports-export", title: "تصدير تقارير نظام نور", description: "تصدير تقارير نظام نور", type: "interactive", price: 0 },
      { id: "18-7", slug: "weighted-percentage-calc", title: "حاسبة النسبة الموزونة", description: "حاسبة النسبة الموزونة", type: "interactive", price: 0 },
      { id: "18-8", slug: "retirement-calc", title: "حاسبة التقاعد", description: "حاسبة التقاعد للمعلمين", type: "interactive", price: 0 },
      { id: "18-9", slug: "image-compress-convert", title: "ضغط وتحويل الصور", description: "ضغط وتحويل تنسيق الصور", type: "interactive", price: 0 },
      { id: "18-10", slug: "url-shortener", title: "اختصار الروابط", description: "اختصار الروابط الطويلة", type: "interactive", price: 0 },
      { id: "18-11", slug: "academic-calendar", title: "التقويم الدراسي", description: "التقويم الدراسي الرسمي", type: "interactive", price: 0 },
      { id: "18-12", slug: "learning-styles-survey-kids", title: "استبيان أنماط التعلم للأطفال", description: "استبيان أنماط التعلم للأطفال", type: "interactive", price: 0 },
      { id: "18-13", slug: "learning-styles-survey-adults", title: "استبيان أنماط التعلم للكبار", description: "استبيان أنماط التعلم للكبار", type: "interactive", price: 0 },
      { id: "18-14", slug: "learning-styles-classification-sheet", title: "كشف تصنيف أنماط التعلم", description: "كشف التصنيف ونسبة الطلاب حسب نمط التعلم", type: "interactive", price: 0 },
      { id: "18-15", slug: "surveys-polls", title: "الاستبانات", description: "إنشاء استبانات تعليمية", type: "interactive", price: 0 },
      { id: "18-16", slug: "wall-posters", title: "جداريات", description: "تصميم جداريات مدرسية", type: "interactive", price: 0 },
    ],
  },
  {
    id: "19",
    slug: "letters-correspondence",
    title: "الخطابات والمراسلات",
    description: "نماذج خطابات رسمية ومراسلات إدارية جاهزة للتعبئة والطباعة",
    icon: "Mail",
    color: "#64748B",
    services: [
      { id: "19-1", slug: "salary-certificate", title: "خطاب تعريف بالراتب", description: "خطاب تعريف بالراتب رسمي", type: "interactive", price: 0 },
      { id: "19-2", slug: "work-commencement", title: "خطاب مباشرة عمل", description: "خطاب مباشرة عمل رسمي", type: "interactive", price: 0 },
      { id: "19-3", slug: "clearance-letter", title: "خطاب إخلاء طرف", description: "خطاب إخلاء طرف رسمي", type: "interactive", price: 0 },
      { id: "19-4", slug: "assignment-letter", title: "خطاب تكليف", description: "خطاب تكليف رسمي", type: "interactive", price: 0 },
      { id: "19-5", slug: "official-appreciation-letter", title: "خطاب شكر وتقدير رسمي", description: "خطاب شكر وتقدير رسمي", type: "interactive", price: 0 },
      { id: "19-6", slug: "parent-invitation-letter", title: "خطاب دعوة لولي أمر", description: "خطاب دعوة لولي أمر", type: "interactive", price: 0 },
      { id: "19-7", slug: "student-referral-letter", title: "خطاب إحالة طالب", description: "خطاب إحالة طالب", type: "interactive", price: 0 },
      { id: "19-8", slug: "maintenance-request-letter", title: "خطاب طلب صيانة", description: "خطاب طلب صيانة", type: "interactive", price: 0 },
    ],
  },
];

// Helper functions
export function getAllServices(): Service[] {
  return sections.flatMap((s) => s.services);
}

export function getTotalServicesCount(): number {
  return sections.reduce((acc, s) => acc + s.services.length, 0);
}

export function getInteractiveCount(): number {
  return getAllServices().filter((s) => s.type === "interactive" || s.type === "both").length;
}

export function getPaidCount(): number {
  return getAllServices().filter((s) => s.price > 0).length;
}

export function getFreeCount(): number {
  return getAllServices().filter((s) => s.price === 0).length;
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
        section.title.toLowerCase().includes(q)
      ) {
        results.push({ section, service });
      }
    }
  }
  return results;
}
