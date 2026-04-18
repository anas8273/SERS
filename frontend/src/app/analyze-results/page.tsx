'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart2, Eye, Download, RotateCcw, ChevronRight, Image as FileText, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import { useAIFieldFill } from '@/hooks/useAIFieldFill';

interface FieldDef { key: string; label: string; type: 'text' | 'textarea' | 'image'; placeholder?: string; rows?: number; required?: boolean; }
interface FormDef { id: string; title: string; description: string; gradient: string; badge?: string; fields: FieldDef[]; }

const FORMS: FormDef[] = [
    {
        id: 'skills-analysis',
        title: ta('تقرير تحليل نتائج المهارات (ابتدائي)', 'Skills Analysis Report (Elementary)'),
        description: ta('تقرير تحليل نتائج مهارات الطلاب في المرحلة الابتدائية مع رسوم بيانية', 'Student Skills Analysis Report for Primary Stage with Charts'),
        gradient: 'from-cyan-600 to-teal-700',
        badge: 'الأكثر استخداماً',
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'academic_year', label: ta('العام الدراسي', 'Academic Year'), type: 'text', placeholder: ta('١٤٤٧هـ', '1447H') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الفصل الدراسي الأول', 'First Academic Semester') },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('الرياضيات', 'Mathematics'), required: true },
            { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('الثالث الابتدائي', 'Third Primary Grade'), required: true },
            { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
            { key: 'students_count', label: ta('عدد الطلاب', 'Number of Students'), type: 'text', placeholder: ta('٣٠', '30') },
            { key: 'exam_type', label: ta('نوع الاختبار', 'Test Type'), type: 'text', placeholder: ta('اختبار الفصل الأول', 'First Semester Test') },
            { key: 'skills', label: ta('المهارات المقيّمة والنتائج', 'Assessed Skills and Results'), type: 'textarea', placeholder: 'المهارة الأولى: ...... - نسبة الإتقان: ٨٥٪\nالمهارة الثانية: ...... - نسبة الإتقان: ٧٢٪\nالمهارة الثالثة: ...... - نسبة الإتقان: ٩٠٪', rows: 6 },
            { key: 'analysis', label: ta('تحليل النتائج', 'Results Analysis'), type: 'textarea', placeholder: ta('تحليل شامل لنتائج الطلاب في المهارات المختلفة...', 'Comprehensive analysis of student results in various skills...'), rows: 4 },
            { key: 'recommendations', label: ta('التوصيات والخطة العلاجية', 'Recommendations and Remedial Plan'), type: 'textarea', placeholder: ta('١. التوصية الأولى.\n٢. التوصية الثانية.\n٣. التوصية الثالثة.', '١. التوصية الأولى.\\n٢. التوصية الثانية.\\n٣. التوصية الثالثة.'), rows: 4 },
            { key: 'right_sig', label: ta('وظيفة واسم التوقيع الأيمن', 'Right Signature Name & Title'), type: 'textarea', placeholder: ta('المعلم\nالاسم', 'المعلم\\nالاسم'), rows: 2 },
            { key: 'left_sig', label: ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title'), type: 'textarea', placeholder: ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم'), rows: 2 },
        ],
    },
    {
        id: 'exam-analysis',
        title: ta('تقرير تحليل نتائج اختبار', 'Test Results Analysis Report'),
        description: ta('تقرير تحليل شامل لنتائج اختبار مع إحصائيات وتوزيع الدرجات', 'Comprehensive test results analysis report with statistics and grade distribution'),
        gradient: 'from-teal-600 to-emerald-700',
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'academic_year', label: ta('العام الدراسي', 'Academic Year'), type: 'text', placeholder: ta('١٤٤٧هـ', '1447H') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الفصل الدراسي الأول', 'First Academic Semester') },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('الرياضيات', 'Mathematics'), required: true },
            { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('ثاني متوسط', 'Second Intermediate'), required: true },
            { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
            { key: 'exam_type', label: ta('نوع الاختبار', 'Test Type'), type: 'text', placeholder: ta('الاختبار النهائي', 'Final Exam') },
            { key: 'students_count', label: ta('عدد الطلاب', 'Number of Students'), type: 'text', placeholder: ta('٣٠', '30') },
            { key: 'pass_count', label: ta('عدد الناجحين', 'Number of Passers'), type: 'text', placeholder: ta('٢٥', '25') },
            { key: 'fail_count', label: ta('عدد الراسبين', 'Number of Failures'), type: 'text', placeholder: '٥' },
            { key: 'highest', label: ta('أعلى درجة', 'Highest Grade'), type: 'text', placeholder: ta('١٠٠', '100') },
            { key: 'lowest', label: ta('أدنى درجة', 'Lowest Score'), type: 'text', placeholder: ta('٤٥', '45') },
            { key: 'average', label: ta('المتوسط العام', 'Overall Average'), type: 'text', placeholder: ta('٧٨', '78') },
            { key: 'distribution', label: ta('توزيع الدرجات', 'Grade Distribution'), type: 'textarea', placeholder: ta('ممتاز (٩٠-١٠٠): ٨ طلاب\nجيد جداً (٨٠-٨٩): ١٠ طلاب\nجيد (٧٠-٧٩): ٧ طلاب\nمقبول (٦٠-٦٩): ٣ طلاب\nضعيف (أقل من ٦٠): ٢ طلاب', 'ممتاز (٩٠-١٠٠): ٨ طلاب\\nجيد جداً (٨٠-٨٩): ١٠ طلاب\\nجيد (٧٠-٧٩): ٧ طلاب\\nمقبول (٦٠-٦٩): ٣ طلاب\\nضعيف (أقل من ٦٠): ٢ طلاب'), rows: 5 },
            { key: 'analysis', label: ta('تحليل النتائج', 'Results Analysis'), type: 'textarea', placeholder: ta('تحليل شامل لنتائج الاختبار...', 'Comprehensive test analysis...'), rows: 4 },
            { key: 'recommendations', label: ta('التوصيات', 'Recommendations'), type: 'textarea', placeholder: ta('١. التوصية الأولى.\n٢. التوصية الثانية.', '١. التوصية الأولى.\\n٢. التوصية الثانية.'), rows: 3 },
            { key: 'right_sig', label: ta('وظيفة واسم التوقيع الأيمن', 'Right Signature Name & Title'), type: 'textarea', placeholder: ta('المعلم\nالاسم', 'المعلم\\nالاسم'), rows: 2 },
            { key: 'left_sig', label: ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title'), type: 'textarea', placeholder: ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم'), rows: 2 },
        ],
    },
    {
        id: 'pre-post-analysis',
        title: ta('تحليل نتائج الاختبار القبلي والبعدي', 'Pre and Post Test Results Analysis'),
        description: ta('تقرير مقارنة نتائج الاختبار القبلي والبعدي لقياس أثر التدريس', 'Pre/Post test comparison report to measure teaching impact'),
        gradient: 'from-emerald-600 to-green-700',
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'academic_year', label: ta('العام الدراسي', 'Academic Year'), type: 'text', placeholder: ta('١٤٤٧هـ', '1447H') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الفصل الدراسي الأول', 'First Academic Semester') },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('الرياضيات', 'Mathematics'), required: true },
            { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('ثاني متوسط', 'Second Intermediate'), required: true },
            { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
            { key: 'students_count', label: ta('عدد الطلاب', 'Number of Students'), type: 'text', placeholder: ta('٣٠', '30') },
            { key: 'pre_average', label: ta('متوسط الاختبار القبلي', 'Pre-test Average'), type: 'text', placeholder: ta('٥٥', '55') },
            { key: 'post_average', label: ta('متوسط الاختبار البعدي', 'Post-test Average'), type: 'text', placeholder: ta('٧٨', '78') },
            { key: 'improvement', label: ta('نسبة التحسن', 'Improvement Rate'), type: 'text', placeholder: ta('٤١٪', '41%') },
            { key: 'pre_results', label: ta('نتائج الاختبار القبلي التفصيلية', 'Detailed Pre-test Results'), type: 'textarea', placeholder: ta('ممتاز: ٢ طلاب\nجيد جداً: ٥ طلاب\nجيد: ٨ طلاب\nمقبول: ١٠ طلاب\nضعيف: ٥ طلاب', 'ممتاز: ٢ طلاب\\nجيد جداً: ٥ طلاب\\nجيد: ٨ طلاب\\nمقبول: ١٠ طلاب\\nضعيف: ٥ طلاب'), rows: 5 },
            { key: 'post_results', label: ta('نتائج الاختبار البعدي التفصيلية', 'Detailed Post-test Results'), type: 'textarea', placeholder: ta('ممتاز: ٨ طلاب\nجيد جداً: ١٢ طلاب\nجيد: ٧ طلاب\nمقبول: ٢ طلاب\nضعيف: ١ طالب', 'ممتاز: ٨ طلاب\\nجيد جداً: ١٢ طلاب\\nجيد: ٧ طلاب\\nمقبول: ٢ طلاب\\nضعيف: ١ طالب'), rows: 5 },
            { key: 'analysis', label: ta('تحليل المقارنة', 'Comparison Analysis'), type: 'textarea', placeholder: ta('تحليل الفرق بين نتائج الاختبارين...', 'Analysis of the difference between the two test results...'), rows: 4 },
            { key: 'recommendations', label: ta('التوصيات', 'Recommendations'), type: 'textarea', placeholder: ta('١. التوصية الأولى.\n٢. التوصية الثانية.', '١. التوصية الأولى.\\n٢. التوصية الثانية.'), rows: 3 },
            { key: 'right_sig', label: ta('وظيفة واسم التوقيع الأيمن', 'Right Signature Name & Title'), type: 'textarea', placeholder: ta('المعلم\nالاسم', 'المعلم\\nالاسم'), rows: 2 },
            { key: 'left_sig', label: ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title'), type: 'textarea', placeholder: ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم'), rows: 2 },
        ],
    },
    {
        id: 'diagnostic-test',
        title: ta('تقرير اختبار تشخيصي', 'Diagnostic Test Report'),
        description: ta('نموذج توثيق نتائج الاختبار التشخيصي وتحديد مستويات الطلاب', 'Diagnostic test documentation form and student level identification'),
        gradient: 'from-green-600 to-teal-700',
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'academic_year', label: ta('العام الدراسي', 'Academic Year'), type: 'text', placeholder: ta('١٤٤٧هـ', '1447H') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الفصل الدراسي الثاني', 'Second Academic Semester') },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('الرياضيات', 'Mathematics'), required: true },
            { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('ثاني متوسط ١', 'Second Intermediate 1'), required: true },
            { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
            { key: 'test_date', label: ta('تاريخ الاختبار', 'Test Date'), type: 'text', placeholder: ta('٢ من أكتوبر ١٤٤٧هـ', '2 October 1447H') },
            { key: 'students_count', label: ta('عدد المستهدفين', 'Number of Targets'), type: 'text', placeholder: ta('٣٣ طالباً', '33 Students') },
            { key: 'description', label: ta('الوصف', 'Description'), type: 'textarea', placeholder: 'يهدف الاختبار التشخيصي إلى الكشف عن المستوى الفعلي للطلاب والتعرف على الفجوات المعرفية والمهارية لديهم، مما يساعد في بناء خطة علاجية مناسبة وتوجيه جهود التدريس نحو تلبية احتياجاتهم الفعلية.', rows: 4 },
            { key: 'strengths', label: ta('نقاط القوة', 'Strengths'), type: 'textarea', placeholder: '١. تحديد نقاط الضعف المشتركة.\n٢. بناء أهداف علاجية واضحة.\n٣. تصنيف الطلاب في مجموعات متجانسة.\n٤. توجيه التدخلات في أسرع وقت ممكن.', rows: 4 },
            { key: 'weaknesses', label: ta('نقاط الضعف وأسبابها', 'Weaknesses and Their Causes'), type: 'textarea', placeholder: '١. ضعف بعض الطلاب وعدم وجود قاعدة معرفية سابقة.\n٢. تباين مستويات الطلاب القادمين من مدارس مختلفة.\n٣. قلة التركيز في أسلوب التعلم الذاتي.', rows: 4 },
            { key: 'recommendations', label: ta('التوصيات', 'Recommendations'), type: 'textarea', placeholder: '١. تطبيق خطة تعليمية تراعي الفروق الفردية بين المتعلمين.\n٢. تنويع أساليب التقييم لتشمل التقييم التكويني والختامي.\n٣. إشراك الطلاب في أنشطة تعليمية تفاعلية.\n٤. تطبيع العلاقة مع الطلاب لتحسين الدافعية التعليمية.', rows: 5 },
            { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image' },
            { key: 'image2', label: ta('صورة الشاهد الثاني', 'Second Evidence Image'), type: 'image' },
            { key: 'right_sig', label: ta('وظيفة واسم التوقيع الأيمن', 'Right Signature Name & Title'), type: 'textarea', placeholder: ta('المعلم\nالاسم', 'المعلم\\nالاسم'), rows: 2 },
            { key: 'left_sig', label: ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title'), type: 'textarea', placeholder: ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم'), rows: 2 },
        ],
    },
];

function FormFill({ form, onBack }: { form: FormDef; onBack: () => void }) {
  const { dir } = useTranslation();
    const [v, setV] = useState<Record<string, string>>({});
    const [images, setImages] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);
    const set = (k: string, val: string) => setV(p => ({ ...p, [k]: val }));
    const handleImage = (key: string, file: File) => {
        const r = new FileReader();
        r.onload = e => setImages(p => ({ ...p, [key]: e.target?.result as string }));
        r.readAsDataURL(file);
    };
    const imageFields = form.fields.filter(f => f.type === 'image');
    const nonImageFields = form.fields.filter(f => f.type !== 'image');
    const hasData = Object.keys(v).some(k => v[k]) || Object.keys(images).length > 0;
    const { fillField, fillAllFields, loadingField } = useAIFieldFill();

    const ImgField = ({ k, label }: { k: string; label: string }) => (
        <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
            {images[k] ? (
                <div className="relative">
                    <img src={images[k]} alt="" className="w-full h-28 object-cover rounded-lg border" />
                    <button onClick={() => setImages(p => { const n = { ...p }; delete n[k]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                </div>
            ) : (
                <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                    <span className="bg-gray-100 dark:bg-gray-700 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span>
                    <span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(k, e.target.files[0])} />
                </label>
            )}
        </div>
    );

    const PreviewContent = () => (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
            <div className={`bg-gradient-to-l ${form.gradient} p-5 text-white`}>
                <p className="text-xs opacity-80 mb-1">{ta('وزارة التعليم — تحليل نتائج المتعلمين', 'Ministry of Education — Learner Results Analysis')}</p>
                <h2 className="text-base font-black">{form.title}</h2>
                {v.edu_school && <p className="text-xs opacity-90 mt-1 whitespace-pre-line">{v.edu_school}</p>}
            </div>
            <div className="p-5 space-y-1.5 text-xs">
                {nonImageFields.filter(f => f.key !== 'edu_school').map(f =>
                    v[f.key] ? (
                        <div key={f.key} className="flex gap-2 border-b border-gray-100 pb-1">
                            <span className="font-bold text-gray-600 min-w-[100px] shrink-0">{f.label}:</span>
                            <span className="text-gray-800 whitespace-pre-wrap">{v[f.key]}</span>
                        </div>
                    ) : null
                )}
                {imageFields.some(f => images[f.key]) && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {imageFields.map(f => images[f.key] ? <img key={f.key} src={images[f.key]} alt={f.label} className="w-full h-24 object-cover rounded-lg border" /> : null)}
                    </div>
                )}
            </div>
            <div className={`bg-gradient-to-l ${form.gradient} text-white text-center py-2 text-xs font-bold`}>
                SERS — {ta('نظام السجلات التعليمية الذكية', 'Smart Educational Records System')}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة', 'Go Back')}
                </button>
                <div className="max-w-3xl mx-auto">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className={`bg-gradient-to-l ${form.gradient} text-white rounded-t-xl`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><BarChart2 className="w-5 h-5" /></div>
                                <div>
                                    <CardTitle className="text-sm">{form.title}</CardTitle>
                                    <CardDescription className="text-white/80 text-xs mt-0.5">{form.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {nonImageFields.map(field => (
                                <div key={field.key}>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                            {field.label}{field.required && <span className="text-red-500 me-1">*</span>}
                                        </label>
                                        {field.type === 'textarea' && (
                                            <button type="button" disabled={loadingField === field.key} onClick={() => fillField(field.key, field.label, form.title, v, set)} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50">
                                                {loadingField === field.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                {ta('تعبئة بالذكاء الاصطناعي', 'Fill with AI')}
                                            </button>
                                        )}
                                    </div>
                                    {field.type === 'textarea' ? (
                                        <Textarea rows={field.rows || 3} placeholder={field.placeholder} value={v[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="resize-y text-sm" />
                                    ) : (
                                        <Input placeholder={field.placeholder} value={v[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="text-sm" />
                                    )}
                                </div>
                            ))}
                            {imageFields.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {imageFields.map(f => <ImgField key={f.key} k={f.key} label={f.label} />)}
                                </div>
                            )}
                            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button disabled={!!loadingField} onClick={() => fillAllFields(form.fields.filter(f => f.type !== 'image'), form.title, v, set)} className="w-full gap-2 bg-gradient-to-l from-violet-600 to-purple-700 text-white border-0 text-sm hover:opacity-90">
                                    {loadingField === '__all__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {ta('تعبئة جميع الحقول بالذكاء الاصطناعي', 'Fill All Fields with AI')}
                                </Button>
                                <div className="flex gap-2">
                                    <Button onClick={() => { if (!hasData) { toast.error(ta('يرجى ملء الحقول أولاً', 'Please fill in fields first')); return; } setShowPreview(true); }} className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm"><Eye className="w-4 h-4" />{ta('معاينة', 'Preview')}</Button>
                                    <Button onClick={() => { setV({}); setImages({}); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm"><RotateCcw className="w-4 h-4" />{ta('استعادة القيم الافتراضية', 'Restore Defaults')}</Button>
                                </div>
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`w-full gap-2 bg-gradient-to-l ${form.gradient} text-white border-0 text-sm`}>
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowPreview(false)} className="absolute top-3 left-3 z-10 bg-white/90 shadow-lg rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors text-sm font-bold">✕</button>
                        <div className="absolute top-3 right-3 z-10 flex gap-2">
                            <Button size="sm" onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`gap-1.5 bg-gradient-to-l ${form.gradient} text-white border-0 text-xs shadow-lg rounded-xl`}>
                                <Download className="w-3.5 h-3.5" /> {ta('تحميل PDF', 'Download PDF')}
                            </Button>
                        </div>
                        <PreviewContent />
                    </div>
                </div>
            )}

            <Footer />
            <style>{`@media print { nav, footer, button, .fixed { display: none !important; } }`}</style>
        </div>
    );
}

export default function AnalyzeResultsPage() {
  const { dir } = useTranslation();
    const [selected, setSelected] = useState<FormDef | null>(null);
    if (selected) return <FormFill form={selected} onBack={() => setSelected(null)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-cyan-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-cyan-500/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-10 left-[10%] w-64 h-64 bg-teal-500/15 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <BarChart2 className="w-4 h-4 text-cyan-400" /> {ta('تحليل النتائج', 'Results Analysis')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('تحليل النتائج', 'Results Analysis')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('تحليل نتائج الاختبارات واستخراج التقارير والإحصائيات التفصيلية مع رسوم بيانية تفاعلية', 'Analyze test results with detailed reports, statistics, and interactive charts')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{FORMS.length} نماذج</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FORMS.map(form => (
                            <Card key={form.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setSelected(form)}>
                                <div className={`h-2 bg-gradient-to-l ${form.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${form.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <BarChart2 className="w-6 h-6" />
                                        </div>
                                        {form.badge && <Badge className="bg-amber-500 text-white text-xs">{form.badge}</Badge>}
                                    </div>
                                    <CardTitle className="text-sm leading-snug group-hover:text-primary transition-colors">{form.title}</CardTitle>
                                    <CardDescription className="text-xs line-clamp-2 mt-1">{form.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Button className={`w-full bg-gradient-to-l ${form.gradient} text-white border-0 hover:opacity-90 gap-2 text-sm`}>
                                        <Eye className="w-4 h-4" /> {ta('ابدأ التصميم', 'Start Design')}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
