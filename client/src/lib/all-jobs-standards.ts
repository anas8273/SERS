/**
 * بيانات المعايير الرسمية لجميع الوظائف التعليمية
 * مستخرجة من ملف PDF وزارة التعليم - نماذج تقييم أداء شاغلي الوظائف التعليمية
 * هيكل ثلاثي المستويات: معيار → بند → بند فرعي
 */

import type { Standard } from "./standards-data";

// ===== 1. مدير المدرسة (20 عنصر) =====
export const PRINCIPAL_STANDARDS: Standard[] = [
  {
    id: "p-std-1", number: 1, title: "أداء الواجبات الوظيفية", weight: 5, color: "#2563EB", icon: "📋",
    items: [
      {
        id: "p-1-1", text: "يطبق الأنظمة وقواعد السلوك الوظيفية وأخلاقيات بيئة التعلم",
        subItems: [
          { id: "p-1-1-1", title: "الالتزام بالأنظمة واللوائح الإدارية", suggestedEvidence: ["صورة من الخطابات الرسمية", "محاضر الاجتماعات"] },
          { id: "p-1-1-2", title: "تعزيز الانتماء والولاء للوطن والقيم الوطنية", suggestedEvidence: ["صور الفعاليات الوطنية", "خطة البرامج الوطنية"] },
        ],
        suggestedEvidence: ["تقرير الالتزام بالأنظمة", "شهادات التقدير"],
      },
    ],
  },
  {
    id: "p-std-2", number: 2, title: "التفاعل مع المجتمع المهني", weight: 5, color: "#059669", icon: "🤝",
    items: [
      {
        id: "p-2-1", text: "المشاركة الفعالة في مجتمعات وشبكات التعليم",
        subItems: [
          { id: "p-2-1-1", title: "المشاركة في الدورات والمؤتمرات التعليمية", suggestedEvidence: ["شهادات حضور", "تقارير المشاركة"] },
          { id: "p-2-1-2", title: "تبادل المعرفة وتطوير المهارات المهنية", suggestedEvidence: ["محاضر اجتماعات مجتمعات التعلم", "ملخصات ورش العمل"] },
        ],
        suggestedEvidence: ["شهادات الدورات", "تقارير المشاركة في المجتمعات المهنية"],
      },
    ],
  },
  {
    id: "p-std-3", number: 3, title: "التفاعل مع أولياء الأمور", weight: 5, color: "#0891B2", icon: "👨‍👩‍👧",
    items: [
      {
        id: "p-3-1", text: "المساهمة في دعم وتحقيق بيئة تعليمية فعالة لتحسين التحصيل الدراسي",
        subItems: [
          { id: "p-3-1-1", title: "تفعيل قنوات اتصال فعالة مع أولياء الأمور", suggestedEvidence: ["سجل التواصل", "رسائل أولياء الأمور"] },
          { id: "p-3-1-2", title: "تشجيع أولياء الأمور على المشاركة في العملية التعليمية", suggestedEvidence: ["محاضر مجالس الآباء", "صور الفعاليات"] },
        ],
        suggestedEvidence: ["سجل التواصل مع أولياء الأمور", "محاضر اجتماعات مجلس الآباء"],
      },
    ],
  },
  {
    id: "p-std-4", number: 4, title: "المرونة والقدرة على التنفيذ في ظروف العمل المختلفة", weight: 5, color: "#7C3AED", icon: "🔄",
    items: [
      {
        id: "p-4-1", text: "مرن وقادر على تنفيذ أعماله في ظل ظروف العمل المختلفة",
        subItems: [
          { id: "p-4-1-1", title: "التكيف مع المتغيرات والتحديات المدرسية", suggestedEvidence: ["خطط الطوارئ", "تقارير إدارة الأزمات"] },
          { id: "p-4-1-2", title: "إيجاد حلول إبداعية للمشكلات", suggestedEvidence: ["تقارير حل المشكلات", "مبادرات التطوير"] },
        ],
        suggestedEvidence: ["تقارير إدارة الأزمات", "خطط الطوارئ المعتمدة"],
      },
    ],
  },
  {
    id: "p-std-5", number: 5, title: "دعم المبادرات النوعية", weight: 5, color: "#CA8A04", icon: "💡",
    items: [
      {
        id: "p-5-1", text: "يدعم ويشارك في المبادرات النوعية",
        subItems: [
          { id: "p-5-1-1", title: "تبني مبادرات تطويرية للمدرسة", suggestedEvidence: ["وثائق المبادرات", "تقارير التنفيذ"] },
          { id: "p-5-1-2", title: "دعم المبادرات الوزارية والمحلية", suggestedEvidence: ["خطابات المشاركة", "تقارير الإنجاز"] },
        ],
        suggestedEvidence: ["وثائق المبادرات النوعية", "تقارير الإنجاز"],
      },
    ],
  },
  {
    id: "p-std-6", number: 6, title: "الانضباط المدرسي", weight: 5, color: "#DC2626", icon: "⚖️",
    items: [
      {
        id: "p-6-1", text: "يتخذ إجراءات تربوية تحقق الانضباط المدرسي",
        subItems: [
          { id: "p-6-1-1", title: "تطبيق لائحة السلوك والمواظبة", suggestedEvidence: ["سجل المخالفات", "تقارير الانضباط"] },
          { id: "p-6-1-2", title: "تعزيز السلوك الإيجابي للطلاب", suggestedEvidence: ["برامج التحفيز", "شهادات التقدير"] },
        ],
        suggestedEvidence: ["سجل الانضباط المدرسي", "خطة تعزيز السلوك الإيجابي"],
      },
    ],
  },
  {
    id: "p-std-7", number: 7, title: "إدارة الموارد", weight: 5, color: "#059669", icon: "📊",
    items: [
      {
        id: "p-7-1", text: "يدير الموارد في المدرسة بكفاءة",
        subItems: [
          { id: "p-7-1-1", title: "إدارة الموارد المالية والمادية", suggestedEvidence: ["التقرير المالي", "جرد العهد"] },
          { id: "p-7-1-2", title: "توزيع المهام والمسؤوليات بعدالة", suggestedEvidence: ["خطة توزيع المهام", "محاضر الاجتماعات"] },
        ],
        suggestedEvidence: ["التقرير المالي السنوي", "خطة توزيع الموارد"],
      },
    ],
  },
  {
    id: "p-std-8", number: 8, title: "التطوير المهني", weight: 5, color: "#7C3AED", icon: "📈",
    items: [
      {
        id: "p-8-1", text: "يعد خطة للتطوير المهني",
        subItems: [
          { id: "p-8-1-1", title: "إعداد خطة التطوير المهني للمنسوبين", suggestedEvidence: ["خطة التطوير المهني", "سجل الدورات"] },
          { id: "p-8-1-2", title: "تحديد الاحتياجات التدريبية", suggestedEvidence: ["استبانات الاحتياجات", "تقارير التحليل"] },
        ],
        suggestedEvidence: ["خطة التطوير المهني المعتمدة", "تقارير تنفيذ الخطة"],
      },
    ],
  },
  {
    id: "p-std-9", number: 9, title: "التغذية الراجعة ومتابعة مؤشرات الأداء", weight: 5, color: "#0891B2", icon: "🎯",
    items: [
      {
        id: "p-9-1", text: "يقدم التغذية الراجعة ويتابع تحقق مؤشرات الأداء الوظيفي",
        subItems: [
          { id: "p-9-1-1", title: "تقديم تغذية راجعة بناءة للمنسوبين", suggestedEvidence: ["نماذج التغذية الراجعة", "تقارير الزيارات"] },
          { id: "p-9-1-2", title: "متابعة مؤشرات الأداء المدرسي", suggestedEvidence: ["لوحة المؤشرات", "تقارير الأداء"] },
        ],
        suggestedEvidence: ["تقارير التغذية الراجعة", "لوحة مؤشرات الأداء"],
      },
    ],
  },
  {
    id: "p-std-10", number: 10, title: "دعم برامج التطوير المهني", weight: 5, color: "#CA8A04", icon: "🏋️",
    items: [
      {
        id: "p-10-1", text: "يدعم تنفيذ برامج التطوير المهني",
        subItems: [
          { id: "p-10-1-1", title: "تسهيل حضور المنسوبين للدورات التدريبية", suggestedEvidence: ["خطابات الترشيح", "شهادات الحضور"] },
          { id: "p-10-1-2", title: "تنفيذ برامج تدريبية داخل المدرسة", suggestedEvidence: ["خطة التدريب الداخلي", "تقارير التنفيذ"] },
        ],
        suggestedEvidence: ["سجل برامج التطوير المهني", "تقارير التنفيذ"],
      },
    ],
  },
  {
    id: "p-std-11", number: 11, title: "تقييم أداء المنسوبين", weight: 5, color: "#DC2626", icon: "📝",
    items: [
      {
        id: "p-11-1", text: "يقيم أداء منسوبي المدرسة",
        subItems: [
          { id: "p-11-1-1", title: "إجراء تقييم دوري للمنسوبين", suggestedEvidence: ["نماذج التقييم", "تقارير الأداء"] },
          { id: "p-11-1-2", title: "توثيق نتائج التقييم ومتابعتها", suggestedEvidence: ["سجل التقييمات", "خطط التحسين"] },
        ],
        suggestedEvidence: ["نماذج تقييم الأداء", "تقارير نتائج التقييم"],
      },
    ],
  },
  {
    id: "p-std-12", number: 12, title: "تحسين نتائج التعلم", weight: 5, color: "#059669", icon: "📊",
    items: [
      {
        id: "p-12-1", text: "ينفذ إجراءات علمية لتحسين نتائج التعلم",
        subItems: [
          { id: "p-12-1-1", title: "تحليل نتائج الطلاب واتخاذ إجراءات تصحيحية", suggestedEvidence: ["تقارير تحليل النتائج", "خطط التحسين"] },
          { id: "p-12-1-2", title: "متابعة تنفيذ خطط تحسين التحصيل", suggestedEvidence: ["تقارير المتابعة", "مقارنات النتائج"] },
        ],
        suggestedEvidence: ["تقارير تحليل النتائج", "خطط تحسين التحصيل"],
      },
    ],
  },
  {
    id: "p-std-13", number: 13, title: "تحسين مستوى أداء المدرسة", weight: 10, color: "#7C3AED", icon: "🏫",
    items: [
      {
        id: "p-13-1", text: "يسهم في تحسين مستوى أداء المدرسة",
        subItems: [
          { id: "p-13-1-1", title: "تطبيق معايير الجودة في الأداء المدرسي", suggestedEvidence: ["تقارير الجودة", "خطط التحسين"] },
          { id: "p-13-1-2", title: "رفع مستوى الأداء في مؤشرات التقييم", suggestedEvidence: ["نتائج التقييم الذاتي", "تقارير الإنجاز"] },
        ],
        suggestedEvidence: ["تقرير التقييم الذاتي للمدرسة", "خطة تحسين الأداء"],
      },
    ],
  },
  {
    id: "p-std-14", number: 14, title: "إعداد الخطط المدرسية", weight: 5, color: "#0891B2", icon: "📋",
    items: [
      {
        id: "p-14-1", text: "يعد الخطط المدرسية اللازمة",
        subItems: [
          { id: "p-14-1-1", title: "إعداد الخطة التشغيلية السنوية", suggestedEvidence: ["الخطة التشغيلية المعتمدة", "مصفوفة الأهداف"] },
          { id: "p-14-1-2", title: "إعداد خطط الطوارئ والأمن والسلامة", suggestedEvidence: ["خطة الطوارئ", "خطة الإخلاء"] },
        ],
        suggestedEvidence: ["الخطة التشغيلية السنوية", "خطط الطوارئ المعتمدة"],
      },
    ],
  },
  {
    id: "p-std-15", number: 15, title: "متابعة تنفيذ الخطط المدرسية", weight: 5, color: "#CA8A04", icon: "✅",
    items: [
      {
        id: "p-15-1", text: "يتابع تنفيذ الخطط المدرسية بمختلف أنواعها",
        subItems: [
          { id: "p-15-1-1", title: "متابعة تنفيذ الخطة التشغيلية", suggestedEvidence: ["تقارير المتابعة الدورية", "نسب الإنجاز"] },
          { id: "p-15-1-2", title: "تقييم مخرجات الخطط وتطويرها", suggestedEvidence: ["تقارير التقييم", "محاضر الاجتماعات"] },
        ],
        suggestedEvidence: ["تقارير متابعة تنفيذ الخطط", "نسب الإنجاز"],
      },
    ],
  },
  {
    id: "p-std-16", number: 16, title: "دعم الأنشطة الصفية وغير الصفية", weight: 5, color: "#DC2626", icon: "🎨",
    items: [
      {
        id: "p-16-1", text: "يهيئ الفرص والإمكانات الداعمة لمشاركة الطلاب في الأنشطة الصفية وغير الصفية",
        subItems: [
          { id: "p-16-1-1", title: "توفير الإمكانات اللازمة للأنشطة", suggestedEvidence: ["ميزانية الأنشطة", "قائمة المستلزمات"] },
          { id: "p-16-1-2", title: "دعم مشاركة الطلاب في المسابقات والفعاليات", suggestedEvidence: ["خطابات المشاركة", "شهادات الطلاب"] },
        ],
        suggestedEvidence: ["خطة الأنشطة المدرسية", "تقارير تنفيذ الأنشطة"],
      },
    ],
  },
  {
    id: "p-std-17", number: 17, title: "توظيف المنصات الرقمية", weight: 5, color: "#059669", icon: "💻",
    items: [
      {
        id: "p-17-1", text: "يوظف المنصات الرقمية وتطبيقاتها المعتمدة في دعم عمليات التعليم والتعلم",
        subItems: [
          { id: "p-17-1-1", title: "تفعيل المنصات التعليمية الرقمية", suggestedEvidence: ["تقارير تفعيل المنصات", "إحصائيات الاستخدام"] },
          { id: "p-17-1-2", title: "متابعة استخدام المنسوبين للمنصات", suggestedEvidence: ["تقارير المتابعة", "نسب التفعيل"] },
        ],
        suggestedEvidence: ["تقارير تفعيل المنصات الرقمية", "إحصائيات الاستخدام"],
      },
    ],
  },
  {
    id: "p-std-18", number: 18, title: "تعزيز السلوك الإيجابي", weight: 5, color: "#7C3AED", icon: "⭐",
    items: [
      {
        id: "p-18-1", text: "يتابع تعزيز السلوك الإيجابي للطلاب",
        subItems: [
          { id: "p-18-1-1", title: "تنفيذ برامج تعزيز السلوك الإيجابي", suggestedEvidence: ["خطة البرامج", "صور الفعاليات"] },
          { id: "p-18-1-2", title: "متابعة تطبيق قواعد السلوك والمواظبة", suggestedEvidence: ["تقارير المتابعة", "سجل المخالفات"] },
        ],
        suggestedEvidence: ["خطة تعزيز السلوك الإيجابي", "تقارير التنفيذ"],
      },
    ],
  },
  {
    id: "p-std-19", number: 19, title: "البيئة المدرسية الآمنة والمحفزة", weight: 5, color: "#0891B2", icon: "🏠",
    items: [
      {
        id: "p-19-1", text: "يهيئ بيئة مدرسية آمنة ومحفزة على التعلم",
        subItems: [
          { id: "p-19-1-1", title: "توفير بيئة مدرسية آمنة وصحية", suggestedEvidence: ["تقارير السلامة", "صور البيئة المدرسية"] },
          { id: "p-19-1-2", title: "تحفيز الطلاب والمنسوبين على التميز", suggestedEvidence: ["برامج التحفيز", "شهادات التقدير"] },
        ],
        suggestedEvidence: ["تقارير البيئة المدرسية", "صور التحسينات"],
      },
    ],
  },
];

// ===== 2. وكيل المدرسة (19 عنصر - نفس مدير المدرسة تقريباً مع اختلافات) =====
export const VICE_PRINCIPAL_STANDARDS: Standard[] = [
  {
    id: "v-std-1", number: 1, title: "أداء الواجبات الوظيفية", weight: 5, color: "#7C3AED", icon: "📋",
    items: [
      {
        id: "v-1-1", text: "يطبق الأنظمة وقواعد السلوك الوظيفية",
        subItems: [
          { id: "v-1-1-1", title: "الالتزام بالأنظمة واللوائح", suggestedEvidence: ["صورة من الخطابات الرسمية"] },
          { id: "v-1-1-2", title: "تعزيز القيم الوطنية", suggestedEvidence: ["صور الفعاليات الوطنية"] },
        ],
        suggestedEvidence: ["تقرير الالتزام", "شهادات التقدير"],
      },
    ],
  },
  {
    id: "v-std-2", number: 2, title: "التفاعل مع المجتمع المهني", weight: 5, color: "#059669", icon: "🤝",
    items: [
      {
        id: "v-2-1", text: "المشاركة الفعالة في مجتمعات التعليم",
        subItems: [
          { id: "v-2-1-1", title: "المشاركة في الدورات والمؤتمرات", suggestedEvidence: ["شهادات حضور"] },
          { id: "v-2-1-2", title: "تبادل المعرفة المهنية", suggestedEvidence: ["محاضر مجتمعات التعلم"] },
        ],
        suggestedEvidence: ["شهادات الدورات", "تقارير المشاركة"],
      },
    ],
  },
  {
    id: "v-std-3", number: 3, title: "التفاعل مع أولياء الأمور", weight: 5, color: "#0891B2", icon: "👨‍👩‍👧",
    items: [
      {
        id: "v-3-1", text: "المساهمة في دعم بيئة تعليمية فعالة",
        subItems: [
          { id: "v-3-1-1", title: "تفعيل قنوات التواصل مع أولياء الأمور", suggestedEvidence: ["سجل التواصل"] },
          { id: "v-3-1-2", title: "تشجيع مشاركة أولياء الأمور", suggestedEvidence: ["محاضر مجالس الآباء"] },
        ],
        suggestedEvidence: ["سجل التواصل", "محاضر الاجتماعات"],
      },
    ],
  },
  {
    id: "v-std-4", number: 4, title: "المرونة والقدرة على التنفيذ", weight: 5, color: "#CA8A04", icon: "🔄",
    items: [
      {
        id: "v-4-1", text: "مرن وقادر على تنفيذ أعماله في ظل ظروف العمل المختلفة",
        subItems: [
          { id: "v-4-1-1", title: "التكيف مع المتغيرات", suggestedEvidence: ["تقارير إدارة الأزمات"] },
          { id: "v-4-1-2", title: "إيجاد حلول إبداعية", suggestedEvidence: ["مبادرات التطوير"] },
        ],
        suggestedEvidence: ["تقارير إدارة الأزمات", "خطط الطوارئ"],
      },
    ],
  },
  {
    id: "v-std-5", number: 5, title: "دعم المبادرات النوعية", weight: 10, color: "#DC2626", icon: "💡",
    items: [
      {
        id: "v-5-1", text: "يدعم ويشارك في المبادرات النوعية",
        subItems: [
          { id: "v-5-1-1", title: "المشاركة في المبادرات التطويرية", suggestedEvidence: ["وثائق المبادرات"] },
          { id: "v-5-1-2", title: "دعم المبادرات الوزارية", suggestedEvidence: ["تقارير الإنجاز"] },
        ],
        suggestedEvidence: ["وثائق المبادرات", "تقارير الإنجاز"],
      },
    ],
  },
  {
    id: "v-std-6", number: 6, title: "الانضباط المدرسي", weight: 5, color: "#059669", icon: "⚖️",
    items: [
      {
        id: "v-6-1", text: "يتخذ إجراءات تربوية تحقق الانضباط المدرسي",
        subItems: [
          { id: "v-6-1-1", title: "تطبيق لائحة السلوك والمواظبة", suggestedEvidence: ["سجل المخالفات"] },
          { id: "v-6-1-2", title: "تعزيز السلوك الإيجابي", suggestedEvidence: ["برامج التحفيز"] },
        ],
        suggestedEvidence: ["سجل الانضباط", "خطة تعزيز السلوك"],
      },
    ],
  },
  {
    id: "v-std-7", number: 7, title: "إدارة الموارد", weight: 5, color: "#7C3AED", icon: "📊",
    items: [
      {
        id: "v-7-1", text: "يدير الموارد في المدرسة بكفاءة",
        subItems: [
          { id: "v-7-1-1", title: "إدارة الموارد المتاحة", suggestedEvidence: ["التقرير المالي"] },
          { id: "v-7-1-2", title: "توزيع المهام بعدالة", suggestedEvidence: ["خطة توزيع المهام"] },
        ],
        suggestedEvidence: ["التقرير المالي", "خطة توزيع الموارد"],
      },
    ],
  },
  {
    id: "v-std-8", number: 8, title: "المشاركة في التطوير المهني", weight: 5, color: "#0891B2", icon: "📈",
    items: [
      {
        id: "v-8-1", text: "يشارك في إعداد خطة للتطوير المهني",
        subItems: [
          { id: "v-8-1-1", title: "المشاركة في إعداد خطة التطوير", suggestedEvidence: ["خطة التطوير المهني"] },
          { id: "v-8-1-2", title: "تحديد الاحتياجات التدريبية", suggestedEvidence: ["استبانات الاحتياجات"] },
        ],
        suggestedEvidence: ["خطة التطوير المهني", "تقارير التنفيذ"],
      },
    ],
  },
  {
    id: "v-std-9", number: 9, title: "التغذية الراجعة ومؤشرات الأداء", weight: 5, color: "#CA8A04", icon: "🎯",
    items: [
      {
        id: "v-9-1", text: "يقدم التغذية الراجعة ويتابع مؤشرات الأداء الوظيفي",
        subItems: [
          { id: "v-9-1-1", title: "تقديم تغذية راجعة بناءة", suggestedEvidence: ["نماذج التغذية الراجعة"] },
          { id: "v-9-1-2", title: "متابعة مؤشرات الأداء", suggestedEvidence: ["لوحة المؤشرات"] },
        ],
        suggestedEvidence: ["تقارير التغذية الراجعة", "لوحة المؤشرات"],
      },
    ],
  },
  {
    id: "v-std-10", number: 10, title: "دعم برامج التطوير المهني", weight: 5, color: "#DC2626", icon: "🏋️",
    items: [
      {
        id: "v-10-1", text: "يدعم تنفيذ برامج التطوير المهني",
        subItems: [
          { id: "v-10-1-1", title: "تسهيل حضور الدورات التدريبية", suggestedEvidence: ["خطابات الترشيح"] },
          { id: "v-10-1-2", title: "تنفيذ برامج تدريبية داخلية", suggestedEvidence: ["خطة التدريب الداخلي"] },
        ],
        suggestedEvidence: ["سجل البرامج", "تقارير التنفيذ"],
      },
    ],
  },
  {
    id: "v-std-11", number: 11, title: "تقييم أداء المنسوبين", weight: 5, color: "#059669", icon: "📝",
    items: [
      {
        id: "v-11-1", text: "يقيم أداء منسوبي المدرسة",
        subItems: [
          { id: "v-11-1-1", title: "إجراء تقييم دوري", suggestedEvidence: ["نماذج التقييم"] },
          { id: "v-11-1-2", title: "توثيق نتائج التقييم", suggestedEvidence: ["سجل التقييمات"] },
        ],
        suggestedEvidence: ["نماذج التقييم", "تقارير النتائج"],
      },
    ],
  },
  {
    id: "v-std-12", number: 12, title: "تحسين نتائج التعلم", weight: 5, color: "#7C3AED", icon: "📊",
    items: [
      {
        id: "v-12-1", text: "ينفذ إجراءات علمية لتحسين نتائج التعلم",
        subItems: [
          { id: "v-12-1-1", title: "تحليل نتائج الطلاب", suggestedEvidence: ["تقارير التحليل"] },
          { id: "v-12-1-2", title: "متابعة خطط التحسين", suggestedEvidence: ["تقارير المتابعة"] },
        ],
        suggestedEvidence: ["تقارير تحليل النتائج", "خطط التحسين"],
      },
    ],
  },
  {
    id: "v-std-13", number: 13, title: "تحسين مستوى أداء المدرسة", weight: 5, color: "#0891B2", icon: "🏫",
    items: [
      {
        id: "v-13-1", text: "يسهم في تحسين مستوى أداء المدرسة",
        subItems: [
          { id: "v-13-1-1", title: "تطبيق معايير الجودة", suggestedEvidence: ["تقارير الجودة"] },
          { id: "v-13-1-2", title: "رفع مستوى الأداء", suggestedEvidence: ["نتائج التقييم الذاتي"] },
        ],
        suggestedEvidence: ["تقرير التقييم الذاتي", "خطة التحسين"],
      },
    ],
  },
  {
    id: "v-std-14", number: 14, title: "المشاركة في إعداد الخطط المدرسية", weight: 5, color: "#CA8A04", icon: "📋",
    items: [
      {
        id: "v-14-1", text: "يشارك في إعداد الخطط المدرسية اللازمة",
        subItems: [
          { id: "v-14-1-1", title: "المشاركة في إعداد الخطة التشغيلية", suggestedEvidence: ["الخطة التشغيلية"] },
          { id: "v-14-1-2", title: "المشاركة في خطط الطوارئ", suggestedEvidence: ["خطة الطوارئ"] },
        ],
        suggestedEvidence: ["الخطة التشغيلية", "خطط الطوارئ"],
      },
    ],
  },
  {
    id: "v-std-15", number: 15, title: "متابعة تنفيذ الخطط", weight: 5, color: "#DC2626", icon: "✅",
    items: [
      {
        id: "v-15-1", text: "يتابع تنفيذ الخطط المدرسية بمختلف أنواعها",
        subItems: [
          { id: "v-15-1-1", title: "متابعة تنفيذ الخطة التشغيلية", suggestedEvidence: ["تقارير المتابعة"] },
          { id: "v-15-1-2", title: "تقييم مخرجات الخطط", suggestedEvidence: ["تقارير التقييم"] },
        ],
        suggestedEvidence: ["تقارير المتابعة", "نسب الإنجاز"],
      },
    ],
  },
  {
    id: "v-std-16", number: 16, title: "دعم الأنشطة الصفية وغير الصفية", weight: 5, color: "#059669", icon: "🎨",
    items: [
      {
        id: "v-16-1", text: "يهيئ الفرص والإمكانات الداعمة لمشاركة الطلاب في الأنشطة",
        subItems: [
          { id: "v-16-1-1", title: "توفير الإمكانات للأنشطة", suggestedEvidence: ["ميزانية الأنشطة"] },
          { id: "v-16-1-2", title: "دعم مشاركة الطلاب في المسابقات", suggestedEvidence: ["خطابات المشاركة"] },
        ],
        suggestedEvidence: ["خطة الأنشطة", "تقارير التنفيذ"],
      },
    ],
  },
  {
    id: "v-std-17", number: 17, title: "توظيف المنصات الرقمية", weight: 5, color: "#7C3AED", icon: "💻",
    items: [
      {
        id: "v-17-1", text: "يوظف المنصات الرقمية في دعم التعليم والتعلم",
        subItems: [
          { id: "v-17-1-1", title: "تفعيل المنصات التعليمية", suggestedEvidence: ["تقارير التفعيل"] },
          { id: "v-17-1-2", title: "متابعة استخدام المنصات", suggestedEvidence: ["إحصائيات الاستخدام"] },
        ],
        suggestedEvidence: ["تقارير التفعيل", "إحصائيات الاستخدام"],
      },
    ],
  },
  {
    id: "v-std-18", number: 18, title: "تعزيز السلوك الإيجابي", weight: 5, color: "#0891B2", icon: "⭐",
    items: [
      {
        id: "v-18-1", text: "يتابع تعزيز السلوك الإيجابي للطلاب",
        subItems: [
          { id: "v-18-1-1", title: "تنفيذ برامج تعزيز السلوك", suggestedEvidence: ["خطة البرامج"] },
          { id: "v-18-1-2", title: "متابعة تطبيق قواعد السلوك", suggestedEvidence: ["تقارير المتابعة"] },
        ],
        suggestedEvidence: ["خطة تعزيز السلوك", "تقارير التنفيذ"],
      },
    ],
  },
  {
    id: "v-std-19", number: 19, title: "البيئة المدرسية الآمنة والمحفزة", weight: 5, color: "#CA8A04", icon: "🏠",
    items: [
      {
        id: "v-19-1", text: "يهيئ بيئة مدرسية آمنة ومحفزة على التعلم",
        subItems: [
          { id: "v-19-1-1", title: "توفير بيئة آمنة وصحية", suggestedEvidence: ["تقارير السلامة"] },
          { id: "v-19-1-2", title: "تحفيز الطلاب والمنسوبين", suggestedEvidence: ["برامج التحفيز"] },
        ],
        suggestedEvidence: ["تقارير البيئة المدرسية", "صور التحسينات"],
      },
    ],
  },
];

// ===== 3. الموجه الطلابي (13 عنصر) =====
export const COUNSELOR_STANDARDS: Standard[] = [
  {
    id: "co-std-1", number: 1, title: "أداء الواجبات الوظيفية", weight: 20, color: "#0891B2", icon: "📋",
    items: [
      {
        id: "co-1-1", text: "يطبق الأنظمة وقواعد السلوك الوظيفية",
        subItems: [
          { id: "co-1-1-1", title: "الالتزام بالأنظمة واللوائح", suggestedEvidence: ["تقرير الالتزام"] },
          { id: "co-1-1-2", title: "تعزيز القيم الوطنية والمهنية", suggestedEvidence: ["صور الفعاليات"] },
        ],
        suggestedEvidence: ["تقرير الالتزام بالأنظمة"],
      },
    ],
  },
  {
    id: "co-std-2", number: 2, title: "التفاعل مع المجتمع المهني", weight: 5, color: "#059669", icon: "🤝",
    items: [
      {
        id: "co-2-1", text: "المشاركة الفعالة في مجتمعات التعليم",
        subItems: [
          { id: "co-2-1-1", title: "المشاركة في الدورات والورش", suggestedEvidence: ["شهادات حضور"] },
          { id: "co-2-1-2", title: "تبادل الخبرات المهنية", suggestedEvidence: ["محاضر مجتمعات التعلم"] },
        ],
        suggestedEvidence: ["شهادات الدورات"],
      },
    ],
  },
  {
    id: "co-std-3", number: 3, title: "التفاعل مع أولياء الأمور", weight: 5, color: "#7C3AED", icon: "👨‍👩‍👧",
    items: [
      {
        id: "co-3-1", text: "التواصل المستمر مع أولياء الأمور",
        subItems: [
          { id: "co-3-1-1", title: "تفعيل قنوات التواصل", suggestedEvidence: ["سجل التواصل"] },
          { id: "co-3-1-2", title: "إشراك أولياء الأمور في خطط الدعم", suggestedEvidence: ["محاضر الاجتماعات"] },
        ],
        suggestedEvidence: ["سجل التواصل مع أولياء الأمور"],
      },
    ],
  },
  {
    id: "co-std-4", number: 4, title: "تعزيز الانضباط", weight: 5, color: "#DC2626", icon: "⚖️",
    items: [
      {
        id: "co-4-1", text: "يقدم التدخلات المناسبة لتعزيز الانضباط",
        subItems: [
          { id: "co-4-1-1", title: "تطبيق إجراءات الانضباط السلوكي", suggestedEvidence: ["سجل الحالات السلوكية"] },
          { id: "co-4-1-2", title: "تقديم برامج وقائية للانضباط", suggestedEvidence: ["خطة البرامج الوقائية"] },
        ],
        suggestedEvidence: ["سجل الحالات السلوكية", "خطة البرامج الوقائية"],
      },
    ],
  },
  {
    id: "co-std-5", number: 5, title: "تعزيز دافعية الطلبة للتعلم", weight: 5, color: "#CA8A04", icon: "🎯",
    items: [
      {
        id: "co-5-1", text: "تقديم برامج تربوية لتعزيز دافعية الطلبة للتعلم",
        subItems: [
          { id: "co-5-1-1", title: "تنفيذ برامج تحفيزية للطلاب", suggestedEvidence: ["خطة البرامج التحفيزية"] },
          { id: "co-5-1-2", title: "دعم الطلاب المتأخرين دراسياً", suggestedEvidence: ["خطط الدعم الفردية"] },
        ],
        suggestedEvidence: ["خطة البرامج التحفيزية", "تقارير التنفيذ"],
      },
    ],
  },
  {
    id: "co-std-6", number: 6, title: "إعداد خطة التوجيه الطلابي", weight: 10, color: "#059669", icon: "📋",
    items: [
      {
        id: "co-6-1", text: "إعداد خطة لبرامج التوجيه الطلابي",
        subItems: [
          { id: "co-6-1-1", title: "إعداد الخطة السنوية للتوجيه الطلابي", suggestedEvidence: ["الخطة السنوية المعتمدة"] },
          { id: "co-6-1-2", title: "تضمين البرامج الوقائية والعلاجية", suggestedEvidence: ["مصفوفة البرامج"] },
        ],
        suggestedEvidence: ["الخطة السنوية للتوجيه الطلابي", "مصفوفة البرامج"],
      },
    ],
  },
  {
    id: "co-std-7", number: 7, title: "تصنيف الحالات وبرامج الدعم", weight: 10, color: "#7C3AED", icon: "📂",
    items: [
      {
        id: "co-7-1", text: "يصنف الحالات ويقدم برامج الدعم المناسبة",
        subItems: [
          { id: "co-7-1-1", title: "تصنيف الحالات حسب نوعها وشدتها", suggestedEvidence: ["سجل تصنيف الحالات"] },
          { id: "co-7-1-2", title: "تقديم برامج دعم فردية وجماعية", suggestedEvidence: ["خطط الدعم", "تقارير المتابعة"] },
        ],
        suggestedEvidence: ["سجل تصنيف الحالات", "خطط الدعم الفردية"],
      },
    ],
  },
  {
    id: "co-std-8", number: 8, title: "تعزيز القيم والسلوكيات", weight: 10, color: "#0891B2", icon: "⭐",
    items: [
      {
        id: "co-8-1", text: "يعزز القيم والسلوكيات للمتعلمين",
        subItems: [
          { id: "co-8-1-1", title: "تنفيذ برامج تعزيز القيم", suggestedEvidence: ["خطة البرامج", "صور الفعاليات"] },
          { id: "co-8-1-2", title: "توعية الطلاب بالسلوكيات الإيجابية", suggestedEvidence: ["نشرات توعوية", "محاضرات"] },
        ],
        suggestedEvidence: ["خطة برامج تعزيز القيم", "تقارير التنفيذ"],
      },
    ],
  },
  {
    id: "co-std-9", number: 9, title: "التدخلات النفسية والاجتماعية", weight: 10, color: "#DC2626", icon: "🧠",
    items: [
      {
        id: "co-9-1", text: "يقدم التدخلات النفسية والاجتماعية",
        subItems: [
          { id: "co-9-1-1", title: "تقديم جلسات إرشاد فردي وجماعي", suggestedEvidence: ["سجل الجلسات الإرشادية"] },
          { id: "co-9-1-2", title: "التعامل مع الحالات النفسية والاجتماعية", suggestedEvidence: ["ملفات الحالات", "تقارير المتابعة"] },
        ],
        suggestedEvidence: ["سجل الجلسات الإرشادية", "ملفات الحالات"],
      },
    ],
  },
  {
    id: "co-std-10", number: 10, title: "التخطيط المهني والتعليمي", weight: 5, color: "#CA8A04", icon: "🎓",
    items: [
      {
        id: "co-10-1", text: "يساعد المتعلمين على التخطيط المهني والتعليمي",
        subItems: [
          { id: "co-10-1-1", title: "تقديم برامج الإرشاد المهني", suggestedEvidence: ["خطة الإرشاد المهني"] },
          { id: "co-10-1-2", title: "مساعدة الطلاب في اختيار التخصصات", suggestedEvidence: ["سجل الاستشارات"] },
        ],
        suggestedEvidence: ["خطة الإرشاد المهني", "تقارير التنفيذ"],
      },
    ],
  },
  {
    id: "co-std-11", number: 11, title: "تعزيز التفوق الدراسي", weight: 5, color: "#059669", icon: "🏆",
    items: [
      {
        id: "co-11-1", text: "يعزز التفوق الدراسي",
        subItems: [
          { id: "co-11-1-1", title: "تكريم المتفوقين دراسياً", suggestedEvidence: ["صور التكريم", "شهادات التقدير"] },
          { id: "co-11-1-2", title: "تنفيذ برامج رعاية المتفوقين", suggestedEvidence: ["خطة رعاية المتفوقين"] },
        ],
        suggestedEvidence: ["خطة رعاية المتفوقين", "صور التكريم"],
      },
    ],
  },
  {
    id: "co-std-12", number: 12, title: "تدخلات للمتأخرين دراسياً", weight: 5, color: "#7C3AED", icon: "📖",
    items: [
      {
        id: "co-12-1", text: "يقدم تدخلات تربوية للمتأخرين دراسياً والمعيدين",
        subItems: [
          { id: "co-12-1-1", title: "حصر الطلاب المتأخرين دراسياً", suggestedEvidence: ["كشوف الطلاب المتأخرين"] },
          { id: "co-12-1-2", title: "تنفيذ خطط علاجية فردية", suggestedEvidence: ["خطط العلاج الفردية", "تقارير المتابعة"] },
        ],
        suggestedEvidence: ["كشوف المتأخرين دراسياً", "خطط العلاج"],
      },
    ],
  },
  {
    id: "co-std-13", number: 13, title: "توعية بقواعد السلوك والمواظبة", weight: 5, color: "#0891B2", icon: "📢",
    items: [
      {
        id: "co-13-1", text: "توعية المتعلمين وأولياء أمورهم بقواعد السلوك والمواظبة",
        subItems: [
          { id: "co-13-1-1", title: "تنفيذ برامج توعوية بقواعد السلوك", suggestedEvidence: ["نشرات توعوية", "صور الفعاليات"] },
          { id: "co-13-1-2", title: "إشراك أولياء الأمور في التوعية", suggestedEvidence: ["رسائل أولياء الأمور", "محاضر الاجتماعات"] },
        ],
        suggestedEvidence: ["نشرات التوعية", "تقارير التنفيذ"],
      },
    ],
  },
];

// ===== 4. الموجه الصحي (14 عنصر = 11 مشترك + 3 خاص) =====
export const HEALTH_COUNSELOR_STANDARDS: Standard[] = [
  {
    id: "hc-std-1", number: 1, title: "أداء الواجبات الوظيفية", weight: 10, color: "#DC2626", icon: "📋",
    items: [
      {
        id: "hc-1-1", text: "يطبق الأنظمة وقواعد السلوك الوظيفية",
        subItems: [
          { id: "hc-1-1-1", title: "الالتزام بالأنظمة واللوائح", suggestedEvidence: ["تقرير الالتزام"] },
          { id: "hc-1-1-2", title: "تعزيز القيم المهنية والصحية", suggestedEvidence: ["صور الفعاليات الصحية"] },
        ],
        suggestedEvidence: ["تقرير الالتزام بالأنظمة"],
      },
    ],
  },
  {
    id: "hc-std-2", number: 2, title: "التفاعل مع المجتمع المهني", weight: 10, color: "#059669", icon: "🤝",
    items: [
      { id: "hc-2-1", text: "المشاركة الفعالة في مجتمعات التعليم", subItems: [
        { id: "hc-2-1-1", title: "المشاركة في الدورات الصحية والتعليمية", suggestedEvidence: ["شهادات حضور"] },
      ], suggestedEvidence: ["شهادات الدورات"] },
    ],
  },
  {
    id: "hc-std-3", number: 3, title: "التفاعل مع أولياء الأمور", weight: 5, color: "#0891B2", icon: "👨‍👩‍👧",
    items: [
      { id: "hc-3-1", text: "التواصل مع أولياء الأمور بشأن الحالات الصحية", subItems: [
        { id: "hc-3-1-1", title: "إبلاغ أولياء الأمور بالحالات الصحية", suggestedEvidence: ["سجل التواصل"] },
        { id: "hc-3-1-2", title: "التوعية الصحية لأولياء الأمور", suggestedEvidence: ["نشرات صحية"] },
      ], suggestedEvidence: ["سجل التواصل", "نشرات التوعية"] },
    ],
  },
  {
    id: "hc-std-4", number: 4, title: "التنويع في استراتيجيات التدريس", weight: 5, color: "#7C3AED", icon: "📚",
    items: [
      { id: "hc-4-1", text: "استخدام أساليب تدريس مناسبة", subItems: [
        { id: "hc-4-1-1", title: "استخدام استراتيجيات تدريس متنوعة", suggestedEvidence: ["نماذج من الدروس"] },
      ], suggestedEvidence: ["نماذج التحضير"] },
    ],
  },
  {
    id: "hc-std-5", number: 5, title: "تحسين نتائج المتعلمين", weight: 5, color: "#CA8A04", icon: "📈",
    items: [
      { id: "hc-5-1", text: "تحسين التحصيل الدراسي للمتعلمين", subItems: [
        { id: "hc-5-1-1", title: "معالجة نقاط الضعف وتطوير نقاط القوة", suggestedEvidence: ["خطط التحسين"] },
      ], suggestedEvidence: ["تقارير النتائج"] },
    ],
  },
  {
    id: "hc-std-6", number: 6, title: "إعداد وتنفيذ خطة التعلم", weight: 5, color: "#059669", icon: "📝",
    items: [
      { id: "hc-6-1", text: "إعداد خطة منظمة للتعلم", subItems: [
        { id: "hc-6-1-1", title: "إعداد خطة التعلم وفق السياسات المنظمة", suggestedEvidence: ["خطة التعلم"] },
      ], suggestedEvidence: ["خطة التعلم المعتمدة"] },
    ],
  },
  {
    id: "hc-std-7", number: 7, title: "توظيف تقنيات ووسائل التعلم", weight: 5, color: "#DC2626", icon: "💻",
    items: [
      { id: "hc-7-1", text: "استخدام الوسائل التعليمية المناسبة", subItems: [
        { id: "hc-7-1-1", title: "توظيف التقنيات التعليمية", suggestedEvidence: ["صور استخدام التقنيات"] },
      ], suggestedEvidence: ["تقارير استخدام التقنيات"] },
    ],
  },
  {
    id: "hc-std-8", number: 8, title: "تهيئة بيئة تعليمية", weight: 5, color: "#7C3AED", icon: "🏫",
    items: [
      { id: "hc-8-1", text: "تهيئة بيئة تعليمية آمنة ومحفزة", subItems: [
        { id: "hc-8-1-1", title: "توفير بيئة تعليمية صحية وآمنة", suggestedEvidence: ["صور البيئة الصفية"] },
      ], suggestedEvidence: ["تقارير البيئة التعليمية"] },
    ],
  },
  {
    id: "hc-std-9", number: 9, title: "الإدارة الصفية", weight: 5, color: "#0891B2", icon: "🎓",
    items: [
      { id: "hc-9-1", text: "إدارة الصف بفاعلية", subItems: [
        { id: "hc-9-1-1", title: "مراعاة الفروق الفردية وتنظيم الصف", suggestedEvidence: ["خطة الإدارة الصفية"] },
      ], suggestedEvidence: ["تقارير الإدارة الصفية"] },
    ],
  },
  {
    id: "hc-std-10", number: 10, title: "تحليل نتائج المتعلمين", weight: 10, color: "#CA8A04", icon: "📊",
    items: [
      { id: "hc-10-1", text: "تحليل نتائج المتعلمين وتشخيص مستوياتهم", subItems: [
        { id: "hc-10-1-1", title: "تحليل البيانات وتقديم تغذية راجعة", suggestedEvidence: ["تقارير التحليل"] },
      ], suggestedEvidence: ["تقارير تحليل النتائج"] },
    ],
  },
  {
    id: "hc-std-11", number: 11, title: "تنوع أساليب التقويم", weight: 5, color: "#059669", icon: "📝",
    items: [
      { id: "hc-11-1", text: "استخدام أساليب تقويم متنوعة", subItems: [
        { id: "hc-11-1-1", title: "توظيف أدوات تقويم متعددة", suggestedEvidence: ["نماذج التقويم"] },
      ], suggestedEvidence: ["أدوات التقويم المتنوعة"] },
    ],
  },
  // === العناصر الخاصة بالموجه الصحي ===
  {
    id: "hc-std-12", number: 12, title: "تنفيذ الخطة المشتركة للبرامج الصحية المدرسية", weight: 15, color: "#DC2626", icon: "🏥",
    items: [
      {
        id: "hc-12-1", text: "تنفيذ الخطة المشتركة للبرامج الصحية المدرسية",
        subItems: [
          { id: "hc-12-1-1", title: "إعداد وتنفيذ خطة البرامج الصحية السنوية", suggestedEvidence: ["الخطة الصحية المعتمدة", "تقارير التنفيذ"] },
          { id: "hc-12-1-2", title: "تنفيذ برامج التوعية الصحية للطلاب", suggestedEvidence: ["صور الفعاليات", "نشرات صحية"] },
          { id: "hc-12-1-3", title: "التنسيق مع الجهات الصحية المعنية", suggestedEvidence: ["خطابات التنسيق", "محاضر الاجتماعات"] },
        ],
        suggestedEvidence: ["الخطة الصحية السنوية", "تقارير تنفيذ البرامج الصحية"],
      },
    ],
  },
  {
    id: "hc-std-13", number: 13, title: "حصر الحالات الصحية للمتعلمين", weight: 5, color: "#F97316", icon: "📋",
    items: [
      {
        id: "hc-13-1", text: "حصر الحالات الصحية للمتعلمين",
        subItems: [
          { id: "hc-13-1-1", title: "حصر وتوثيق الحالات الصحية المزمنة", suggestedEvidence: ["سجل الحالات الصحية", "كشوف الحصر"] },
          { id: "hc-13-1-2", title: "متابعة الحالات الصحية بشكل دوري", suggestedEvidence: ["تقارير المتابعة", "سجل الزيارات"] },
        ],
        suggestedEvidence: ["سجل الحالات الصحية", "تقارير المتابعة الدورية"],
      },
    ],
  },
  {
    id: "hc-std-14", number: 14, title: "تهيئة البيئة الصحية المدرسية", weight: 10, color: "#10B981", icon: "🌿",
    items: [
      {
        id: "hc-14-1", text: "تهيئة البيئة الصحية المدرسية",
        subItems: [
          { id: "hc-14-1-1", title: "متابعة نظافة المرافق المدرسية", suggestedEvidence: ["تقارير النظافة", "صور المرافق"] },
          { id: "hc-14-1-2", title: "التأكد من توفر مستلزمات الإسعافات الأولية", suggestedEvidence: ["قائمة المستلزمات", "صور الغرفة الصحية"] },
          { id: "hc-14-1-3", title: "متابعة سلامة المقصف المدرسي", suggestedEvidence: ["تقارير المتابعة", "نماذج الفحص"] },
        ],
        suggestedEvidence: ["تقارير البيئة الصحية", "صور المرافق الصحية"],
      },
    ],
  },
];

// ===== 5. رائد النشاط / معلم مسند له نشاط طلابي (15 عنصر) =====
export const ACTIVITY_LEADER_STANDARDS: Standard[] = [
  {
    id: "al-std-1", number: 1, title: "أداء الواجبات الوظيفية", weight: 10, color: "#F97316", icon: "📋",
    items: [
      { id: "al-1-1", text: "يطبق الأنظمة وقواعد السلوك الوظيفية", subItems: [
        { id: "al-1-1-1", title: "الالتزام بالأنظمة واللوائح", suggestedEvidence: ["تقرير الالتزام"] },
        { id: "al-1-1-2", title: "تعزيز القيم الوطنية", suggestedEvidence: ["صور الفعاليات الوطنية"] },
      ], suggestedEvidence: ["تقرير الالتزام بالأنظمة"] },
    ],
  },
  {
    id: "al-std-2", number: 2, title: "التفاعل مع المجتمع المهني", weight: 10, color: "#059669", icon: "🤝",
    items: [
      { id: "al-2-1", text: "المشاركة الفعالة في مجتمعات التعليم", subItems: [
        { id: "al-2-1-1", title: "المشاركة في الدورات والورش", suggestedEvidence: ["شهادات حضور"] },
      ], suggestedEvidence: ["شهادات الدورات"] },
    ],
  },
  {
    id: "al-std-3", number: 3, title: "التفاعل مع أولياء الأمور", weight: 10, color: "#0891B2", icon: "👨‍👩‍👧",
    items: [
      { id: "al-3-1", text: "التواصل مع أولياء الأمور", subItems: [
        { id: "al-3-1-1", title: "تفعيل قنوات التواصل", suggestedEvidence: ["سجل التواصل"] },
      ], suggestedEvidence: ["سجل التواصل"] },
    ],
  },
  {
    id: "al-std-4", number: 4, title: "التنويع في استراتيجيات التدريس", weight: 5, color: "#7C3AED", icon: "📚",
    items: [
      { id: "al-4-1", text: "استخدام أساليب تدريس متنوعة", subItems: [
        { id: "al-4-1-1", title: "استخدام استراتيجيات تدريس مناسبة", suggestedEvidence: ["نماذج التحضير"] },
      ], suggestedEvidence: ["نماذج الدروس"] },
    ],
  },
  {
    id: "al-std-5", number: 5, title: "تحسين نتائج المتعلمين", weight: 5, color: "#CA8A04", icon: "📈",
    items: [
      { id: "al-5-1", text: "تحسين التحصيل الدراسي", subItems: [
        { id: "al-5-1-1", title: "معالجة نقاط الضعف", suggestedEvidence: ["خطط التحسين"] },
      ], suggestedEvidence: ["تقارير النتائج"] },
    ],
  },
  {
    id: "al-std-6", number: 6, title: "إعداد وتنفيذ خطة التعلم", weight: 5, color: "#059669", icon: "📝",
    items: [
      { id: "al-6-1", text: "إعداد خطة منظمة للتعلم", subItems: [
        { id: "al-6-1-1", title: "إعداد خطة التعلم", suggestedEvidence: ["خطة التعلم"] },
      ], suggestedEvidence: ["خطة التعلم المعتمدة"] },
    ],
  },
  {
    id: "al-std-7", number: 7, title: "توظيف تقنيات ووسائل التعلم", weight: 5, color: "#DC2626", icon: "💻",
    items: [
      { id: "al-7-1", text: "استخدام الوسائل التعليمية المناسبة", subItems: [
        { id: "al-7-1-1", title: "توظيف التقنيات التعليمية", suggestedEvidence: ["صور استخدام التقنيات"] },
      ], suggestedEvidence: ["تقارير استخدام التقنيات"] },
    ],
  },
  {
    id: "al-std-8", number: 8, title: "تهيئة بيئة تعليمية", weight: 5, color: "#7C3AED", icon: "🏫",
    items: [
      { id: "al-8-1", text: "تهيئة بيئة تعليمية آمنة", subItems: [
        { id: "al-8-1-1", title: "توفير بيئة تعليمية محفزة", suggestedEvidence: ["صور البيئة الصفية"] },
      ], suggestedEvidence: ["تقارير البيئة التعليمية"] },
    ],
  },
  {
    id: "al-std-9", number: 9, title: "الإدارة الصفية", weight: 5, color: "#0891B2", icon: "🎓",
    items: [
      { id: "al-9-1", text: "إدارة الصف بفاعلية", subItems: [
        { id: "al-9-1-1", title: "مراعاة الفروق الفردية", suggestedEvidence: ["خطة الإدارة الصفية"] },
      ], suggestedEvidence: ["تقارير الإدارة الصفية"] },
    ],
  },
  {
    id: "al-std-10", number: 10, title: "تحليل نتائج المتعلمين", weight: 5, color: "#CA8A04", icon: "📊",
    items: [
      { id: "al-10-1", text: "تحليل نتائج المتعلمين وتشخيص مستوياتهم", subItems: [
        { id: "al-10-1-1", title: "تحليل البيانات", suggestedEvidence: ["تقارير التحليل"] },
      ], suggestedEvidence: ["تقارير تحليل النتائج"] },
    ],
  },
  {
    id: "al-std-11", number: 11, title: "تنوع أساليب التقويم", weight: 5, color: "#059669", icon: "📝",
    items: [
      { id: "al-11-1", text: "استخدام أساليب تقويم متنوعة", subItems: [
        { id: "al-11-1-1", title: "توظيف أدوات تقويم متعددة", suggestedEvidence: ["نماذج التقويم"] },
      ], suggestedEvidence: ["أدوات التقويم المتنوعة"] },
    ],
  },
  // === العناصر الخاصة بالنشاط الطلابي ===
  {
    id: "al-std-12", number: 12, title: "إعداد خطة النشاط الطلابي", weight: 10, color: "#F97316", icon: "📋",
    items: [
      {
        id: "al-12-1", text: "إعداد خطة مزمنة ومعتمدة لبرامج وفعاليات النشاط الطلابي",
        subItems: [
          { id: "al-12-1-1", title: "إعداد الخطة السنوية للنشاط الطلابي", suggestedEvidence: ["الخطة السنوية المعتمدة", "الجدول الزمني"] },
          { id: "al-12-1-2", title: "تحديد البرامج والفعاليات المناسبة", suggestedEvidence: ["مصفوفة البرامج", "ميزانية الأنشطة"] },
          { id: "al-12-1-3", title: "التنسيق مع الجهات المعنية لتنفيذ الخطة", suggestedEvidence: ["خطابات التنسيق", "محاضر الاجتماعات"] },
        ],
        suggestedEvidence: ["الخطة السنوية للنشاط الطلابي", "الجدول الزمني المعتمد"],
      },
    ],
  },
  {
    id: "al-std-13", number: 13, title: "تهيئة البيئة المدرسية للأنشطة", weight: 5, color: "#10B981", icon: "🎨",
    items: [
      {
        id: "al-13-1", text: "تهيئة البيئة المدرسية للبرامج والأنشطة الطلابية",
        subItems: [
          { id: "al-13-1-1", title: "توفير المستلزمات والأدوات اللازمة للأنشطة", suggestedEvidence: ["قائمة المستلزمات", "صور التجهيزات"] },
          { id: "al-13-1-2", title: "تهيئة الأماكن المناسبة لتنفيذ الأنشطة", suggestedEvidence: ["صور الأماكن المهيأة", "تقارير التجهيز"] },
        ],
        suggestedEvidence: ["صور تهيئة البيئة المدرسية", "تقارير التجهيز"],
      },
    ],
  },
  {
    id: "al-std-14", number: 14, title: "دعم المتعلمين وفق احتياجاتهم", weight: 5, color: "#8B5CF6", icon: "🎯",
    items: [
      {
        id: "al-14-1", text: "يدعم المتعلمين وفق احتياجاتهم وميولهم للأنشطة",
        subItems: [
          { id: "al-14-1-1", title: "استطلاع ميول واحتياجات الطلاب", suggestedEvidence: ["استبانات الميول", "نتائج الاستطلاع"] },
          { id: "al-14-1-2", title: "توجيه الطلاب للأنشطة المناسبة لميولهم", suggestedEvidence: ["سجل توزيع الطلاب", "تقارير المتابعة"] },
        ],
        suggestedEvidence: ["استبانات ميول الطلاب", "سجل توزيع الطلاب على الأنشطة"],
      },
    ],
  },
  {
    id: "al-std-15", number: 15, title: "تحفيز المتعلمين على المشاركة", weight: 10, color: "#EF4444", icon: "🏆",
    items: [
      {
        id: "al-15-1", text: "يحفز المتعلمين على المشاركة في الأنشطة المدرسية",
        subItems: [
          { id: "al-15-1-1", title: "تنفيذ برامج تحفيزية للمشاركة في الأنشطة", suggestedEvidence: ["خطة التحفيز", "صور التكريم"] },
          { id: "al-15-1-2", title: "تكريم الطلاب المتميزين في الأنشطة", suggestedEvidence: ["شهادات التقدير", "صور التكريم"] },
          { id: "al-15-1-3", title: "نشر ثقافة المشاركة في الأنشطة", suggestedEvidence: ["نشرات توعوية", "إعلانات الأنشطة"] },
        ],
        suggestedEvidence: ["خطة التحفيز", "صور التكريم", "إحصائيات المشاركة"],
      },
    ],
  },
];

// ===== 6. محضر المختبر (13 عنصر) =====
export const LAB_TECHNICIAN_STANDARDS: Standard[] = [
  {
    id: "lt-std-1", number: 1, title: "أداء الواجبات الوظيفية", weight: 10, color: "#6366F1", icon: "📋",
    items: [
      { id: "lt-1-1", text: "يطبق الأنظمة وقواعد السلوك الوظيفية", subItems: [
        { id: "lt-1-1-1", title: "الالتزام بالأنظمة واللوائح", suggestedEvidence: ["تقرير الالتزام"] },
      ], suggestedEvidence: ["تقرير الالتزام بالأنظمة"] },
    ],
  },
  {
    id: "lt-std-2", number: 2, title: "التفاعل مع المجتمع المهني", weight: 10, color: "#059669", icon: "🤝",
    items: [
      { id: "lt-2-1", text: "المشاركة الفعالة في مجتمعات التعليم", subItems: [
        { id: "lt-2-1-1", title: "المشاركة في الدورات والورش", suggestedEvidence: ["شهادات حضور"] },
      ], suggestedEvidence: ["شهادات الدورات"] },
    ],
  },
  {
    id: "lt-std-3", number: 3, title: "التفاعل مع أولياء الأمور", weight: 10, color: "#0891B2", icon: "👨‍👩‍👧",
    items: [
      { id: "lt-3-1", text: "التواصل مع أولياء الأمور", subItems: [
        { id: "lt-3-1-1", title: "تفعيل قنوات التواصل", suggestedEvidence: ["سجل التواصل"] },
      ], suggestedEvidence: ["سجل التواصل"] },
    ],
  },
  {
    id: "lt-std-4", number: 4, title: "التنويع في استراتيجيات التدريس", weight: 10, color: "#7C3AED", icon: "📚",
    items: [
      { id: "lt-4-1", text: "دعم المعلمين في استراتيجيات التدريس العملية", subItems: [
        { id: "lt-4-1-1", title: "تجهيز التجارب العملية المناسبة", suggestedEvidence: ["سجل التجارب"] },
      ], suggestedEvidence: ["سجل التجارب العملية"] },
    ],
  },
  {
    id: "lt-std-5", number: 5, title: "تحسين نتائج المتعلمين", weight: 10, color: "#CA8A04", icon: "📈",
    items: [
      { id: "lt-5-1", text: "المساهمة في تحسين نتائج المتعلمين", subItems: [
        { id: "lt-5-1-1", title: "توفير بيئة عملية تدعم التعلم", suggestedEvidence: ["صور المختبر"] },
      ], suggestedEvidence: ["تقارير الأنشطة العملية"] },
    ],
  },
  // === العناصر الخاصة بمحضر المختبر ===
  {
    id: "lt-std-6", number: 6, title: "إعداد خطة يومية لأنشطة المختبر", weight: 5, color: "#6366F1", icon: "📋",
    items: [
      {
        id: "lt-6-1", text: "يعد خطة يومية لأنشطة المختبر",
        subItems: [
          { id: "lt-6-1-1", title: "إعداد الجدول اليومي للتجارب والأنشطة", suggestedEvidence: ["الجدول اليومي", "خطة الأنشطة"] },
          { id: "lt-6-1-2", title: "التنسيق مع المعلمين حول التجارب المطلوبة", suggestedEvidence: ["سجل التنسيق", "محاضر الاجتماعات"] },
        ],
        suggestedEvidence: ["الخطة اليومية للمختبر", "سجل التنسيق مع المعلمين"],
      },
    ],
  },
  {
    id: "lt-std-7", number: 7, title: "المعرفة بالأسس والمفاهيم الفنية", weight: 5, color: "#059669", icon: "🔬",
    items: [
      {
        id: "lt-7-1", text: "المعرفة بالأسس والمفاهيم الفنية",
        subItems: [
          { id: "lt-7-1-1", title: "الإلمام بأساسيات التجارب العلمية", suggestedEvidence: ["شهادات التدريب", "سجل التجارب"] },
          { id: "lt-7-1-2", title: "معرفة خصائص المواد الكيميائية والأجهزة", suggestedEvidence: ["دليل المواد", "سجل الأجهزة"] },
        ],
        suggestedEvidence: ["شهادات التدريب الفني", "سجل المعرفة الفنية"],
      },
    ],
  },
  {
    id: "lt-std-8", number: 8, title: "توفير مستلزمات التجارب العلمية", weight: 5, color: "#DC2626", icon: "🧪",
    items: [
      {
        id: "lt-8-1", text: "يوفر المستلزمات اللازمة لأداء التجارب العلمية",
        subItems: [
          { id: "lt-8-1-1", title: "جرد المواد والأدوات المتوفرة", suggestedEvidence: ["كشف الجرد", "قائمة المواد"] },
          { id: "lt-8-1-2", title: "طلب المواد والأدوات الناقصة", suggestedEvidence: ["طلبات الشراء", "محاضر الاستلام"] },
        ],
        suggestedEvidence: ["كشف جرد المواد", "طلبات الشراء"],
      },
    ],
  },
  {
    id: "lt-std-9", number: 9, title: "السلامة المهنية", weight: 5, color: "#F97316", icon: "⚠️",
    items: [
      {
        id: "lt-9-1", text: "يلتزم بسياسات وإجراءات السلامة المهنية",
        subItems: [
          { id: "lt-9-1-1", title: "تطبيق إجراءات السلامة في المختبر", suggestedEvidence: ["لوحات السلامة", "سجل الحوادث"] },
          { id: "lt-9-1-2", title: "توفير أدوات السلامة والحماية", suggestedEvidence: ["قائمة أدوات السلامة", "صور التجهيزات"] },
          { id: "lt-9-1-3", title: "تدريب الطلاب على إجراءات السلامة", suggestedEvidence: ["خطة التدريب", "صور التدريب"] },
        ],
        suggestedEvidence: ["سجل السلامة المهنية", "صور أدوات السلامة"],
      },
    ],
  },
  {
    id: "lt-std-10", number: 10, title: "تحضير وتجهيز المختبر", weight: 5, color: "#7C3AED", icon: "🔧",
    items: [
      {
        id: "lt-10-1", text: "يحضر ويجهز المختبر",
        subItems: [
          { id: "lt-10-1-1", title: "تجهيز المختبر قبل الحصص العملية", suggestedEvidence: ["صور التجهيز", "سجل التحضير"] },
          { id: "lt-10-1-2", title: "ترتيب وتنظيف المختبر بعد الاستخدام", suggestedEvidence: ["صور النظافة", "سجل الصيانة"] },
        ],
        suggestedEvidence: ["سجل تحضير المختبر", "صور التجهيز"],
      },
    ],
  },
  {
    id: "lt-std-11", number: 11, title: "تهيئة وتسليم الأجهزة", weight: 5, color: "#0891B2", icon: "📦",
    items: [
      {
        id: "lt-11-1", text: "تهيئة وتسليم الأجهزة المطلوبة للمعلمين وتخزينها بطريقة سليمة",
        subItems: [
          { id: "lt-11-1-1", title: "تسليم الأجهزة والمواد للمعلمين", suggestedEvidence: ["سجل التسليم", "نماذج الاستلام"] },
          { id: "lt-11-1-2", title: "تخزين الأجهزة والمواد بطريقة سليمة", suggestedEvidence: ["صور التخزين", "سجل المستودع"] },
        ],
        suggestedEvidence: ["سجل تسليم الأجهزة", "صور التخزين"],
      },
    ],
  },
  {
    id: "lt-std-12", number: 12, title: "تقرير أنشطة ومهام المختبر الأسبوعية", weight: 10, color: "#CA8A04", icon: "📊",
    items: [
      {
        id: "lt-12-1", text: "يعد تقرير أنشطة ومهام المختبر الأسبوعية",
        subItems: [
          { id: "lt-12-1-1", title: "إعداد تقرير أسبوعي شامل عن أنشطة المختبر", suggestedEvidence: ["التقارير الأسبوعية", "سجل الأنشطة"] },
          { id: "lt-12-1-2", title: "توثيق التجارب المنفذة ونتائجها", suggestedEvidence: ["سجل التجارب", "صور التجارب"] },
        ],
        suggestedEvidence: ["التقارير الأسبوعية للمختبر", "سجل الأنشطة"],
      },
    ],
  },
  {
    id: "lt-std-13", number: 13, title: "تقارير دورية عن الأجهزة والمعدات", weight: 10, color: "#DC2626", icon: "📝",
    items: [
      {
        id: "lt-13-1", text: "يعد تقارير دورية عن حالة الأجهزة والمعدات",
        subItems: [
          { id: "lt-13-1-1", title: "فحص الأجهزة والمعدات دورياً", suggestedEvidence: ["سجل الفحص", "تقارير الصيانة"] },
          { id: "lt-13-1-2", title: "إعداد تقارير عن الأجهزة التالفة والمطلوب صيانتها", suggestedEvidence: ["تقارير الأعطال", "طلبات الصيانة"] },
          { id: "lt-13-1-3", title: "متابعة عمليات الصيانة والإصلاح", suggestedEvidence: ["سجل الصيانة", "محاضر الاستلام"] },
        ],
        suggestedEvidence: ["تقارير حالة الأجهزة", "سجل الصيانة"],
      },
    ],
  },
];

// ===== 7. معلمة رياض الأطفال (19 عنصر) =====
export const KINDERGARTEN_STANDARDS: Standard[] = [
  {
    id: "kg-std-1", number: 1, title: "أداء الواجبات الوظيفية", weight: 10, color: "#EC4899", icon: "📋",
    items: [
      { id: "kg-1-1", text: "يطبق الأنظمة وقواعد السلوك الوظيفية", subItems: [
        { id: "kg-1-1-1", title: "الالتزام بالأنظمة واللوائح", suggestedEvidence: ["تقرير الالتزام"] },
        { id: "kg-1-1-2", title: "تعزيز القيم المهنية", suggestedEvidence: ["صور الفعاليات"] },
      ], suggestedEvidence: ["تقرير الالتزام بالأنظمة"] },
    ],
  },
  {
    id: "kg-std-2", number: 2, title: "التفاعل مع المجتمع المهني", weight: 5, color: "#059669", icon: "🤝",
    items: [
      { id: "kg-2-1", text: "المشاركة الفعالة في مجتمعات التعليم", subItems: [
        { id: "kg-2-1-1", title: "المشاركة في الدورات والورش", suggestedEvidence: ["شهادات حضور"] },
      ], suggestedEvidence: ["شهادات الدورات"] },
    ],
  },
  {
    id: "kg-std-3", number: 3, title: "التفاعل مع أولياء الأمور", weight: 5, color: "#0891B2", icon: "👨‍👩‍👧",
    items: [
      { id: "kg-3-1", text: "التواصل مع أولياء الأمور", subItems: [
        { id: "kg-3-1-1", title: "تفعيل قنوات التواصل", suggestedEvidence: ["سجل التواصل"] },
      ], suggestedEvidence: ["سجل التواصل"] },
    ],
  },
  {
    id: "kg-std-4", number: 4, title: "التنويع في استراتيجيات التدريس", weight: 5, color: "#7C3AED", icon: "📚",
    items: [
      { id: "kg-4-1", text: "استخدام أساليب تدريس مناسبة لرياض الأطفال", subItems: [
        { id: "kg-4-1-1", title: "استخدام استراتيجيات تعلم من خلال اللعب", suggestedEvidence: ["صور الأنشطة"] },
      ], suggestedEvidence: ["نماذج الأنشطة التعليمية"] },
    ],
  },
  {
    id: "kg-std-5", number: 5, title: "تحسين نتائج المتعلمين", weight: 5, color: "#CA8A04", icon: "📈",
    items: [
      { id: "kg-5-1", text: "تحسين مخرجات التعلم للأطفال", subItems: [
        { id: "kg-5-1-1", title: "متابعة تقدم الأطفال", suggestedEvidence: ["سجل الملاحظات"] },
      ], suggestedEvidence: ["تقارير تقدم الأطفال"] },
    ],
  },
  {
    id: "kg-std-6", number: 6, title: "إعداد خطة شاملة وتفصيلية للأنشطة", weight: 5, color: "#EC4899", icon: "📋",
    items: [
      {
        id: "kg-6-1", text: "إعداد خطة شاملة وتفصيلية للأنشطة",
        subItems: [
          { id: "kg-6-1-1", title: "إعداد الخطة الأسبوعية والشهرية للأنشطة", suggestedEvidence: ["الخطة الأسبوعية", "الخطة الشهرية"] },
          { id: "kg-6-1-2", title: "تضمين أنشطة متنوعة تناسب المراحل النمائية", suggestedEvidence: ["مصفوفة الأنشطة", "صور التنفيذ"] },
        ],
        suggestedEvidence: ["خطة الأنشطة الشاملة", "الجدول الزمني"],
      },
    ],
  },
  {
    id: "kg-std-7", number: 7, title: "تصميم خبرات تعلم مرنة ومبتكرة", weight: 5, color: "#F97316", icon: "🎨",
    items: [
      {
        id: "kg-7-1", text: "تصميم خبرات تعلم مرنة ومبتكرة",
        subItems: [
          { id: "kg-7-1-1", title: "تصميم أنشطة إبداعية تناسب الأطفال", suggestedEvidence: ["نماذج الأنشطة", "صور التنفيذ"] },
          { id: "kg-7-1-2", title: "دمج التعلم باللعب في الخبرات التعليمية", suggestedEvidence: ["خطط الأنشطة", "صور اللعب التعليمي"] },
        ],
        suggestedEvidence: ["نماذج خبرات التعلم المبتكرة", "صور التنفيذ"],
      },
    ],
  },
  {
    id: "kg-std-8", number: 8, title: "توظيف تقنيات ووسائل التعلم", weight: 5, color: "#059669", icon: "💻",
    items: [
      { id: "kg-8-1", text: "توظيف تقنيات ووسائل التعلم المناسبة للأطفال", subItems: [
        { id: "kg-8-1-1", title: "استخدام وسائل تعليمية مناسبة لعمر الأطفال", suggestedEvidence: ["صور الوسائل"] },
      ], suggestedEvidence: ["صور استخدام الوسائل التعليمية"] },
    ],
  },
  {
    id: "kg-std-9", number: 9, title: "التمكن من المادة العلمية", weight: 5, color: "#7C3AED", icon: "📖",
    items: [
      { id: "kg-9-1", text: "التمكن من المادة العلمية", subItems: [
        { id: "kg-9-1-1", title: "الإلمام بمحتوى المنهج ومتطلباته", suggestedEvidence: ["شهادات التدريب"] },
      ], suggestedEvidence: ["شهادات التدريب والتأهيل"] },
    ],
  },
  {
    id: "kg-std-10", number: 10, title: "استخدام استراتيجيات تدريس فاعلة", weight: 5, color: "#DC2626", icon: "🎯",
    items: [
      { id: "kg-10-1", text: "استخدام استراتيجيات تدريس فاعلة ومتنوعة", subItems: [
        { id: "kg-10-1-1", title: "تطبيق استراتيجيات تعلم نشط", suggestedEvidence: ["نماذج التحضير", "صور التنفيذ"] },
      ], suggestedEvidence: ["نماذج التحضير"] },
    ],
  },
  {
    id: "kg-std-11", number: 11, title: "إشراك الأسرة في خطط النمو والتعلم", weight: 5, color: "#0891B2", icon: "👨‍👩‍👧",
    items: [
      {
        id: "kg-11-1", text: "إشراك الأسرة في خطط النمو والتعلم",
        subItems: [
          { id: "kg-11-1-1", title: "التواصل المستمر مع الأسرة حول تقدم الطفل", suggestedEvidence: ["سجل التواصل", "تقارير التقدم"] },
          { id: "kg-11-1-2", title: "إشراك الأسرة في الأنشطة التعليمية", suggestedEvidence: ["دعوات المشاركة", "صور الفعاليات"] },
        ],
        suggestedEvidence: ["سجل التواصل مع الأسر", "تقارير التقدم"],
      },
    ],
  },
  {
    id: "kg-std-12", number: 12, title: "تهيئة بيئة تعليمية آمنة ومعززة للتطور النمائي", weight: 5, color: "#EC4899", icon: "🏠",
    items: [
      {
        id: "kg-12-1", text: "تهيئ بيئة تعليمية آمنة ومعززة للتطور النمائي",
        subItems: [
          { id: "kg-12-1-1", title: "توفير بيئة آمنة ومحفزة للأطفال", suggestedEvidence: ["صور البيئة الصفية", "تقارير السلامة"] },
          { id: "kg-12-1-2", title: "تنظيم الأركان التعليمية المتنوعة", suggestedEvidence: ["صور الأركان", "خطة الأركان"] },
        ],
        suggestedEvidence: ["صور البيئة الصفية", "خطة الأركان التعليمية"],
      },
    ],
  },
  {
    id: "kg-std-13", number: 13, title: "توفير فرص لدعم التفاعلات", weight: 5, color: "#F97316", icon: "🤝",
    items: [
      { id: "kg-13-1", text: "توفير فرص متنوعة لدعم التفاعلات في بيئة التعلم", subItems: [
        { id: "kg-13-1-1", title: "تصميم أنشطة تعاونية بين الأطفال", suggestedEvidence: ["صور الأنشطة التعاونية"] },
      ], suggestedEvidence: ["صور الأنشطة التعاونية"] },
    ],
  },
  {
    id: "kg-std-14", number: 14, title: "تقويم تعلم المتعلمين ومتابعة تقدمهم", weight: 5, color: "#059669", icon: "📊",
    items: [
      { id: "kg-14-1", text: "تقوّم تعلم المتعلمين وتتابع تقدمهم بانتظام", subItems: [
        { id: "kg-14-1-1", title: "استخدام أدوات تقويم مناسبة لعمر الأطفال", suggestedEvidence: ["نماذج التقويم", "سجل الملاحظات"] },
      ], suggestedEvidence: ["سجل تقويم الأطفال"] },
    ],
  },
  {
    id: "kg-std-15", number: 15, title: "استثمار نتائج التقويم في تعزيز النمو", weight: 5, color: "#7C3AED", icon: "📈",
    items: [
      { id: "kg-15-1", text: "تستثمر نتائج التقويم في تعزيز النمو والتعلم", subItems: [
        { id: "kg-15-1-1", title: "تحليل نتائج التقويم وتطوير الخطط", suggestedEvidence: ["تقارير التحليل"] },
      ], suggestedEvidence: ["تقارير تحليل نتائج التقويم"] },
    ],
  },
  {
    id: "kg-std-16", number: 16, title: "إشراك الأسرة في نتائج التقويم", weight: 5, color: "#DC2626", icon: "📬",
    items: [
      { id: "kg-16-1", text: "تشرك الأسرة في نتائج التقويم", subItems: [
        { id: "kg-16-1-1", title: "مشاركة نتائج التقويم مع الأسرة", suggestedEvidence: ["تقارير التقدم المرسلة"] },
      ], suggestedEvidence: ["تقارير التقدم المرسلة للأسر"] },
    ],
  },
  {
    id: "kg-std-17", number: 17, title: "دعم مستويات الأداء المستهدفة", weight: 5, color: "#0891B2", icon: "🎯",
    items: [
      { id: "kg-17-1", text: "تدعم مستويات الأداء المستهدفة لكل متعلم", subItems: [
        { id: "kg-17-1-1", title: "وضع أهداف فردية لكل طفل", suggestedEvidence: ["خطط فردية"] },
      ], suggestedEvidence: ["خطط الأداء الفردية"] },
    ],
  },
  {
    id: "kg-std-18", number: 18, title: "دعم مهارات المستقبل", weight: 5, color: "#CA8A04", icon: "🚀",
    items: [
      { id: "kg-18-1", text: "تدعم مهارات المستقبل لدى المتعلمين", subItems: [
        { id: "kg-18-1-1", title: "تنمية مهارات التفكير والإبداع", suggestedEvidence: ["أنشطة التفكير الإبداعي"] },
      ], suggestedEvidence: ["أنشطة مهارات المستقبل"] },
    ],
  },
  {
    id: "kg-std-19", number: 19, title: "دعم اكتساب القيم والمبادئ", weight: 5, color: "#EC4899", icon: "⭐",
    items: [
      { id: "kg-19-1", text: "تدعم اكتساب المتعلمين القيم والمبادئ والاتجاهات", subItems: [
        { id: "kg-19-1-1", title: "تنفيذ أنشطة تعزز القيم الإيجابية", suggestedEvidence: ["صور الأنشطة", "خطة القيم"] },
      ], suggestedEvidence: ["خطة تعزيز القيم", "صور الأنشطة"] },
    ],
  },
];

// ===== 8. المشرف التربوي (8 جدارات سلوكية قيادية) =====
export const SUPERVISOR_STANDARDS: Standard[] = [
  {
    id: "sv-std-1", number: 1, title: "المسؤولية", weight: 15, color: "#CA8A04", icon: "🎯",
    items: [
      {
        id: "sv-1-1", text: "القدرة على تحمل المسؤولية الفردية لتحقيق الأهداف بالجودة المطلوبة وفي الوقت المحدد",
        subItems: [
          { id: "sv-1-1-1", title: "الالتزام بتحقيق الأهداف في الوقت المحدد", suggestedEvidence: ["تقارير الإنجاز", "خطط العمل"] },
          { id: "sv-1-1-2", title: "تحمل المسؤولية عن جودة المخرجات", suggestedEvidence: ["تقارير الجودة", "نتائج التقييم"] },
        ],
        suggestedEvidence: ["تقارير الإنجاز", "خطط العمل المنفذة"],
      },
    ],
  },
  {
    id: "sv-std-2", number: 2, title: "العمل الجماعي", weight: 10, color: "#059669", icon: "🤝",
    items: [
      {
        id: "sv-2-1", text: "القدرة على العمل بشكل جماعي وبروح الفريق الواحد",
        subItems: [
          { id: "sv-2-1-1", title: "المشاركة الفعالة في فرق العمل", suggestedEvidence: ["محاضر الاجتماعات", "تقارير الفرق"] },
          { id: "sv-2-1-2", title: "المحافظة على علاقات مهنية جيدة", suggestedEvidence: ["شهادات التقدير", "تقارير الأداء"] },
        ],
        suggestedEvidence: ["محاضر اجتماعات الفرق", "تقارير العمل الجماعي"],
      },
    ],
  },
  {
    id: "sv-std-3", number: 3, title: "المرونة للتغيير", weight: 10, color: "#7C3AED", icon: "🔄",
    items: [
      {
        id: "sv-3-1", text: "القدرة على التكيف والعمل بشكل فعال في مختلف الظروف",
        subItems: [
          { id: "sv-3-1-1", title: "التكيف مع المتغيرات والتحديات", suggestedEvidence: ["تقارير إدارة التغيير"] },
          { id: "sv-3-1-2", title: "فهم وجهات النظر المختلفة وقبول التغيير", suggestedEvidence: ["محاضر الحوار", "تقارير المبادرات"] },
        ],
        suggestedEvidence: ["تقارير إدارة التغيير", "مبادرات التطوير"],
      },
    ],
  },
  {
    id: "sv-std-4", number: 4, title: "المبادرة", weight: 10, color: "#F97316", icon: "💡",
    items: [
      {
        id: "sv-4-1", text: "القدرة على إظهار الحرص الكافي لتحقيق أهداف العمل والرغبة في إنجاز مهام إضافية",
        subItems: [
          { id: "sv-4-1-1", title: "تقديم أفكار ومقترحات جديدة", suggestedEvidence: ["وثائق المبادرات", "تقارير الأفكار"] },
          { id: "sv-4-1-2", title: "إنجاز مهام إضافية تخدم مصلحة العمل", suggestedEvidence: ["تقارير الإنجاز الإضافي"] },
        ],
        suggestedEvidence: ["وثائق المبادرات", "تقارير الإنجاز"],
      },
    ],
  },
  {
    id: "sv-std-5", number: 5, title: "قيادة التغيير", weight: 20, color: "#DC2626", icon: "🚀",
    items: [
      {
        id: "sv-5-1", text: "القدرة على حث الموظفين لتقبل التغيير المترتب على تطوير ومواجهة التحديات",
        subItems: [
          { id: "sv-5-1-1", title: "قيادة مبادرات التغيير والتطوير", suggestedEvidence: ["خطط التغيير", "تقارير التنفيذ"] },
          { id: "sv-5-1-2", title: "تحفيز المعلمين على تبني الممارسات الجديدة", suggestedEvidence: ["تقارير التدريب", "شهادات المشاركة"] },
        ],
        suggestedEvidence: ["خطط قيادة التغيير", "تقارير التنفيذ"],
      },
    ],
  },
  {
    id: "sv-std-6", number: 6, title: "تطوير وتمكين الموظفين", weight: 10, color: "#059669", icon: "📈",
    items: [
      {
        id: "sv-6-1", text: "تأهيل الموظفين وإعدادهم ومنحهم فرص التطوير والنمو",
        subItems: [
          { id: "sv-6-1-1", title: "تنفيذ برامج تدريبية للمعلمين", suggestedEvidence: ["خطة التدريب", "تقارير التنفيذ"] },
          { id: "sv-6-1-2", title: "تفويض الصلاحيات وإشراك المعلمين في صنع القرار", suggestedEvidence: ["محاضر الاجتماعات", "قرارات التفويض"] },
        ],
        suggestedEvidence: ["خطة تطوير المعلمين", "تقارير التدريب"],
      },
    ],
  },
  {
    id: "sv-std-7", number: 7, title: "التوجه الاستراتيجي", weight: 10, color: "#0891B2", icon: "🧭",
    items: [
      {
        id: "sv-7-1", text: "القدرة على تحليل المعطيات من منظور استراتيجي شامل",
        subItems: [
          { id: "sv-7-1-1", title: "وضع خطط بعيدة المدى مرتبطة بالأهداف الاستراتيجية", suggestedEvidence: ["الخطة الاستراتيجية", "مصفوفة الأهداف"] },
          { id: "sv-7-1-2", title: "ربط الأنشطة اليومية بالرسالة والأهداف", suggestedEvidence: ["تقارير الربط", "محاضر التخطيط"] },
        ],
        suggestedEvidence: ["الخطة الاستراتيجية", "تقارير التحليل"],
      },
    ],
  },
  {
    id: "sv-std-8", number: 8, title: "اتخاذ القرارات", weight: 15, color: "#7C3AED", icon: "⚖️",
    items: [
      {
        id: "sv-8-1", text: "القدرة على جمع البيانات والمعلومات وتحليلها والوصول إلى حلول فاعلة",
        subItems: [
          { id: "sv-8-1-1", title: "جمع وتحليل البيانات لاتخاذ قرارات مستنيرة", suggestedEvidence: ["تقارير التحليل", "بيانات الأداء"] },
          { id: "sv-8-1-2", title: "اتخاذ قرارات فاعلة في الوقت المناسب", suggestedEvidence: ["محاضر القرارات", "تقارير المتابعة"] },
        ],
        suggestedEvidence: ["تقارير التحليل", "محاضر القرارات"],
      },
    ],
  },
];

// ===== دالة مساعدة لجلب معايير أي وظيفة =====
export function getStandardsForJob(jobId: string): Standard[] {
  switch (jobId) {
    case "principal": return PRINCIPAL_STANDARDS;
    case "vice_principal": return VICE_PRINCIPAL_STANDARDS;
    case "counselor": return COUNSELOR_STANDARDS;
    case "health_counselor": return HEALTH_COUNSELOR_STANDARDS;
    case "activity_leader": return ACTIVITY_LEADER_STANDARDS;
    case "lab_technician": return LAB_TECHNICIAN_STANDARDS;
    case "kindergarten": return KINDERGARTEN_STANDARDS;
    case "supervisor": return SUPERVISOR_STANDARDS;
    case "special_ed": return SPECIAL_ED_STANDARDS;
    default: return [];
  }
}

// ===== 9. معلم/ة التربية الخاصة (11 معيار - نفس هيكل المعلم مع تعديل الشواهد الفرعية) =====
export const SPECIAL_ED_STANDARDS: Standard[] = [
  {
    id: "se-std-1", number: 1, title: "أداء الواجبات الوظيفية", weight: 10, color: "#059669", icon: "📋",
    items: [
      {
        id: "se-1-item-1", text: "التقيد بالدوام الرسمي",
        subItems: [
          { id: "se-1-1-1", title: "الالتزام بمواعيد الحضور والانصراف", suggestedEvidence: ["صورة من سجل الدوام الرسمي", "سجل البصمة الإلكتروني"] },
          { id: "se-1-1-2", title: "الالتزام بأوقات الحصص والجلسات الفردية", suggestedEvidence: ["جدول الحصص والجلسات", "تقرير المتابعة"] },
        ],
        suggestedEvidence: ["صورة من سجل الحضور والانصراف", "تقرير الالتزام بالدوام الرسمي"],
      },
      {
        id: "se-1-item-2", text: "تنفيذ الحصص والجلسات الفردية وفق الجدول",
        subItems: [
          { id: "se-1-2-1", title: "تنفيذ الحصص المقررة كاملة", suggestedEvidence: ["جدول الحصص الأسبوعي", "سجل تنفيذ الجلسات"] },
          { id: "se-1-2-2", title: "تنفيذ الجلسات الفردية حسب الخطة التعليمية الفردية", suggestedEvidence: ["سجل الجلسات الفردية", "خطة الجلسات"] },
        ],
        suggestedEvidence: ["جدول الحصص والجلسات", "سجل تنفيذ الجلسات الفردية"],
      },
      {
        id: "se-1-item-3", text: "المشاركة في الإشراف والمناوبة",
        subItems: [
          { id: "se-1-3-1", title: "المشاركة في المناوبة اليومية", suggestedEvidence: ["سجل المناوبة والإشراف اليومي"] },
          { id: "se-1-3-2", title: "الإشراف على الطلاب ذوي الإعاقة أثناء الفسح", suggestedEvidence: ["سجل الإشراف", "خطة الرعاية"] },
        ],
        suggestedEvidence: ["سجل المناوبة والإشراف", "جدول المناوبة المعتمد"],
      },
      {
        id: "se-1-item-4", text: "إعداد الخطة التعليمية الفردية (IEP) ومتابعتها",
        subItems: [
          { id: "se-1-4-1", title: "إعداد الخطة التعليمية الفردية لكل طالب", suggestedEvidence: ["نموذج الخطة التعليمية الفردية IEP", "أهداف قصيرة وطويلة المدى"] },
          { id: "se-1-4-2", title: "متابعة تنفيذ أهداف الخطة وتقييمها دورياً", suggestedEvidence: ["تقارير متابعة الأهداف", "سجل التقييم الدوري"] },
          { id: "se-1-4-3", title: "تحديث الخطة بناءً على نتائج التقييم", suggestedEvidence: ["نسخة محدثة من IEP", "محضر اجتماع فريق IEP"] },
        ],
        suggestedEvidence: ["نموذج الخطة التعليمية الفردية IEP", "تقارير المتابعة الدورية"],
      },
      {
        id: "se-1-item-5", text: "المشاركة في اللجان المدرسية ولجان التربية الخاصة",
        subItems: [
          { id: "se-1-5-1", title: "المشاركة في لجنة التربية الخاصة بالمدرسة", suggestedEvidence: ["قرار تشكيل اللجنة", "محاضر الاجتماعات"] },
          { id: "se-1-5-2", title: "المشاركة في فريق الدعم متعدد التخصصات", suggestedEvidence: ["محاضر اجتماعات الفريق", "تقارير الفريق"] },
        ],
        suggestedEvidence: ["قرار تشكيل اللجنة", "محاضر اجتماعات اللجان"],
      },
      {
        id: "se-1-item-6", text: "المشاركة في الأنشطة والمناسبات الوطنية والدولية (يوم الإعاقة)",
        subItems: [
          { id: "se-1-6-1", title: "تفعيل المناسبات الوطنية واليوم العالمي للإعاقة", suggestedEvidence: ["صور من الفعاليات", "تقرير عن المشاركة"] },
        ],
        suggestedEvidence: ["صور من الفعاليات", "تقرير المشاركة في المناسبات"],
      },
      {
        id: "se-1-item-7", text: "الالتزام بالسلوك المهني وأخلاقيات مهنة التربية الخاصة",
        subItems: [
          { id: "se-1-7-1", title: "الالتزام بميثاق أخلاقيات المهنة وسرية بيانات الطلاب", suggestedEvidence: ["صورة من ميثاق أخلاقيات المهنة", "خطاب شكر"] },
        ],
        suggestedEvidence: ["ميثاق أخلاقيات المهنة الموقع", "شهادة حسن السيرة والسلوك"],
      },
      {
        id: "se-1-item-8", text: "تفعيل المنصات الإلكترونية (مدرستي، نور، منصات التربية الخاصة)",
        subItems: [
          { id: "se-1-8-1", title: "استخدام منصة مدرستي ونظام نور لرصد بيانات الطلاب", suggestedEvidence: ["صور من المنصات", "تقرير الاستخدام"] },
        ],
        suggestedEvidence: ["صور من المنصات الإلكترونية", "تقرير استخدام المنصة"],
      },
    ],
  },
  {
    id: "se-std-2", number: 2, title: "التفاعل مع المجتمع المهني", weight: 10, color: "#7C3AED", icon: "🤝",
    items: [
      {
        id: "se-2-item-1", text: "المشاركة في مجتمعات التعلم المهنية للتربية الخاصة",
        subItems: [
          { id: "se-2-1-1", title: "حضور اجتماعات مجتمعات التعلم المهنية", suggestedEvidence: ["سجل مجتمعات التعلم", "محاضر الاجتماعات"] },
          { id: "se-2-1-2", title: "تقديم عروض وأوراق عمل متخصصة في التربية الخاصة", suggestedEvidence: ["أوراق عمل", "عروض تقديمية"] },
        ],
        suggestedEvidence: ["سجل مجتمعات التعلم المهنية", "محاضر الاجتماعات"],
      },
      {
        id: "se-2-item-2", text: "التعاون مع معلمي التعليم العام في برامج الدمج",
        subItems: [
          { id: "se-2-2-1", title: "تبادل الزيارات الصفية مع معلمي التعليم العام", suggestedEvidence: ["سجل الزيارات", "تقارير الزيارات"] },
          { id: "se-2-2-2", title: "تقديم الدعم والاستشارات لمعلمي الدمج", suggestedEvidence: ["سجل الاستشارات", "نماذج التكييف"] },
        ],
        suggestedEvidence: ["سجل الزيارات والتعاون", "تقارير برامج الدمج"],
      },
      {
        id: "se-2-item-3", text: "حضور الدورات والورش التدريبية المتخصصة",
        subItems: [
          { id: "se-2-3-1", title: "حضور دورات في مجال التربية الخاصة", suggestedEvidence: ["شهادات حضور الدورات المتخصصة"] },
          { id: "se-2-3-2", title: "تنفيذ ورش عمل تدريبية للزملاء", suggestedEvidence: ["تقرير تنفيذ الورشة", "قائمة الحضور"] },
        ],
        suggestedEvidence: ["شهادات حضور الدورات والورش التدريبية المتخصصة"],
      },
      {
        id: "se-2-item-4", text: "الإنتاج المعرفي المتخصص في التربية الخاصة",
        subItems: [
          { id: "se-2-4-1", title: "إعداد أدلة ونشرات توعوية عن الإعاقات", suggestedEvidence: ["نشرات توعوية", "أدلة إرشادية"] },
          { id: "se-2-4-2", title: "إعداد مواد تعليمية مكيّفة", suggestedEvidence: ["نماذج مواد تعليمية مكيّفة", "وسائل تعليمية معدّلة"] },
        ],
        suggestedEvidence: ["نشرات توعوية", "مواد تعليمية مكيّفة"],
      },
      {
        id: "se-2-item-5", text: "الحصول على شهادات مهنية في التربية الخاصة",
        subItems: [
          { id: "se-2-5-1", title: "شهادات مهنية متخصصة", suggestedEvidence: ["شهادة الرخصة المهنية", "شهادات تخصصية في التربية الخاصة"] },
        ],
        suggestedEvidence: ["شهادة الرخصة المهنية", "شهادات تطوير مهني متخصصة"],
      },
      {
        id: "se-2-item-6", text: "إطلاق مبادرات لدعم ذوي الإعاقة",
        subItems: [
          { id: "se-2-6-1", title: "تنفيذ مبادرات لدعم الطلاب ذوي الإعاقة", suggestedEvidence: ["وثيقة المبادرة", "صور من التنفيذ", "تقرير النتائج"] },
        ],
        suggestedEvidence: ["وثيقة المبادرة", "تقرير نتائج المبادرة"],
      },
    ],
  },
  {
    id: "se-std-3", number: 3, title: "التفاعل مع أولياء الأمور", weight: 5, color: "#0284C7", icon: "👨‍👩‍👧",
    items: [
      {
        id: "se-3-item-1", text: "التواصل المستمر مع أولياء أمور الطلاب ذوي الإعاقة",
        subItems: [
          { id: "se-3-1-1", title: "التواصل عبر الوسائل المختلفة", suggestedEvidence: ["صور من التواصل مع أولياء الأمور", "رسائل نظام نور"] },
          { id: "se-3-1-2", title: "عقد لقاءات فردية مع أولياء الأمور لمناقشة الخطة الفردية", suggestedEvidence: ["محاضر اللقاءات", "نماذج موافقة ولي الأمر على IEP"] },
        ],
        suggestedEvidence: ["سجل التواصل مع أولياء الأمور", "محاضر اللقاءات الفردية"],
      },
      {
        id: "se-3-item-2", text: "إشراك أولياء الأمور في إعداد وتنفيذ الخطة التعليمية الفردية",
        subItems: [
          { id: "se-3-2-1", title: "مشاركة ولي الأمر في اجتماعات فريق IEP", suggestedEvidence: ["محضر اجتماع فريق IEP بحضور ولي الأمر", "نموذج موافقة"] },
          { id: "se-3-2-2", title: "تزويد ولي الأمر بتقارير دورية عن تقدم ابنه", suggestedEvidence: ["تقارير التقدم المرسلة", "إشعارات المستوى"] },
        ],
        suggestedEvidence: ["محاضر اجتماعات فريق IEP", "تقارير التقدم الدورية"],
      },
      {
        id: "se-3-item-3", text: "تدريب أولياء الأمور على أساليب التعامل مع أبنائهم",
        subItems: [
          { id: "se-3-3-1", title: "تنفيذ ورش تدريبية لأولياء الأمور", suggestedEvidence: ["تقرير الورشة", "قائمة الحضور", "المادة التدريبية"] },
        ],
        suggestedEvidence: ["تقارير ورش تدريب أولياء الأمور", "صور من الورش"],
      },
      {
        id: "se-3-item-4", text: "المشاركة في الجمعية العمومية ومجالس الآباء",
        subItems: [
          { id: "se-3-4-1", title: "حضور والمشاركة في مجالس الآباء", suggestedEvidence: ["صور من المجلس", "محضر الاجتماع"] },
        ],
        suggestedEvidence: ["محاضر مجالس الآباء", "صور المشاركة"],
      },
    ],
  },
  {
    id: "se-std-4", number: 4, title: "التنويع في استراتيجيات التدريس", weight: 15, color: "#D97706", icon: "🎯",
    items: [
      {
        id: "se-4-item-1", text: "استخدام استراتيجيات تدريس متخصصة للتربية الخاصة",
        subItems: [
          { id: "se-4-1-1", title: "التدريس المباشر والتعليم الفردي", suggestedEvidence: ["تقرير عن تطبيق التدريس المباشر", "صور من الجلسات الفردية"] },
          { id: "se-4-1-2", title: "التعلم باللعب والأنشطة الحسية", suggestedEvidence: ["تقرير عن الأنشطة الحسية", "صور الأنشطة"] },
          { id: "se-4-1-3", title: "تحليل المهام وتجزئتها", suggestedEvidence: ["نماذج تحليل المهام", "خطوات التدريس المتسلسلة"] },
          { id: "se-4-1-4", title: "استخدام التعزيز الإيجابي والتشكيل", suggestedEvidence: ["سجل التعزيز", "خطة التعزيز الفردية"] },
        ],
        suggestedEvidence: ["تقارير تطبيق الاستراتيجيات المتخصصة", "صور من الجلسات"],
      },
      {
        id: "se-4-item-2", text: "تكييف المناهج والأنشطة حسب قدرات كل طالب",
        subItems: [
          { id: "se-4-2-1", title: "تعديل المحتوى التعليمي ليناسب مستوى الطالب", suggestedEvidence: ["نماذج من المحتوى المكيّف", "أوراق عمل معدّلة"] },
          { id: "se-4-2-2", title: "استخدام الوسائل المساعدة والتقنيات المعينة", suggestedEvidence: ["صور الوسائل المساعدة", "تقرير عن التقنيات المعينة"] },
        ],
        suggestedEvidence: ["نماذج من المحتوى المكيّف", "صور الوسائل المساعدة"],
      },
      {
        id: "se-4-item-3", text: "تطبيق برامج التدخل المبكر",
        subItems: [
          { id: "se-4-3-1", title: "تنفيذ برامج التدخل المبكر للطلاب المعرضين للخطر", suggestedEvidence: ["خطة التدخل المبكر", "تقارير المتابعة"] },
        ],
        suggestedEvidence: ["خطة التدخل المبكر", "تقارير نتائج التدخل"],
      },
      {
        id: "se-4-item-4", text: "استخدام التقنيات المساعدة في التدريس",
        subItems: [
          { id: "se-4-4-1", title: "توظيف التقنيات المساعدة (AAC, AT)", suggestedEvidence: ["صور من استخدام التقنيات المساعدة", "تقرير عن الأجهزة المستخدمة"] },
        ],
        suggestedEvidence: ["صور التقنيات المساعدة", "تقارير استخدام الأجهزة"],
      },
    ],
  },
  {
    id: "se-std-5", number: 5, title: "تحسين نتائج المتعلمين", weight: 10, color: "#DC2626", icon: "📈",
    items: [
      {
        id: "se-5-item-1", text: "تحقيق أهداف الخطة التعليمية الفردية",
        subItems: [
          { id: "se-5-1-1", title: "قياس تحقق الأهداف قصيرة المدى", suggestedEvidence: ["سجل تحقق الأهداف", "بيانات القياس الدوري"] },
          { id: "se-5-1-2", title: "تعديل الأهداف بناءً على تقدم الطالب", suggestedEvidence: ["نسخة محدثة من الأهداف", "تقرير التقدم"] },
        ],
        suggestedEvidence: ["سجل تحقق أهداف IEP", "تقارير التقدم الدورية"],
      },
      {
        id: "se-5-item-2", text: "تنفيذ برامج علاجية وتأهيلية",
        subItems: [
          { id: "se-5-2-1", title: "تنفيذ برامج علاجية فردية وجماعية", suggestedEvidence: ["خطة البرنامج العلاجي", "سجل الجلسات"] },
          { id: "se-5-2-2", title: "متابعة تقدم الطلاب في البرامج العلاجية", suggestedEvidence: ["تقارير المتابعة", "رسوم بيانية للتقدم"] },
        ],
        suggestedEvidence: ["خطط البرامج العلاجية", "تقارير التقدم"],
      },
      {
        id: "se-5-item-3", text: "تنمية مهارات الاستقلالية والحياة اليومية",
        subItems: [
          { id: "se-5-3-1", title: "تدريب الطلاب على مهارات الحياة اليومية", suggestedEvidence: ["خطة تدريب المهارات الحياتية", "صور من التدريب"] },
        ],
        suggestedEvidence: ["خطة المهارات الحياتية", "تقارير التقدم في المهارات"],
      },
      {
        id: "se-5-item-4", text: "تكريم الطلاب المتميزين والذين تحسن مستواهم",
        subItems: [
          { id: "se-5-4-1", title: "تكريم الطلاب المتميزين والمتحسنين", suggestedEvidence: ["صور التكريم", "شهادات التقدير"] },
        ],
        suggestedEvidence: ["شهادات تقدير", "صور من حفل التكريم"],
      },
    ],
  },
  {
    id: "se-std-6", number: 6, title: "إعداد وتنفيذ خطة التعلم", weight: 10, color: "#0891B2", icon: "📝",
    items: [
      {
        id: "se-6-item-1", text: "إعداد الخطة التعليمية الفردية (IEP) بناءً على التقييم",
        subItems: [
          { id: "se-6-1-1", title: "إعداد IEP شامل يتضمن الأهداف والخدمات", suggestedEvidence: ["نموذج IEP مكتمل", "قائمة الأهداف"] },
        ],
        suggestedEvidence: ["نموذج الخطة التعليمية الفردية المكتمل"],
      },
      {
        id: "se-6-item-2", text: "إعداد الجلسات الفردية والجماعية",
        subItems: [
          { id: "se-6-2-1", title: "تحضير الجلسات الفردية", suggestedEvidence: ["نموذج تحضير الجلسة", "المواد التعليمية المعدّة"] },
          { id: "se-6-2-2", title: "تحضير الأنشطة الجماعية المكيّفة", suggestedEvidence: ["خطة النشاط الجماعي", "المواد المكيّفة"] },
        ],
        suggestedEvidence: ["نماذج تحضير الجلسات", "المواد التعليمية"],
      },
      {
        id: "se-6-item-3", text: "إعداد الأنشطة والتمارين المكيّفة",
        subItems: [
          { id: "se-6-3-1", title: "إعداد أنشطة مكيّفة حسب نوع الإعاقة", suggestedEvidence: ["نماذج أنشطة مكيّفة", "أوراق عمل معدّلة"] },
        ],
        suggestedEvidence: ["نماذج من الأنشطة والتمارين المكيّفة"],
      },
      {
        id: "se-6-item-4", text: "تنفيذ الخطة وتوثيق الجلسات",
        subItems: [
          { id: "se-6-4-1", title: "تنفيذ الجلسات وفق الخطة وتوثيقها", suggestedEvidence: ["سجل الجلسات المنفذة", "تقارير التنفيذ"] },
        ],
        suggestedEvidence: ["سجل الجلسات المنفذة", "تقارير التنفيذ الدورية"],
      },
    ],
  },
  {
    id: "se-std-7", number: 7, title: "توظيف تقنيات ووسائل التعلم المناسبة", weight: 10, color: "#6D28D9", icon: "💻",
    items: [
      {
        id: "se-7-item-1", text: "استخدام التقنيات المساعدة والتعويضية",
        subItems: [
          { id: "se-7-1-1", title: "استخدام أجهزة التواصل البديل والمعزز (AAC)", suggestedEvidence: ["صور من استخدام أجهزة AAC", "تقرير عن البرامج المستخدمة"] },
          { id: "se-7-1-2", title: "استخدام التطبيقات التعليمية المتخصصة", suggestedEvidence: ["تقرير عن التطبيقات المستخدمة", "صور من التطبيق"] },
          { id: "se-7-1-3", title: "إنتاج محتوى رقمي مكيّف", suggestedEvidence: ["روابط المحتوى الرقمي المكيّف", "مقاطع فيديو تعليمية"] },
        ],
        suggestedEvidence: ["تقارير استخدام التقنيات المساعدة", "صور من الأجهزة والتطبيقات"],
      },
      {
        id: "se-7-item-2", text: "تصميم وإعداد الوسائل التعليمية المكيّفة",
        subItems: [
          { id: "se-7-2-1", title: "إعداد وسائل تعليمية حسية وبصرية", suggestedEvidence: ["صور من الوسائل التعليمية المكيّفة"] },
          { id: "se-7-2-2", title: "تصميم بيئة تعليمية محفزة ومناسبة", suggestedEvidence: ["صور من تجهيز غرفة المصادر/الفصل"] },
        ],
        suggestedEvidence: ["صور الوسائل التعليمية المكيّفة", "صور تجهيز البيئة التعليمية"],
      },
    ],
  },
  {
    id: "se-std-8", number: 8, title: "تهيئة البيئة التعليمية", weight: 5, color: "#16A34A", icon: "🏫",
    items: [
      {
        id: "se-8-item-1", text: "تهيئة البيئة المادية المناسبة للطلاب ذوي الإعاقة",
        subItems: [
          { id: "se-8-1-1", title: "تجهيز غرفة المصادر/الفصل بالأدوات المناسبة", suggestedEvidence: ["صور من تجهيز الغرفة", "قائمة الأدوات والمعدات"] },
          { id: "se-8-1-2", title: "توفير بيئة آمنة ومحفزة", suggestedEvidence: ["صور البيئة التعليمية", "تقرير السلامة"] },
        ],
        suggestedEvidence: ["صور تجهيز غرفة المصادر", "قائمة المعدات"],
      },
      {
        id: "se-8-item-2", text: "التهيئة النفسية والتحفيز للطلاب ذوي الإعاقة",
        subItems: [
          { id: "se-8-2-1", title: "أنشطة التهيئة النفسية والدعم الانفعالي", suggestedEvidence: ["صور من أنشطة التهيئة", "برامج الدعم النفسي"] },
          { id: "se-8-2-2", title: "برامج التحفيز والتعزيز الإيجابي", suggestedEvidence: ["نظام التعزيز المستخدم", "صور التكريم"] },
        ],
        suggestedEvidence: ["صور أنشطة التهيئة", "نظام التعزيز الإيجابي"],
      },
      {
        id: "se-8-item-3", text: "تهيئة بيئة الدمج مع أقرانهم العاديين",
        subItems: [
          { id: "se-8-3-1", title: "تهيئة الطلاب العاديين لقبول أقرانهم ذوي الإعاقة", suggestedEvidence: ["برنامج التوعية بالدمج", "صور الأنشطة المشتركة"] },
        ],
        suggestedEvidence: ["برامج التوعية بالدمج", "صور الأنشطة المشتركة"],
      },
    ],
  },
  {
    id: "se-std-9", number: 9, title: "التقييم والتشخيص وإدارة السلوك", weight: 5, color: "#EA580C", icon: "📊",
    items: [
      {
        id: "se-9-item-1", text: "إجراء التقييم التشخيصي الشامل",
        subItems: [
          { id: "se-9-1-1", title: "تطبيق أدوات التقييم والمقاييس المقننة", suggestedEvidence: ["نماذج من أدوات التقييم", "تقارير التشخيص"] },
          { id: "se-9-1-2", title: "إعداد تقارير تشخيصية شاملة", suggestedEvidence: ["تقرير تشخيصي", "ملخص نتائج التقييم"] },
        ],
        suggestedEvidence: ["أدوات التقييم المستخدمة", "التقارير التشخيصية"],
      },
      {
        id: "se-9-item-2", text: "تطبيق برامج التعديل السلوكي",
        subItems: [
          { id: "se-9-2-1", title: "إعداد خطط تعديل السلوك الفردية", suggestedEvidence: ["خطة تعديل السلوك", "سجل رصد السلوك"] },
          { id: "se-9-2-2", title: "تنفيذ ومتابعة برامج التعديل السلوكي", suggestedEvidence: ["سجل المتابعة", "رسوم بيانية لتغير السلوك"] },
        ],
        suggestedEvidence: ["خطط تعديل السلوك", "سجلات رصد السلوك"],
      },
      {
        id: "se-9-item-3", text: "التقييم المستمر وقياس التقدم",
        subItems: [
          { id: "se-9-3-1", title: "قياس التقدم بشكل دوري ومنتظم", suggestedEvidence: ["بيانات القياس الدوري", "رسوم بيانية للتقدم"] },
        ],
        suggestedEvidence: ["بيانات القياس الدوري", "تقارير التقدم"],
      },
      {
        id: "se-9-item-4", text: "متابعة الحضور والغياب وتوثيق الملاحظات",
        subItems: [
          { id: "se-9-4-1", title: "رصد الحضور والغياب وتوثيق الملاحظات اليومية", suggestedEvidence: ["سجل الحضور والغياب", "سجل الملاحظات اليومية"] },
        ],
        suggestedEvidence: ["سجل الحضور والغياب", "سجل الملاحظات"],
      },
    ],
  },
  {
    id: "se-std-10", number: 10, title: "تحليل نتائج المتعلمين وتشخيص مستوياتهم", weight: 10, color: "#BE185D", icon: "📉",
    items: [
      {
        id: "se-10-item-1", text: "تحليل نتائج التقييمات الدورية والسنوية",
        subItems: [
          { id: "se-10-1-1", title: "تحليل نتائج تقييمات الأهداف الفردية", suggestedEvidence: ["تقرير تحليل نتائج الأهداف", "رسوم بيانية"] },
          { id: "se-10-1-2", title: "مقارنة مستوى التقدم بين الفترات", suggestedEvidence: ["تقارير المقارنة", "جداول التقدم"] },
        ],
        suggestedEvidence: ["تقارير تحليل النتائج", "رسوم بيانية للتقدم"],
      },
      {
        id: "se-10-item-2", text: "تصنيف الطلاب حسب مستوياتهم واحتياجاتهم",
        subItems: [
          { id: "se-10-2-1", title: "تصنيف الطلاب حسب نوع ودرجة الإعاقة", suggestedEvidence: ["كشف تصنيف الطلاب", "ملفات الطلاب"] },
        ],
        suggestedEvidence: ["كشف تصنيف الطلاب حسب الاحتياجات"],
      },
      {
        id: "se-10-item-3", text: "تحديد نقاط القوة والاحتياج لكل طالب",
        subItems: [
          { id: "se-10-3-1", title: "إعداد ملف شامل لنقاط القوة والاحتياج", suggestedEvidence: ["تقرير نقاط القوة والاحتياج", "خطة الدعم الفردية"] },
        ],
        suggestedEvidence: ["تقارير نقاط القوة والاحتياج", "خطط الدعم"],
      },
      {
        id: "se-10-item-4", text: "إعداد تقارير الانتقال والتحويل",
        subItems: [
          { id: "se-10-4-1", title: "إعداد تقارير انتقال الطلاب بين المراحل أو البرامج", suggestedEvidence: ["تقرير الانتقال", "ملخص الحالة"] },
        ],
        suggestedEvidence: ["تقارير الانتقال", "ملخصات الحالات"],
      },
    ],
  },
  {
    id: "se-std-11", number: 11, title: "تنوع أساليب التقويم", weight: 10, color: "#4338CA", icon: "✅",
    items: [
      {
        id: "se-11-item-1", text: "تطبيق أدوات تقويم متنوعة ومكيّفة",
        subItems: [
          { id: "se-11-1-1", title: "اختبارات مكيّفة (شفهية، عملية، مصورة)", suggestedEvidence: ["نماذج من الاختبارات المكيّفة"] },
          { id: "se-11-1-2", title: "ملاحظة منظمة وقوائم رصد", suggestedEvidence: ["نماذج قوائم الرصد", "سجلات الملاحظة"] },
        ],
        suggestedEvidence: ["نماذج أدوات التقويم المكيّفة"],
      },
      {
        id: "se-11-item-2", text: "تقويم المهارات الحياتية والوظيفية",
        subItems: [
          { id: "se-11-2-1", title: "تقييم مهارات الحياة اليومية والاستقلالية", suggestedEvidence: ["مقاييس المهارات الحياتية", "سجل التقييم"] },
          { id: "se-11-2-2", title: "تقييم المهارات الاجتماعية والتواصلية", suggestedEvidence: ["مقاييس المهارات الاجتماعية", "تقارير التقييم"] },
        ],
        suggestedEvidence: ["مقاييس المهارات الحياتية والاجتماعية"],
      },
      {
        id: "se-11-item-3", text: "ملفات إنجاز الطلاب ذوي الإعاقة",
        subItems: [
          { id: "se-11-3-1", title: "تصميم ملفات إنجاز فردية", suggestedEvidence: ["نماذج من ملفات إنجاز الطلاب"] },
        ],
        suggestedEvidence: ["نماذج ملفات إنجاز الطلاب ذوي الإعاقة"],
      },
      {
        id: "se-11-item-4", text: "التقويم التكويني والختامي المكيّف",
        subItems: [
          { id: "se-11-4-1", title: "تطبيق التقويم التكويني المستمر", suggestedEvidence: ["أدوات التقويم التكويني المكيّفة", "ملاحظات الأداء"] },
          { id: "se-11-4-2", title: "تطبيق التقويم الختامي المكيّف", suggestedEvidence: ["نماذج التقويم الختامي المكيّف"] },
        ],
        suggestedEvidence: ["أدوات التقويم التكويني والختامي المكيّفة"],
      },
    ],
  },
];
