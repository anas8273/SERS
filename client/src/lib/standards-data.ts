/**
 * معايير الأداء الوظيفي - هيكل ثلاثي المستويات
 * معيار → بند → بند فرعي
 * مستخرجة من الملفات المرجعية الرسمية لوزارة التعليم 1447هـ
 */

// ===== الأنواع (الجديدة - 3 مستويات) =====
export interface SubItem {
  id: string;
  title: string;
  suggestedEvidence: string[];
}

export interface Item {
  id: string;
  text: string;
  subItems: SubItem[];
  suggestedEvidence: string[];
}

export interface Standard {
  id: string;
  number?: number;
  title: string;
  weight: number;
  color?: string;
  icon?: string;
  items: Item[];
  /** @deprecated use items instead */
  indicators?: Indicator[];
}

// ===== أنواع قديمة للتوافقية =====
export interface Indicator {
  id: string;
  text: string;
  suggestedEvidence: string[];
}

export interface SuggestedEvidenceItem {
  text: string;
  priority: "essential" | "supporting" | "additional";
}

export interface Evidence {
  id: string;
  standardId: string;
  indicatorId: string;
  type: "image" | "link" | "video" | "file" | "text";
  content: string;
  displayAs: "image" | "qr";
  title: string;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  school: string;
  subject: string;
  grade: string;
  year: string;
  role: string;
}

// ===== معايير المعلم/المعلمة (11 معيار) =====
export const TEACHER_STANDARDS: Standard[] = [
  {
    id: "std-1", number: 1, title: "أداء الواجبات الوظيفية", weight: 10, color: "#059669", icon: "📋",
    items: [
      {
        id: "std-1-item-1", text: "التقيد بالدوام الرسمي",
        subItems: [
          { id: "std-1-1-1", title: "الالتزام بمواعيد الحضور والانصراف", suggestedEvidence: ["صورة من سجل الدوام الرسمي", "سجل البصمة الإلكتروني"] },
          { id: "std-1-1-2", title: "الالتزام بأوقات الحصص والفسح", suggestedEvidence: ["جدول الحصص", "تقرير المتابعة"] },
        ],
        suggestedEvidence: ["صورة من سجل الحضور والانصراف", "تقرير الالتزام بالدوام الرسمي", "خطاب شكر على الانضباط"],
      },
      {
        id: "std-1-item-2", text: "تأدية الحصص الدراسية وفق الجدول الدراسي",
        subItems: [
          { id: "std-1-2-1", title: "تنفيذ الحصص المقررة كاملة", suggestedEvidence: ["جدول الحصص الأسبوعي", "سجل تنفيذ الحصص"] },
          { id: "std-1-2-2", title: "الالتزام بالتوزيع الزمني للمنهج", suggestedEvidence: ["خطة توزيع المنهج", "سجل المتابعة"] },
        ],
        suggestedEvidence: ["صورة من الجدول الدراسي", "سجل تنفيذ الحصص", "تقرير متابعة تنفيذ الجدول"],
      },
      {
        id: "std-1-item-3", text: "المشاركة في الإشراف والمناوبة وحصص الانتظار",
        subItems: [
          { id: "std-1-3-1", title: "المشاركة في المناوبة اليومية", suggestedEvidence: ["سجل المناوبة والإشراف اليومي"] },
          { id: "std-1-3-2", title: "تنفيذ حصص الانتظار", suggestedEvidence: ["سجل الانتظار", "أنشطة حصص الانتظار"] },
        ],
        suggestedEvidence: ["صورة من سجل المناوبة والإشراف اليومي", "صورة من سجل الانتظار", "جدول المناوبة المعتمد"],
      },
      {
        id: "std-1-item-4", text: "إعداد ومتابعة الدروس والواجبات والاختبارات",
        subItems: [
          { id: "std-1-4-1", title: "إعداد الدروس مسبقاً", suggestedEvidence: ["دفتر التحضير", "نماذج من إعداد الدروس"] },
          { id: "std-1-4-2", title: "متابعة الواجبات وتصحيحها", suggestedEvidence: ["سجل متابعة الواجبات", "نماذج من الواجبات المصححة"] },
          { id: "std-1-4-3", title: "إعداد الاختبارات وتصحيحها", suggestedEvidence: ["نماذج من الاختبارات", "كشوف الدرجات"] },
        ],
        suggestedEvidence: ["نماذج من تحضير الدروس", "نماذج من الواجبات المنزلية", "نماذج من الاختبارات", "خطة توزيع المنهج"],
      },
      {
        id: "std-1-item-5", text: "المشاركة في اللجان المدرسية وتفعيلها",
        subItems: [
          { id: "std-1-5-1", title: "المشاركة الفعالة في اللجان", suggestedEvidence: ["قرار تشكيل اللجنة", "محاضر اجتماعات اللجان"] },
        ],
        suggestedEvidence: ["قرار تشكيل اللجنة", "محاضر اجتماعات اللجان", "تقرير إنجازات اللجنة"],
      },
      {
        id: "std-1-item-6", text: "المشاركة في الأنشطة والمناسبات الوطنية",
        subItems: [
          { id: "std-1-6-1", title: "تفعيل المناسبات الوطنية", suggestedEvidence: ["صور من فعاليات اليوم الوطني", "صور أنشطة يوم التأسيس"] },
        ],
        suggestedEvidence: ["صور من فعاليات اليوم الوطني", "صور أنشطة يوم التأسيس", "تقرير عن المشاركة في مناسبات وطنية"],
      },
      {
        id: "std-1-item-7", text: "تفعيل الإذاعة الصباحية والالتزام بالطابور الصباحي",
        subItems: [
          { id: "std-1-7-1", title: "تنفيذ الإذاعة الصباحية", suggestedEvidence: ["جدول الإذاعة المدرسية", "صور من تنفيذ الإذاعة"] },
        ],
        suggestedEvidence: ["جدول الإذاعة المدرسية", "صور من تنفيذ الإذاعة", "تقرير تفعيل الإذاعة الصباحية"],
      },
      {
        id: "std-1-item-8", text: "الالتزام بالسلوك المهني وأخلاقيات المهنة",
        subItems: [
          { id: "std-1-8-1", title: "الالتزام بميثاق أخلاقيات المهنة", suggestedEvidence: ["صورة من ميثاق أخلاقيات المهنة الموقع", "خطاب شكر من المدير"] },
        ],
        suggestedEvidence: ["صورة من ميثاق أخلاقيات المهنة الموقع", "شهادة حسن السيرة والسلوك"],
      },
      {
        id: "std-1-item-9", text: "تفعيل منصة مدرستي والأنظمة الإلكترونية",
        subItems: [
          { id: "std-1-9-1", title: "استخدام منصة مدرستي", suggestedEvidence: ["صور من منصة مدرستي", "تقرير استخدام المنصة"] },
        ],
        suggestedEvidence: ["صور من منصة مدرستي", "تقرير استخدام المنصة", "صور واجبات إلكترونية على المنصة"],
      },
      {
        id: "std-1-item-10", text: "الاطلاع والالتزام بالتعاميم واللوائح المنظمة",
        subItems: [
          { id: "std-1-10-1", title: "التوقيع بالعلم على التعاميم", suggestedEvidence: ["صور التوقيع بالعلم على التعاميم", "سجل الاطلاع على اللوائح"] },
        ],
        suggestedEvidence: ["صور التوقيع بالعلم على التعاميم", "سجل الاطلاع على اللوائح"],
      },
    ],
  },
  {
    id: "std-2", number: 2, title: "التفاعل مع المجتمع المهني", weight: 10, color: "#7C3AED", icon: "🤝",
    items: [
      {
        id: "std-2-item-1", text: "المشاركة الفاعلة في مجتمعات التعلم المهنية",
        subItems: [
          { id: "std-2-1-1", title: "حضور اجتماعات مجتمعات التعلم", suggestedEvidence: ["صورة من سجل مجتمعات التعلم المهنية", "محاضر الاجتماعات"] },
          { id: "std-2-1-2", title: "المشاركة بأوراق عمل وعروض", suggestedEvidence: ["أوراق عمل", "عروض تقديمية"] },
        ],
        suggestedEvidence: ["صورة من سجل مجتمعات التعلم المهنية", "محاضر اجتماعات مجتمعات التعلم"],
      },
      {
        id: "std-2-item-2", text: "تبادل الزيارات الصفية مع الزملاء",
        subItems: [
          { id: "std-2-2-1", title: "زيارات صفية للزملاء", suggestedEvidence: ["سجل تبادل الزيارات", "تقارير الزيارات"] },
          { id: "std-2-2-2", title: "استقبال زيارات الزملاء", suggestedEvidence: ["سجل الزيارات الواردة"] },
        ],
        suggestedEvidence: ["سجل تبادل الزيارات", "نموذج ملاحظة الزيارة الصفية"],
      },
      {
        id: "std-2-item-3", text: "تنفيذ الدروس التطبيقية وبحث الدرس",
        subItems: [
          { id: "std-2-3-1", title: "تنفيذ دروس تطبيقية", suggestedEvidence: ["تقرير تنفيذ درس تطبيقي", "صور من الدرس"] },
          { id: "std-2-3-2", title: "المشاركة في بحث الدرس", suggestedEvidence: ["تقرير بحث الدرس", "نتائج البحث"] },
        ],
        suggestedEvidence: ["تقرير تنفيذ درس تطبيقي", "صور من الدرس التطبيقي", "نموذج بحث الدرس"],
      },
      {
        id: "std-2-item-4", text: "حضور الدورات والورش التدريبية",
        subItems: [
          { id: "std-2-4-1", title: "حضور دورات تدريبية", suggestedEvidence: ["شهادات حضور الدورات والورش التدريبية"] },
          { id: "std-2-4-2", title: "تنفيذ ورش عمل للزملاء", suggestedEvidence: ["تقرير تنفيذ الورشة", "قائمة الحضور"] },
        ],
        suggestedEvidence: ["شهادات حضور الدورات والورش التدريبية", "صور من الورش التدريبية"],
      },
      {
        id: "std-2-item-5", text: "الإنتاج المعرفي (أوراق عمل، عروض تقديمية، ملازم)",
        subItems: [
          { id: "std-2-5-1", title: "إعداد أوراق عمل وعروض", suggestedEvidence: ["نماذج أوراق عمل", "عروض تقديمية تم إعدادها"] },
        ],
        suggestedEvidence: ["نماذج أوراق عمل", "عروض تقديمية تم إعدادها", "ملازم وتقارير تعليمية"],
      },
      {
        id: "std-2-item-6", text: "الحصول على شهادات مهنية معتمدة",
        subItems: [
          { id: "std-2-6-1", title: "شهادات مهنية", suggestedEvidence: ["شهادة الرخصة المهنية", "شهادات تطوير مهني"] },
        ],
        suggestedEvidence: ["شهادة الرخصة المهنية", "شهادات تطوير مهني", "شهادات دورات معتمدة"],
      },
      {
        id: "std-2-item-7", text: "إطلاق مبادرات تعليمية لتحسين جودة التعليم",
        subItems: [
          { id: "std-2-7-1", title: "تنفيذ مبادرات تعليمية", suggestedEvidence: ["وثيقة المبادرة التعليمية", "صور من تنفيذ المبادرة"] },
        ],
        suggestedEvidence: ["وثيقة المبادرة التعليمية", "صور من تنفيذ المبادرة", "تقرير نتائج المبادرة"],
      },
    ],
  },
  {
    id: "std-3", number: 3, title: "التفاعل مع أولياء الأمور", weight: 5, color: "#0284C7", icon: "👨‍👩‍👧",
    items: [
      {
        id: "std-3-item-1", text: "التواصل الفعال مع أولياء الأمور بالتنسيق مع الموجه الطلابي",
        subItems: [
          { id: "std-3-1-1", title: "التواصل عبر الوسائل المختلفة", suggestedEvidence: ["صور من التواصل مع أولياء الأمور", "رسائل نظام نور"] },
          { id: "std-3-1-2", title: "عقد لقاءات مع أولياء الأمور", suggestedEvidence: ["تقرير اجتماع ولي الأمر مع المعلم", "محاضر اللقاءات"] },
        ],
        suggestedEvidence: ["صور من التواصل مع أولياء الأمور", "تقرير اجتماع ولي الأمر مع المعلم"],
      },
      {
        id: "std-3-item-2", text: "تزويد أولياء الأمور بمستويات الطلبة بشكل دوري",
        subItems: [
          { id: "std-3-2-1", title: "إرسال تقارير دورية", suggestedEvidence: ["نماذج تقارير الطلاب المرسلة لأولياء الأمور", "إشعارات المستوى"] },
        ],
        suggestedEvidence: ["نماذج تقارير الطلاب المرسلة لأولياء الأمور", "صور من رسائل التواصل"],
      },
      {
        id: "std-3-item-3", text: "المشاركة الفاعلة في الجمعية العمومية للمعلمين وأولياء الأمور",
        subItems: [
          { id: "std-3-3-1", title: "حضور والمشاركة في الجمعية العمومية", suggestedEvidence: ["صور من الجمعية العمومية", "محضر الاجتماع"] },
        ],
        suggestedEvidence: ["صور من الجمعية العمومية لأولياء الأمور والمعلمين", "محاضر اجتماعات الجمعية"],
      },
      {
        id: "std-3-item-4", text: "تفعيل الخطة الأسبوعية للمدرسة وإشراك أولياء الأمور",
        subItems: [
          { id: "std-3-4-1", title: "إعداد وتفعيل الخطة الأسبوعية", suggestedEvidence: ["نسخة من الخطة الأسبوعية للمدرسة"] },
        ],
        suggestedEvidence: ["نسخة من الخطة الأسبوعية للمدرسة", "صور من تفعيل الخطة"],
      },
      {
        id: "std-3-item-5", text: "إيصال الملاحظات الهامة لأولياء الأمور في الوقت المناسب",
        subItems: [
          { id: "std-3-5-1", title: "إبلاغ أولياء الأمور بالملاحظات", suggestedEvidence: ["سجل الملاحظات المرسلة", "رسائل التواصل"] },
        ],
        suggestedEvidence: ["صور من الرسائل المرسلة لأولياء الأمور", "سجل الملاحظات المرسلة"],
      },
    ],
  },
  {
    id: "std-4", number: 4, title: "التنويع في استراتيجيات التدريس", weight: 15, color: "#D97706", icon: "🎯",
    items: [
      {
        id: "std-4-item-1", text: "استخدام استراتيجيات متنوعة تناسب مستويات الطلبة",
        subItems: [
          { id: "std-4-1-1", title: "التعلم النشط", suggestedEvidence: ["تقرير عن تطبيق استراتيجية التعلم النشط", "صور من التطبيق"] },
          { id: "std-4-1-2", title: "التعلم التعاوني", suggestedEvidence: ["تقرير عن تطبيق التعلم التعاوني", "صور المجموعات"] },
          { id: "std-4-1-3", title: "التعلم باللعب", suggestedEvidence: ["تقرير عن تطبيق التعلم باللعب", "صور الأنشطة"] },
          { id: "std-4-1-4", title: "الصف المقلوب", suggestedEvidence: ["تقرير عن تطبيق الصف المقلوب", "روابط المحتوى"] },
        ],
        suggestedEvidence: ["تقرير عن تطبيق استراتيجية تدريس", "صور من أنشطة التعلم النشط"],
      },
      {
        id: "std-4-item-2", text: "مراعاة الفروق الفردية بين الطلاب",
        subItems: [
          { id: "std-4-2-1", title: "تصنيف الطلبة حسب المستوى", suggestedEvidence: ["كشف تصنيف الطلبة", "خطة التعامل مع الفروق"] },
          { id: "std-4-2-2", title: "تنويع الأنشطة حسب المستوى", suggestedEvidence: ["نماذج من أنشطة متدرجة الصعوبة"] },
        ],
        suggestedEvidence: ["أوراق عمل متنوعة المستويات", "تقرير تصنيف الطلبة وفق أنماط التعلم"],
      },
      {
        id: "std-4-item-3", text: "تطبيق التعلم القائم على المشاريع والاستقصاء",
        subItems: [
          { id: "std-4-3-1", title: "تصميم مشاريع تعليمية", suggestedEvidence: ["صور مشاريع الطلاب", "خطة مشروع تعليمي"] },
        ],
        suggestedEvidence: ["صور مشاريع الطلاب", "خطة مشروع تعليمي", "تقرير نتائج التعلم القائم على المشاريع"],
      },
      {
        id: "std-4-item-4", text: "استخدام الوسائل البصرية والسمعية في التدريس",
        subItems: [
          { id: "std-4-4-1", title: "توظيف الوسائل التعليمية", suggestedEvidence: ["صور الوسائل التعليمية المستخدمة", "فيديوهات تعليمية"] },
        ],
        suggestedEvidence: ["صور الوسائل التعليمية المستخدمة", "فيديوهات تعليمية", "صور عروض تقديمية"],
      },
    ],
  },
  {
    id: "std-5", number: 5, title: "تحسين نتائج المتعلمين", weight: 10, color: "#DC2626", icon: "📈",
    items: [
      {
        id: "std-5-item-1", text: "معالجة الفاقد التعليمي لدى الطلاب",
        subItems: [
          { id: "std-5-1-1", title: "تحديد الفاقد التعليمي", suggestedEvidence: ["اختبار تشخيصي", "كشف الفاقد التعليمي"] },
          { id: "std-5-1-2", title: "تنفيذ برامج المعالجة", suggestedEvidence: ["خطة معالجة الفاقد", "نتائج الاختبار القبلي والبعدي"] },
        ],
        suggestedEvidence: ["سجل معالجة الفاقد التعليمي", "خطة علاجية للطلاب المتأخرين"],
      },
      {
        id: "std-5-item-2", text: "وضع الخطط العلاجية للطلاب الضعاف",
        subItems: [
          { id: "std-5-2-1", title: "إعداد خطة علاجية", suggestedEvidence: ["خطة علاجية", "كشف متابعة الطلبة"] },
          { id: "std-5-2-2", title: "تنفيذ ومتابعة الخطة", suggestedEvidence: ["تقارير المتابعة", "نتائج ما بعد العلاج"] },
        ],
        suggestedEvidence: ["الخطة العلاجية المعتمدة", "نتائج الاختبار القبلي والبعدي", "كشف متابعة الطلبة"],
      },
      {
        id: "std-5-item-3", text: "وضع الخطط الإثرائية للطلاب المتميزين",
        subItems: [
          { id: "std-5-3-1", title: "إعداد خطة إثرائية", suggestedEvidence: ["خطة إثرائية", "أنشطة إثرائية"] },
        ],
        suggestedEvidence: ["الخطة الإثرائية", "أنشطة إثرائية للطلاب المتميزين"],
      },
      {
        id: "std-5-item-4", text: "تكريم الطلبة المتميزين والذين تحسن مستواهم",
        subItems: [
          { id: "std-5-4-1", title: "تكريم الطلبة المتميزين", suggestedEvidence: ["صور التكريم", "شهادات التقدير"] },
        ],
        suggestedEvidence: ["شهادات تقدير للطلاب المتميزين", "صور من حفل التكريم"],
      },
    ],
  },
  {
    id: "std-6", number: 6, title: "إعداد وتنفيذ خطة التعلم", weight: 10, color: "#0891B2", icon: "📝",
    items: [
      {
        id: "std-6-item-1", text: "توزيع المنهج وإعداد الخطة الفصلية",
        subItems: [
          { id: "std-6-1-1", title: "إعداد خطة توزيع المنهج", suggestedEvidence: ["خطة توزيع المنهج المعتمدة"] },
        ],
        suggestedEvidence: ["خطة توزيع المنهج", "الخطة الفصلية المعتمدة"],
      },
      {
        id: "std-6-item-2", text: "إعداد الدروس اليومية",
        subItems: [
          { id: "std-6-2-1", title: "تحضير الدروس اليومية", suggestedEvidence: ["نموذج من إعداد الدروس", "دفتر التحضير"] },
          { id: "std-6-2-2", title: "تحديد الأهداف التعليمية", suggestedEvidence: ["أهداف الدرس المكتوبة"] },
        ],
        suggestedEvidence: ["نموذج من إعداد الدروس", "دفتر التحضير"],
      },
      {
        id: "std-6-item-3", text: "إعداد الواجبات والأنشطة",
        subItems: [
          { id: "std-6-3-1", title: "إعداد واجبات منزلية متنوعة", suggestedEvidence: ["نماذج من الواجبات"] },
          { id: "std-6-3-2", title: "إعداد أنشطة صفية", suggestedEvidence: ["نماذج من الأنشطة الصفية"] },
        ],
        suggestedEvidence: ["نماذج من الواجبات والأنشطة"],
      },
      {
        id: "std-6-item-4", text: "تنفيذ الدروس وفق الخطة",
        subItems: [
          { id: "std-6-4-1", title: "تنفيذ الدروس وفق الخطة", suggestedEvidence: ["سجل تنفيذ الدروس", "تقارير الزيارات الصفية"] },
        ],
        suggestedEvidence: ["سجل تنفيذ الدروس", "تقارير الزيارات الصفية"],
      },
    ],
  },
  {
    id: "std-7", number: 7, title: "توظيف تقنيات ووسائل التعلم المناسبة", weight: 10, color: "#6D28D9", icon: "💻",
    items: [
      {
        id: "std-7-item-1", text: "دمج التقنية في التعليم",
        subItems: [
          { id: "std-7-1-1", title: "استخدام المنصات الرقمية", suggestedEvidence: ["لقطات شاشة من المنصات (مدرستي، عين)", "تقرير عن استخدام المنصة"] },
          { id: "std-7-1-2", title: "استخدام التطبيقات التعليمية", suggestedEvidence: ["تقرير عن برنامج تقني تم استخدامه", "صور من التطبيق"] },
          { id: "std-7-1-3", title: "إنتاج محتوى رقمي", suggestedEvidence: ["روابط المحتوى الرقمي", "فيديوهات تعليمية"] },
        ],
        suggestedEvidence: ["تقرير عن برنامج تقني تم استخدامه", "لقطات شاشة من المنصات"],
      },
      {
        id: "std-7-item-2", text: "التنويع في الوسائل التعليمية",
        subItems: [
          { id: "std-7-2-1", title: "إعداد وسائل تعليمية", suggestedEvidence: ["صور من الوسائل التعليمية المستخدمة"] },
          { id: "std-7-2-2", title: "توظيف الوسائل في الدروس", suggestedEvidence: ["صور من استخدام الوسائل في الحصة"] },
        ],
        suggestedEvidence: ["صور من الوسائل التعليمية المستخدمة"],
      },
    ],
  },
  {
    id: "std-8", number: 8, title: "تهيئة البيئة التعليمية", weight: 5, color: "#16A34A", icon: "🏫",
    items: [
      {
        id: "std-8-item-1", text: "مراعاة حاجات الطلبة وأنماط تعلمهم",
        subItems: [
          { id: "std-8-1-1", title: "تصنيف الطلبة وفق أنماط التعلم", suggestedEvidence: ["تقرير تصنيف الطلبة وفق أنماط التعلم"] },
        ],
        suggestedEvidence: ["تقرير تصنيف الطلبة وفق أنماط التعلم"],
      },
      {
        id: "std-8-item-2", text: "التهيئة النفسية والتحفيز",
        subItems: [
          { id: "std-8-2-1", title: "أنشطة التهيئة النفسية", suggestedEvidence: ["صور من أنشطة التهيئة", "تقرير عن البرامج النفسية"] },
          { id: "std-8-2-2", title: "برامج التحفيز المادي والمعنوي", suggestedEvidence: ["نماذج من التحفيز المادي والمعنوي", "صور التكريم"] },
        ],
        suggestedEvidence: ["صور من أنشطة التهيئة", "نماذج من التحفيز المادي والمعنوي"],
      },
      {
        id: "std-8-item-3", text: "توفير متطلبات الدرس وتجهيز الفصل",
        subItems: [
          { id: "std-8-3-1", title: "تجهيز مستلزمات الدرس", suggestedEvidence: ["صور من تجهيز الفصل", "قائمة المستلزمات"] },
        ],
        suggestedEvidence: ["صور من تجهيز الفصل", "قائمة المستلزمات"],
      },
    ],
  },
  {
    id: "std-9", number: 9, title: "الإدارة الصفية", weight: 5, color: "#EA580C", icon: "📊",
    items: [
      {
        id: "std-9-item-1", text: "ضبط سلوك الطلبة وإدارة الصف",
        subItems: [
          { id: "std-9-1-1", title: "وضع قوانين صفية", suggestedEvidence: ["صور قوانين الصف", "ميثاق الصف"] },
          { id: "std-9-1-2", title: "تطبيق نظام المكافآت والعواقب", suggestedEvidence: ["نظام النقاط", "سجل السلوك"] },
        ],
        suggestedEvidence: ["كشف المتابعة", "تطبيق إدارة الصف"],
      },
      {
        id: "std-9-item-2", text: "شد انتباه الطلبة واستثمار وقت الحصة",
        subItems: [
          { id: "std-9-2-1", title: "استخدام أساليب جذب الانتباه", suggestedEvidence: ["صور من الأنشطة التفاعلية", "تقرير عن الأساليب المستخدمة"] },
        ],
        suggestedEvidence: ["صور من الأنشطة التفاعلية"],
      },
      {
        id: "std-9-item-3", text: "مراعاة الفروق الفردية في الإدارة الصفية",
        subItems: [
          { id: "std-9-3-1", title: "تنويع أساليب التعامل", suggestedEvidence: ["خطة مراعاة الفروق الفردية"] },
        ],
        suggestedEvidence: ["خطة مراعاة الفروق الفردية"],
      },
      {
        id: "std-9-item-4", text: "متابعة الحضور والغياب والتأخر",
        subItems: [
          { id: "std-9-4-1", title: "رصد الحضور والغياب يومياً", suggestedEvidence: ["سجل الحضور والغياب", "تقارير نظام نور"] },
        ],
        suggestedEvidence: ["سجل الحضور والغياب"],
      },
    ],
  },
  {
    id: "std-10", number: 10, title: "تحليل نتائج المتعلمين وتشخيص مستوياتهم", weight: 10, color: "#BE185D", icon: "📉",
    items: [
      {
        id: "std-10-item-1", text: "تحليل نتائج الاختبارات الفترية والنهائية",
        subItems: [
          { id: "std-10-1-1", title: "تحليل نتائج الاختبارات الفترية", suggestedEvidence: ["تقرير تحليل نتائج الطلبة", "رسوم بيانية"] },
          { id: "std-10-1-2", title: "تحليل نتائج الاختبارات النهائية", suggestedEvidence: ["تقرير التحليل النهائي", "مقارنات الفترات"] },
        ],
        suggestedEvidence: ["تقرير تحليل نتائج الطلبة"],
      },
      {
        id: "std-10-item-2", text: "تصنيف الطلبة وفق نتائجهم",
        subItems: [
          { id: "std-10-2-1", title: "تصنيف الطلبة إلى مستويات", suggestedEvidence: ["كشف تصنيف الطلبة", "مصفوفة المستويات"] },
        ],
        suggestedEvidence: ["كشف تصنيف الطلبة"],
      },
      {
        id: "std-10-item-3", text: "معالجة الفاقد التعليمي بناءً على التحليل",
        subItems: [
          { id: "std-10-3-1", title: "خطة معالجة الفاقد", suggestedEvidence: ["سجل معالجة الفاقد التعليمي", "خطة المعالجة"] },
        ],
        suggestedEvidence: ["سجل معالجة الفاقد التعليمي"],
      },
      {
        id: "std-10-item-4", text: "تحديد نقاط القوة والضعف",
        subItems: [
          { id: "std-10-4-1", title: "تحليل نقاط القوة والضعف", suggestedEvidence: ["تقرير نقاط القوة والضعف", "خطة التحسين"] },
        ],
        suggestedEvidence: ["تقرير نقاط القوة والضعف"],
      },
    ],
  },
  {
    id: "std-11", number: 11, title: "تنوع أساليب التقويم", weight: 10, color: "#4338CA", icon: "✅",
    items: [
      {
        id: "std-11-item-1", text: "تطبيق الاختبارات الورقية والإلكترونية",
        subItems: [
          { id: "std-11-1-1", title: "اختبارات ورقية", suggestedEvidence: ["نماذج من الاختبارات الورقية"] },
          { id: "std-11-1-2", title: "اختبارات إلكترونية", suggestedEvidence: ["لقطات شاشة من الاختبارات الإلكترونية", "روابط الاختبارات"] },
        ],
        suggestedEvidence: ["نماذج من الاختبارات"],
      },
      {
        id: "std-11-item-2", text: "مشاريع الطلبة والمهام الأدائية",
        subItems: [
          { id: "std-11-2-1", title: "تصميم مشاريع تعليمية", suggestedEvidence: ["نماذج من مشاريع الطلبة", "معايير التقييم"] },
          { id: "std-11-2-2", title: "تصميم مهام أدائية", suggestedEvidence: ["نماذج من المهام الأدائية", "سلالم التقدير"] },
        ],
        suggestedEvidence: ["نماذج من مشاريع الطلبة", "نماذج من المهام الأدائية"],
      },
      {
        id: "std-11-item-3", text: "ملفات إنجاز الطلبة",
        subItems: [
          { id: "std-11-3-1", title: "تصميم ملفات إنجاز", suggestedEvidence: ["نماذج من ملفات إنجاز الطلبة"] },
        ],
        suggestedEvidence: ["نماذج من ملفات إنجاز الطلبة"],
      },
      {
        id: "std-11-item-4", text: "التقويم التكويني والختامي",
        subItems: [
          { id: "std-11-4-1", title: "تطبيق التقويم التكويني", suggestedEvidence: ["أدوات التقويم التكويني", "ملاحظات الأداء"] },
          { id: "std-11-4-2", title: "تطبيق التقويم الختامي", suggestedEvidence: ["نماذج من التقويم الختامي"] },
        ],
        suggestedEvidence: ["أدوات التقويم التكويني", "نماذج من التقويم الختامي"],
      },
    ],
  },
];

// ===== الاسم القديم للتوافقية =====
export const STANDARDS = TEACHER_STANDARDS;

// ===== دوال مساعدة =====

/** الحصول على جميع البنود الفرعية لمعيار معين */
export function getSubItemsForStandard(standard: Standard): SubItem[] {
  return standard.items.flatMap(item => item.subItems);
}

/** الحصول على إجمالي عدد البنود الفرعية */
export function getTotalSubItems(standards: Standard[]): number {
  return standards.reduce((total, std) => total + std.items.reduce((t, item) => t + item.subItems.length, 0), 0);
}

/** الحصول على إجمالي عدد البنود */
export function getTotalItems(standards: Standard[]): number {
  return standards.reduce((total, std) => total + std.items.length, 0);
}

/** البحث في البنود والبنود الفرعية */
export function searchStandards(standards: Standard[], query: string): { standard: Standard; item: Item; subItem?: SubItem }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: { standard: Standard; item: Item; subItem?: SubItem }[] = [];
  for (const std of standards) {
    for (const item of std.items) {
      if (item.text.toLowerCase().includes(q)) {
        results.push({ standard: std, item });
      }
      for (const sub of item.subItems) {
        if (sub.title.toLowerCase().includes(q) || sub.suggestedEvidence.some(e => e.toLowerCase().includes(q))) {
          results.push({ standard: std, item, subItem: sub });
        }
      }
    }
  }
  return results;
}

// ===== دوال التوافقية (تحويل items إلى indicators) =====
export function getIndicatorsFromStandard(standard: Standard): Indicator[] {
  return standard.items.map(item => ({
    id: item.id,
    text: item.text,
    suggestedEvidence: item.suggestedEvidence,
  }));
}

// ===== ثوابت =====
export const TOTAL_ITEMS = getTotalItems(TEACHER_STANDARDS);
export const TOTAL_SUB_ITEMS = getTotalSubItems(TEACHER_STANDARDS);
export const TOTAL_INDICATORS = TOTAL_ITEMS; // للتوافقية

// ===== دوال التقدم والتغطية =====
export function getStandardProgress(standardId: string, evidences: Evidence[]) {
  const standard = TEACHER_STANDARDS.find(s => s.id === standardId);
  if (!standard) return { total: 0, covered: 0, percentage: 0 };
  const stdEvidences = evidences.filter(e => e.standardId === standardId);
  const coveredItems = new Set(stdEvidences.map(e => e.indicatorId));
  const total = standard.items.length;
  const covered = standard.items.filter(item => coveredItems.has(item.id)).length;
  return { total, covered, percentage: total > 0 ? Math.round((covered / total) * 100) : 0 };
}

export function getOverallCoverage(evidences: Evidence[]) {
  let coveredIndicators = 0;
  let coveredStandards = 0;
  let partialStandards = 0;
  let missingStandards = 0;

  for (const std of TEACHER_STANDARDS) {
    const progress = getStandardProgress(std.id, evidences);
    if (progress.percentage === 100) {
      coveredStandards++;
      coveredIndicators += progress.total;
    } else if (progress.percentage > 0) {
      partialStandards++;
      coveredIndicators += progress.covered;
    } else {
      missingStandards++;
    }
  }

  return {
    coveredIndicators,
    totalIndicators: TOTAL_INDICATORS,
    percentage: Math.round((coveredIndicators / TOTAL_INDICATORS) * 100),
    coveredStandards,
    partialStandards,
    missingStandards,
  };
}

export function getStandardStatus(standardId: string, evidences: Evidence[]): "complete" | "partial" | "missing" {
  const progress = getStandardProgress(standardId, evidences);
  if (progress.percentage === 100) return "complete";
  if (progress.percentage > 0) return "partial";
  return "missing";
}
