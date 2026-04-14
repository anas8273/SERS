// src/lib/static-tools-seed.ts
/**
 * Default seed data for the 16 static educational tools.
 * Used to initialize `static_tools` Firestore collection on first admin visit.
 * Converted from hardcoded constants in documentation-forms and other pages.
 */
import type { StaticTool, StaticForm, StaticFormField } from '@/types';

let _fieldSortOrder = 0;
function field(
    key: string,
    label_ar: string,
    type: StaticFormField['type'],
    opts: Partial<StaticFormField> = {}
): StaticFormField {
    return {
        id: `f_${key}_${++_fieldSortOrder}`,
        key,
        label_ar,
        type,
        sort_order: _fieldSortOrder,
        is_visible: true,
        ...opts,
    };
}

function form(
    id: string,
    title_ar: string,
    description_ar: string,
    fields: StaticFormField[],
    opts: Partial<StaticForm> = {}
): StaticForm {
    return {
        id,
        title_ar,
        description_ar,
        fields,
        sort_order: 1,
        is_active: true,
        ...opts,
    };
}

export const DEFAULT_STATIC_TOOLS: Omit<StaticTool, 'id'>[] = [

    // ─── 1. نماذج وتقارير التوثيق ────────────────────────────────────────────
    {
        title_ar: 'نماذج وتقارير التوثيق',
        title_en: 'Documentation Forms',
        description_ar: 'نماذج احترافية لتوثيق البرامج والأنشطة والتقارير بتصاميم جاهزة',
        icon: 'ClipboardList',
        gradient: 'from-blue-600 to-blue-700',
        href: '/documentation-forms',
        sort_order: 1,
        is_active: true,
        forms: [
            form('program-activity-advanced',
                'نموذج توثيق برنامج أو نشاط (المطور)',
                'نموذج توثيق يقبل رفع شاهد واحد كحد أدنى وشاهدين كحد أقصى مع إمكانية وضع رابط يتحول لباركود',
                [
                    field('education_dept',    'إدارة التعليم',             'text',     { placeholder_ar: 'الإدارة العامة للتعليم بالمنطقة', required: true }),
                    field('school_name',       'اسم المدرسة',               'text',     { placeholder_ar: 'مدرسة', required: true }),
                    field('program_name',      'اسم البرنامج / المبادرة',   'text',     { placeholder_ar: 'تقرير الاحتفاء باليوم الوطني ٩٥', required: true }),
                    field('implementors',      'المنفذ/ون',                 'text',     { placeholder_ar: 'جميع منسوبي المدرسة' }),
                    field('participants',      'المشاركـ/ون',               'text',     { placeholder_ar: 'أولياء الأمور' }),
                    field('location',          'مكان التنفيذ',              'text',     { placeholder_ar: 'فناء المدرسة' }),
                    field('duration',          'مدة التنفيذ',               'text',     { placeholder_ar: 'يوم واحد' }),
                    field('date',              'تاريخ التنفيذ',             'text',     { placeholder_ar: '١/٤/١٤٤٧هـ' }),
                    field('beneficiaries',     'المستفيدون / عددهم',        'text',     { placeholder_ar: 'منسوبي المدرسة / أولياء الأمور' }),
                    field('domain',            'المجال',                    'text',     { placeholder_ar: 'المواطنة' }),
                    field('objectives',        'الأهداف',                   'textarea', { rows: 5, placeholder_ar: 'تعزيز الهوية الوطنية والانتماء...' }),
                    field('steps',             'خطوات التنفيذ / الوصف',     'textarea', { rows: 5 }),
                    field('right_signature_title', 'وظيفة التوقيع الأيمن', 'text',     { placeholder_ar: 'رائد النشاط' }),
                    field('right_signature_name',  'الاسم (توقيع أيمن)',    'text',     { placeholder_ar: 'الاسم' }),
                    field('left_signature_title',  'وظيفة التوقيع الأيسر', 'text',     { placeholder_ar: 'مدير المدرسة' }),
                    field('left_signature_name',   'الاسم (توقيع أيسر)',    'text',     { placeholder_ar: 'الاسم' }),
                    field('image1',            'صورة الشاهد الأول',         'image',    { required: true }),
                    field('image2',            'صورة الشاهد الثاني (اختياري)', 'image' ),
                    field('evidence_url',      'رابط الشواهد (باركود تلقائي)', 'url',  { placeholder_ar: 'سيتم إنشاء باركود تلقائياً' }),
                ],
                { badge: 'الأكثر استخداماً', gradient: 'from-blue-500 to-blue-600' }
            ),
            form('strategy-brief',
                'نموذج تنفيذ استراتيجية مختصرة',
                'نموذج مختصر لتوثيق تنفيذ استراتيجية تعليمية',
                [
                    field('education_dept', 'إدارة التعليم/المنطقة/مكتب التعليم', 'textarea', { rows: 3 }),
                    field('school_name',    'اسم المدرسة',                'text',     { required: true }),
                    field('date',           'تاريخ التنفيذ',              'text' ),
                    field('subject',        'المادة',                     'text' ),
                    field('strategy',       'استراتيجية التعلم',          'text',     { required: true }),
                    field('students_count', 'عدد المستفيدين',             'text' ),
                    field('grade',          'المرحلة الدراسية',           'text' ),
                    field('class',          'الفصل',                      'text' ),
                    field('lesson',         'اسم الدرس',                  'text' ),
                    field('objectives',     'الأهداف',                    'textarea', { rows: 5 }),
                    field('teacher_name',   'اسم المعلم',                 'textarea', { rows: 2 }),
                    field('other_name',     'اسم آخر',                    'textarea', { rows: 2 }),
                    field('twitter',        'حساب تويتر',                 'text',     { placeholder_ar: '@' }),
                    field('image1',         'الشاهد الأول',               'image' ),
                    field('image2',         'الشاهد الثاني',              'image' ),
                ],
                { gradient: 'from-emerald-500 to-green-600' }
            ),
            form('program-coverage',
                'تقرير تنفيذ برنامج (تغطية)',
                'تقرير تغطية لتنفيذ برنامج مع شاهد واحد',
                [
                    field('education_dept', 'إدارة التعليم', 'textarea', { rows: 3 }),
                    field('edu_office',     'مكتب التعليم',  'text' ),
                    field('program_name',   'اسم البرنامج',  'text', { required: true }),
                    field('date',           'تاريخ التنفيذ', 'text' ),
                    field('targets',        'المستهدفون',    'text' ),
                    field('domain',         'المجال',        'text' ),
                    field('objectives',     'الأهداف',       'textarea', { rows: 5 }),
                    field('steps',          'خطوات التنفيذ', 'textarea', { rows: 5 }),
                    field('image1',         'الشاهد الأول',  'image' ),
                    field('image2',         'الشاهد الثاني', 'image' ),
                    field('image3',         'الشاهد الثالث', 'image' ),
                    field('teacher_name',   'اسم المعلم/ة',  'textarea', { rows: 4 }),
                ],
                { gradient: 'from-violet-500 to-purple-600' }
            ),
        ],
    },

    // ─── 2. شواهد الأداء الجاهزة ─────────────────────────────────────────────
    {
        title_ar: 'شواهد الأداء الجاهزة',
        title_en: 'Performance Evidence Forms',
        description_ar: 'نماذج جاهزة لتوثيق شواهد الأداء الوظيفي المعتمدة',
        icon: 'ClipboardCheck',
        gradient: 'from-violet-600 to-purple-700',
        href: '/performance-evidence-forms',
        sort_order: 2,
        is_active: true,
        forms: [
            form('performance-evidence',
                'نموذج شاهد أداء وظيفي',
                'نموذج موحد لتوثيق شواهد الأداء الوظيفي الـ 11 بند المعتمدة',
                [
                    field('evidence_title',    'عنوان الشاهد',     'text',     { required: true }),
                    field('evidence_number',   'رقم البند',        'text' ),
                    field('school_name',       'اسم المدرسة',      'text',     { required: true }),
                    field('teacher_name',      'اسم المعلم/ة',     'text',     { required: true }),
                    field('academic_year',     'العام الدراسي',    'text' ),
                    field('description',       'وصف الشاهد',       'textarea', { rows: 4 }),
                    field('objectives',        'الأهداف',          'textarea', { rows: 3 }),
                    field('date',              'التاريخ',          'text' ),
                    field('image1',            'صورة الشاهد',      'image' ),
                    field('image2',            'صورة إضافية',      'image' ),
                    field('evidence_url',      'رابط الشاهد',      'url' ),
                    field('supervisor_name',   'اسم المشرف',       'text' ),
                    field('principal_name',    'اسم المدير',       'text' ),
                ],
                { gradient: 'from-violet-500 to-purple-600' }
            ),
        ],
    },

    // ─── 3. عناصر تقييم المعلمين ──────────────────────────────────────────────
    {
        title_ar: 'عناصر تقييم المعلمين',
        title_en: 'Teacher Evaluation Forms',
        description_ar: 'نماذج عناصر تقييم المعلمين ومؤشرات الأداء المهني',
        icon: 'GraduationCap',
        gradient: 'from-emerald-600 to-green-700',
        href: '/teacher-evaluation-forms',
        sort_order: 3,
        is_active: true,
        forms: [
            form('teacher-eval-main',
                'نموذج تقييم المعلم',
                'نموذج تقييم أداء المعلم وفق المعايير المهنية',
                [
                    field('school_name',       'اسم المدرسة',        'text',     { required: true }),
                    field('teacher_name',      'اسم المعلم/ة',       'text',     { required: true }),
                    field('subject',           'المادة',             'text' ),
                    field('grade',             'المرحلة الدراسية',   'text' ),
                    field('semester',          'الفصل الدراسي',      'text' ),
                    field('academic_year',     'العام الدراسي',      'text' ),
                    field('evaluation_date',   'تاريخ التقييم',      'text' ),
                    field('performance_notes', 'ملاحظات الأداء',     'textarea', { rows: 4 }),
                    field('strengths',         'نقاط القوة',         'textarea', { rows: 3 }),
                    field('improvements',      'مجالات التحسين',     'textarea', { rows: 3 }),
                    field('evaluator_name',    'اسم المقيّم',        'text' ),
                    field('principal_name',    'مدير المدرسة',       'text' ),
                ],
                { gradient: 'from-emerald-500 to-green-600' }
            ),
        ],
    },

    // ─── 4. أدوات تحليل النتائج ───────────────────────────────────────────────
    {
        title_ar: 'أدوات تحليل النتائج',
        title_en: 'Results Analysis Tools',
        description_ar: 'أدوات تحليل نتائج الاختبارات واستخراج الإحصائيات التفصيلية',
        icon: 'BarChart3',
        gradient: 'from-cyan-600 to-teal-700',
        href: '/results-analysis-tools',
        sort_order: 4,
        is_active: true,
        forms: [
            form('results-analysis',
                'نموذج تحليل النتائج',
                'نموذج لإدخال نتائج الطلاب وتحليلها إحصائياً',
                [
                    field('school_name',   'اسم المدرسة',      'text',     { required: true }),
                    field('subject',       'المادة',           'text',     { required: true }),
                    field('grade',         'الصف',             'text' ),
                    field('semester',      'الفصل الدراسي',    'text' ),
                    field('test_date',     'تاريخ الاختبار',   'text' ),
                    field('total_marks',   'الدرجة الكلية',    'number' ),
                    field('pass_mark',     'درجة النجاح',       'number' ),
                    field('students_data', 'بيانات الطلاب (اسم ودرجة لكل طالب في سطر)', 'textarea', { rows: 10 }),
                    field('teacher_name',  'اسم المعلم/ة',     'text' ),
                    field('notes',         'ملاحظات',          'textarea', { rows: 3 }),
                ],
                { gradient: 'from-cyan-500 to-teal-600' }
            ),
        ],
    },

    // ─── 5. الخطة الأسبوعية ───────────────────────────────────────────────────
    {
        title_ar: 'الخطة الأسبوعية',
        title_en: 'Weekly Plan Builder',
        description_ar: 'إنشاء الخطط الأسبوعية المنهجية بتصاميم احترافية',
        icon: 'CalendarDays',
        gradient: 'from-amber-600 to-orange-600',
        href: '/weekly-plan-builder',
        sort_order: 5,
        is_active: true,
        forms: [
            form('weekly-plan',
                'الخطة الأسبوعية',
                'نموذج الخطة الأسبوعية للتدريس',
                [
                    field('school_name',  'اسم المدرسة',      'text',     { required: true }),
                    field('teacher_name', 'اسم المعلم/ة',     'text',     { required: true }),
                    field('subject',      'المادة',           'text',     { required: true }),
                    field('grade',        'الصف',             'text' ),
                    field('week_from',    'من تاريخ',         'text' ),
                    field('week_to',      'إلى تاريخ',        'text' ),
                    field('unit_name',    'اسم الوحدة',       'text' ),
                    field('lesson_1',     'الدرس – الأحد',    'text' ),
                    field('lesson_2',     'الدرس – الاثنين',  'text' ),
                    field('lesson_3',     'الدرس – الثلاثاء', 'text' ),
                    field('lesson_4',     'الدرس – الأربعاء', 'text' ),
                    field('lesson_5',     'الدرس – الخميس',   'text' ),
                    field('objectives',   'الأهداف العامة',   'textarea', { rows: 3 }),
                    field('resources',    'المصادر والوسائل', 'textarea', { rows: 2 }),
                    field('notes',        'ملاحظات',          'textarea', { rows: 2 }),
                ],
                { gradient: 'from-amber-500 to-orange-600' }
            ),
        ],
    },

    // ─── 6. شهادات شكر وتقدير ────────────────────────────────────────────────
    {
        title_ar: 'شهادات شكر وتقدير',
        title_en: 'Appreciation Certificates',
        description_ar: 'إنشاء شهادات الشكر والتقدير بتصاميم احترافية متعددة',
        icon: 'Award',
        gradient: 'from-yellow-500 to-amber-600',
        href: '/appreciation-certificates',
        sort_order: 6,
        is_active: true,
        forms: [
            form('appreciation-cert',
                'شهادة شكر وتقدير',
                'نموذج إنشاء شهادة شكر وتقدير احترافية',
                [
                    field('recipient_name',  'اسم المُكرَّم/ة',      'text',     { required: true }),
                    field('recipient_title', 'الوظيفة/المنصب',       'text' ),
                    field('issuer_name',     'جهة الإصدار',           'text',     { required: true }),
                    field('reason',          'سبب التكريم',           'textarea', { rows: 3 }),
                    field('date',            'تاريخ الإصدار',         'text' ),
                    field('school_name',     'اسم المدرسة',           'text' ),
                    field('principal_name',  'مدير المدرسة',          'text' ),
                    field('supervisor_name', 'اسم مدير التعليم',      'text' ),
                    field('logo',            'شعار المدرسة',          'image' ),
                ],
                { gradient: 'from-yellow-500 to-amber-600' }
            ),
        ],
    },

    // ─── 7. شهادات متنوعة ────────────────────────────────────────────────────
    {
        title_ar: 'شهادات متنوعة',
        title_en: 'Various Certificates',
        description_ar: 'شهادات تخرج، مشاركة، إنجاز، وتدريب بتصاميم متعددة',
        icon: 'Award',
        gradient: 'from-orange-500 to-red-600',
        href: '/other-certificates',
        sort_order: 7,
        is_active: true,
        forms: [
            form('participation-cert',
                'شهادة مشاركة',
                'شهادة مشاركة في برامج وفعاليات تعليمية',
                [
                    field('recipient_name',  'اسم المشارك/ة',    'text',     { required: true }),
                    field('event_name',      'اسم البرنامج/الفعالية', 'text', { required: true }),
                    field('date',            'تاريخ الفعالية',   'text' ),
                    field('duration',        'مدة الفعالية',     'text' ),
                    field('issuer',          'جهة الإصدار',      'text' ),
                    field('school_name',     'اسم المدرسة',      'text' ),
                    field('notes',           'ملاحظات',          'textarea', { rows: 2 }),
                ],
                { gradient: 'from-orange-500 to-amber-600' }
            ),
        ],
    },

    // ─── 8. المجتمع المهني ────────────────────────────────────────────────────
    {
        title_ar: 'المجتمع المهني',
        title_en: 'Professional Community',
        description_ar: 'نماذج المجتمعات المهنية التعلمية وتوثيق اجتماعاتها',
        icon: 'Users',
        gradient: 'from-indigo-600 to-blue-700',
        href: '/professional-community',
        sort_order: 8,
        is_active: true,
        forms: [
            form('professional-community-meeting',
                'محضر اجتماع المجتمع المهني',
                'توثيق اجتماع المجتمع المهني التعلمي',
                [
                    field('community_name',  'اسم المجتمع المهني',  'text',     { required: true }),
                    field('school_name',     'اسم المدرسة',         'text',     { required: true }),
                    field('meeting_date',    'تاريخ الاجتماع',      'text' ),
                    field('meeting_time',    'وقت الاجتماع',        'text' ),
                    field('venue',           'مكان الاجتماع',       'text' ),
                    field('attendees',       'أسماء الحضور',        'textarea', { rows: 4 }),
                    field('agenda',          'جدول الأعمال',        'textarea', { rows: 4 }),
                    field('decisions',       'القرارات والتوصيات',   'textarea', { rows: 4 }),
                    field('next_meeting',    'موعد الاجتماع القادم', 'text' ),
                    field('facilitator',     'المُيَسِّر/ة',        'text' ),
                    field('recorder',        'المُدَوِّن/ة',        'text' ),
                    field('image1',          'صورة توثيقية',        'image' ),
                ],
                { gradient: 'from-indigo-500 to-blue-600' }
            ),
        ],
    },

    // ─── 9. المبادرات المدرسية ────────────────────────────────────────────────
    {
        title_ar: 'المبادرات المدرسية',
        title_en: 'School Initiatives',
        description_ar: 'توثيق المبادرات المدرسية الإبداعية وتقاريرها',
        icon: 'Sparkles',
        gradient: 'from-pink-600 to-rose-700',
        href: '/school-initiatives',
        sort_order: 9,
        is_active: true,
        forms: [
            form('initiative-report',
                'تقرير مبادرة مدرسية',
                'نموذج توثيق المبادرات المدرسية',
                [
                    field('initiative_name', 'اسم المبادرة',      'text',     { required: true }),
                    field('school_name',     'اسم المدرسة',       'text',     { required: true }),
                    field('initiator',       'صاحب المبادرة',     'text' ),
                    field('start_date',      'تاريخ البدء',       'text' ),
                    field('end_date',        'تاريخ الانتهاء',    'text' ),
                    field('objectives',      'أهداف المبادرة',    'textarea', { rows: 4 }),
                    field('description',     'وصف المبادرة',      'textarea', { rows: 4 }),
                    field('beneficiaries',   'المستفيدون',        'text' ),
                    field('results',         'النتائج والمؤشرات', 'textarea', { rows: 3 }),
                    field('image1',          'صورة المبادرة',     'image' ),
                    field('image2',          'صورة إضافية',       'image' ),
                    field('evidence_url',    'رابط الشواهد',      'url' ),
                ],
                { gradient: 'from-pink-500 to-rose-600' }
            ),
        ],
    },

    // ─── 10. تحسين النتائج ───────────────────────────────────────────────────
    {
        title_ar: 'تحسين النتائج',
        title_en: 'Improve Results',
        description_ar: 'خطط وبرامج تحسين نتائج الطلاب والارتقاء بمستوياتهم',
        icon: 'TrendingUp',
        gradient: 'from-green-600 to-emerald-700',
        href: '/improve-results',
        sort_order: 10,
        is_active: true,
        forms: [
            form('improvement-plan',
                'خطة تحسين النتائج',
                'نموذج خطة تحسين نتائج الطلاب',
                [
                    field('school_name',     'اسم المدرسة',          'text',     { required: true }),
                    field('teacher_name',    'اسم المعلم/ة',         'text',     { required: true }),
                    field('subject',         'المادة',               'text' ),
                    field('grade',           'الصف',                 'text' ),
                    field('current_results', 'النتائج الحالية',       'textarea', { rows: 3 }),
                    field('target_results',  'النتائج المستهدفة',     'textarea', { rows: 3 }),
                    field('weak_areas',      'مواطن الضعف',          'textarea', { rows: 4 }),
                    field('interventions',   'التدخلات والإجراءات',   'textarea', { rows: 5 }),
                    field('timeline',        'الجدول الزمني',        'text' ),
                    field('resources',       'الموارد المطلوبة',     'textarea', { rows: 3 }),
                    field('evaluation',      'أسلوب التقييم',        'textarea', { rows: 3 }),
                    field('principal_name',  'مدير المدرسة',         'text' ),
                ],
                { gradient: 'from-green-500 to-emerald-600' }
            ),
        ],
    },

    // ─── 11. تحليل نتائج الاختبارات ──────────────────────────────────────────
    {
        title_ar: 'تحليل نتائج الاختبارات',
        title_en: 'Analyze Test Results',
        description_ar: 'أداة تحليل نتائج الاختبارات واستخراج التقارير الإحصائية',
        icon: 'PieChart',
        gradient: 'from-blue-700 to-indigo-800',
        href: '/analyze-results',
        sort_order: 11,
        is_active: true,
        forms: [
            form('test-analysis',
                'تحليل نتائج اختبار',
                'إدخال نتائج الطلاب وتحليلها إحصائياً',
                [
                    field('school_name',   'اسم المدرسة',    'text',     { required: true }),
                    field('subject',       'المادة',         'text',     { required: true }),
                    field('grade',         'الصف',           'text' ),
                    field('test_type',     'نوع الاختبار',   'select',   { options: ['اختبار قصير','اختبار نصفي','اختبار نهائي','اختبار تشخيصي'] }),
                    field('total_marks',   'الدرجة الكلية',  'number' ),
                    field('pass_mark',     'درجة النجاح',    'number' ),
                    field('test_date',     'تاريخ الاختبار', 'text' ),
                    field('students_data', 'أسماء الطلاب ودرجاتهم (اسم: درجة في كل سطر)', 'textarea', { rows: 12 }),
                    field('teacher_name',  'اسم المعلم/ة',   'text' ),
                ],
                { gradient: 'from-blue-600 to-indigo-700' }
            ),
        ],
    },

    // ─── 12. التقاويم الأكاديمية ──────────────────────────────────────────────
    {
        title_ar: 'التقاويم الأكاديمية',
        title_en: 'Academic Calendars',
        description_ar: 'إنشاء التقاويم الأكاديمية الدراسية بتصاميم احترافية',
        icon: 'CalendarDays',
        gradient: 'from-teal-600 to-cyan-700',
        href: '/academic-calendars',
        sort_order: 12,
        is_active: true,
        forms: [
            form('academic-calendar',
                'التقويم الأكاديمي',
                'نموذج إنشاء التقويم الأكاديمي',
                [
                    field('school_name',     'اسم المدرسة',        'text',     { required: true }),
                    field('academic_year',   'العام الدراسي',       'text',     { required: true }),
                    field('first_semester_start', 'بداية الفصل الأول',  'text' ),
                    field('first_semester_end',   'نهاية الفصل الأول',  'text' ),
                    field('second_semester_start','بداية الفصل الثاني', 'text' ),
                    field('second_semester_end',  'نهاية الفصل الثاني', 'text' ),
                    field('holidays',        'الإجازات والعطل',     'textarea', { rows: 5 }),
                    field('events',          'الأحداث المدرسية',    'textarea', { rows: 5 }),
                    field('exams_schedule',  'جدول الاختبارات',     'textarea', { rows: 4 }),
                    field('principal_name',  'مدير المدرسة',        'text' ),
                ],
                { gradient: 'from-teal-500 to-cyan-600' }
            ),
        ],
    },

    // ─── 13. البيئة المدرسية ──────────────────────────────────────────────────
    {
        title_ar: 'البيئة المدرسية',
        title_en: 'School Environment',
        description_ar: 'نماذج تقييم وتوثيق البيئة المدرسية الجاذبة',
        icon: 'BookOpen',
        gradient: 'from-lime-600 to-green-700',
        href: '/school-environment',
        sort_order: 13,
        is_active: true,
        forms: [
            form('school-env-assessment',
                'تقييم البيئة المدرسية',
                'نموذج تقييم عناصر البيئة المدرسية الجاذبة',
                [
                    field('school_name',     'اسم المدرسة',        'text',     { required: true }),
                    field('evaluation_date', 'تاريخ التقييم',       'text' ),
                    field('evaluator',       'اسم المُقيِّم',       'text' ),
                    field('physical_env',    'البيئة المادية',      'textarea', { rows: 3 }),
                    field('educational_env', 'البيئة التعليمية',    'textarea', { rows: 3 }),
                    field('social_env',      'البيئة الاجتماعية',   'textarea', { rows: 3 }),
                    field('safety',          'الأمن والسلامة',      'textarea', { rows: 3 }),
                    field('strengths',       'نقاط القوة',          'textarea', { rows: 3 }),
                    field('improvements',    'المقترحات والتحسينات', 'textarea', { rows: 3 }),
                    field('image1',          'صورة البيئة',         'image' ),
                    field('image2',          'صورة إضافية',         'image' ),
                ],
                { gradient: 'from-lime-500 to-green-600' }
            ),
        ],
    },

    // ─── 14. تفاعل أولياء الأمور ─────────────────────────────────────────────
    {
        title_ar: 'تفاعل أولياء الأمور',
        title_en: 'Parents Interaction',
        description_ar: 'نماذج وأدوار التواصل والتفاعل مع أولياء الأمور',
        icon: 'Users',
        gradient: 'from-sky-600 to-blue-700',
        href: '/parents-interaction',
        sort_order: 14,
        is_active: true,
        forms: [
            form('parent-meeting',
                'محضر اجتماع أولياء الأمور',
                'توثيق اجتماعات أولياء الأمور وقراراتها',
                [
                    field('school_name',    'اسم المدرسة',          'text',     { required: true }),
                    field('meeting_date',   'تاريخ الاجتماع',       'text' ),
                    field('meeting_time',   'وقت الاجتماع',         'text' ),
                    field('venue',          'مكان الاجتماع',        'text' ),
                    field('attendees_count','عدد الحضور',           'number' ),
                    field('agenda',         'جدول الأعمال',         'textarea', { rows: 4 }),
                    field('discussion',     'ما دار في الاجتماع',   'textarea', { rows: 5 }),
                    field('decisions',      'القرارات والتوصيات',    'textarea', { rows: 4 }),
                    field('facilitator',    'رئيس الاجتماع',        'text' ),
                    field('recorder',       'المُدَوِّن/ة',         'text' ),
                    field('image1',         'صورة الاجتماع',        'image' ),
                ],
                { gradient: 'from-sky-500 to-blue-600' }
            ),
        ],
    },

    // ─── 15. لوحات وبنرات ────────────────────────────────────────────────────
    {
        title_ar: 'لوحات وبنرات',
        title_en: 'Signs & Banners',
        description_ar: 'تصميم لوحات وبنرات مدرسية بأحجام ومحتويات مخصصة',
        icon: 'Layers',
        gradient: 'from-slate-600 to-gray-700',
        href: '/signs-banners',
        sort_order: 15,
        is_active: true,
        forms: [
            form('banner-design',
                'تصميم لوحة أو بنر',
                'نموذج تصميم لوحة أو بنر مدرسي',
                [
                    field('title',       'عنوان اللوحة',          'text',     { required: true }),
                    field('subtitle',    'العنوان الفرعي',         'text' ),
                    field('school_name', 'اسم المدرسة',            'text' ),
                    field('body_text',   'النص الرئيسي',           'textarea', { rows: 5 }),
                    field('size',        'حجم اللوحة',             'select',   { options: ['A4 عمودي','A4 أفقي','A3 عمودي','A3 أفقي','50×70cm','100×80cm'] }),
                    field('image1',      'صورة رئيسية',            'image' ),
                    field('logo',        'شعار المدرسة',           'image' ),
                    field('date',        'التاريخ',                'text' ),
                    field('notes',       'ملاحظات التصميم',        'textarea', { rows: 2 }),
                ],
                { gradient: 'from-slate-500 to-gray-600' }
            ),
        ],
    },

    // ─── 16. استبيانات أنماط التعلم ───────────────────────────────────────────
    {
        title_ar: 'استبيانات أنماط التعلم',
        title_en: 'Learning Style Surveys',
        description_ar: 'استبيانات تحديد أنماط التعلم وتوزيع الطلاب وفق أسلوب تعلمهم',
        icon: 'Brain',
        gradient: 'from-purple-600 to-violet-700',
        href: '/learning-style-surveys',
        sort_order: 16,
        is_active: true,
        forms: [
            form('learning-style-survey',
                'استبيان أنماط التعلم',
                'استبيان تحديد نمط التعلم المفضل للطالب',
                [
                    field('school_name',    'اسم المدرسة',          'text',     { required: true }),
                    field('student_name',   'اسم الطالب/ة',         'text',     { required: true }),
                    field('grade',          'الصف',                 'text' ),
                    field('date',           'التاريخ',              'text' ),
                    field('visual_score',   'الدرجة: النمط البصري', 'number' ),
                    field('audio_score',    'الدرجة: النمط السمعي', 'number' ),
                    field('kinetic_score',  'الدرجة: النمط الحركي', 'number' ),
                    field('reading_score',  'الدرجة: نمط القراءة',  'number' ),
                    field('dominant_style', 'النمط السائد',         'text' ),
                    field('recommendations', 'التوصيات التعليمية',  'textarea', { rows: 4 }),
                    field('teacher_name',   'اسم المعلم/ة',         'text' ),
                ],
                { gradient: 'from-purple-500 to-violet-600' }
            ),
        ],
    },
];
