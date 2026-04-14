'use client';

import { useState } from 'react';
import { useLocalDraft } from '@/hooks/useLocalDraft';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Eye, Download, RotateCcw, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

// ===== Common fields for all initiatives =====
const COMMON_FIELDS = [
    { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:'), ph: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), type: 'textarea', rows: 3 },
    { key: 'program_name', label: ta('اسم البرنامج / المبادرة:', 'Program/Initiative Name:'), ph: ta('اسم المبادرة', 'Initiative Name'), type: 'text' },
    { key: 'implementors', label: ta('المنفذ/ون:', 'Implementer(s):'), ph: ta('المنفذون', 'Implementers'), type: 'text', half: true },
    { key: 'participants', label: ta('المشاركـ/ون:', 'Participant(s):'), ph: ta('المشاركون', 'Participants'), type: 'text', half: true },
    { key: 'location', label: ta('مكان التنفيذ:', 'Location:'), ph: ta('مكان التنفيذ', 'Implementation Location'), type: 'text', third: true },
    { key: 'duration', label: ta('مدة التنفيذ:', 'Duration:'), ph: ta('مدة التنفيذ', 'Duration'), type: 'text', third: true },
    { key: 'date', label: ta('تاريخ التنفيذ:', 'Date:'), ph: ta('التاريخ', 'History'), type: 'text', third: true },
    { key: 'beneficiaries', label: ta('المستفيدون / عددهم:', 'Beneficiaries / Count:'), ph: ta('المستفيدون', 'Beneficiaries'), type: 'text', half: true },
    { key: 'domain', label: ta('المجال:', 'Domain:'), ph: ta('المجال', 'Domain'), type: 'text', half: true },
];

interface InitiativeDef {
    id: string;
    title: string;
    description: string;
    gradient: string;
    badge?: string;
    objectives_ph: string;
    steps_ph: string;
    extraFields?: { key: string; label: string; ph: string; textarea?: boolean; rows?: number }[];
}

const INITIATIVES: InitiativeDef[] = [
    {
        id: 'ramadan-basket',
        title: ta('تقرير تفعيل مبادرة السلة الرمضانية', 'Ramadan Basket Initiative Report'),
        description: ta('تقرير يوضح تفعيل مبادرة السلة الرمضانية عبر توزيع بطاقات شراء من السوبر ماركت لأسر الطلاب المحتاجة', 'Report showing Ramadan Basket initiative activation through distributing supermarket purchase cards to needy student families'),
        gradient: 'from-green-600 to-emerald-700',
        objectives_ph: '١) دعم أسر الطلاب المحتاجة غذائياً.\n٢) تمكين الأسرة من اختيار احتياجاتها.\n٣) تعزيز التكافل والمسؤولية المجتمعية.\n٤) تنمية روح المبادرة والتطوع.\n٥) تحسين جودة حياة الأسر برمضان.',
        steps_ph: '١) تشكيل لجنة تنظيمية من المدرسة.\n٢) حصر الأسر المستحقة بسرية تامة.\n٣) تحديد قيمة وعدد البطاقات.\n٤) التأكد من توفر بطاقات مناسبة للقيمة المحددة.\n٥) تسليم البطاقات بآلية مناسبة تحفظ الخصوصية.',
        extraFields: [
            { key: 'report_title', label: ta('عنوان التقرير', 'Report Title'), ph: ta('تقرير تفعيل مبادرة السلة الرمضانية للأسر المحتاجة', 'Ramadan Basket Initiative Report') },
            { key: 'header_info', label: ta('معلومات الهيدر', 'Header Information'), ph: ta('المملكة العربية السعودية\nوزارة التعليم\nالإدارة العامة للتعليم\nبالمنطقة الشرقية\nمدرسة', 'المملكة العربية السعودية\\nوزارة التعليم\\nالإدارة العامة للتعليم\\nبالمنطقة الشرقية\\nمدرسة'), textarea: true, rows: 5 },
            { key: 'extra_info', label: ta('معلومات إضافية', 'Additional Information'), ph: ta('العام الدراسي ١٤٤٧هـ\nالفصل الدراسي الثاني', 'العام الدراسي ١٤٤٧هـ\\nالفصل الدراسي الثاني'), textarea: true, rows: 2 },
            { key: 'method', label: ta('أسلوب التنفيذ', 'Implementation Method'), ph: ta('دعم مادي - عمل تطوعي', 'Material support - Volunteer work') },
            { key: 'participants', label: ta('المشاركين', 'Participants'), ph: ta('منسوبو المدرسة والطلاب', 'School Staff and Students') },
            { key: 'date', label: ta('تاريخ التنفيذ', 'Implementation Date'), ph: ta('١٤٤٧/٠٩/٠٢هـ', '02/09/1447H') },
            { key: 'slogan', label: ta('شعار المبادرة', 'Initiative Slogan'), ph: ta('رمضان عطاء وتكافل', 'Ramadan: Giving and Solidarity') },
            { key: 'location', label: ta('مكان المبادرة', 'Initiative Venue'), ph: ta('المدرسة', 'School') },
            { key: 'target', label: ta('الفئة المستهدفة', 'Target Group'), ph: ta('أسر الطلاب المحتاجة', 'Needy student families') },
            { key: 'idea', label: ta('فكرة المبادرة (الهدف العام)', 'Initiative Concept (General Objective)'), ph: ta('توفير سلة غذائية لكل أسرة محتاجة من أسر الطلاب عبر توزيع بطاقات الشراء خلال شهر رمضان...', 'Providing a food basket for each needy student family through purchase cards during Ramadan...'), textarea: true, rows: 3 },
            { key: 'activities', label: ta('الأنشطة', 'Activities'), ph: '١) إعلان المبادرة وآلية المشاركة.\n٢) حصر الأسر المستحقة بسرية.\n٣) توفير بطاقات الشراء المعتمدة.\n٤) تجهيز خطة تسليم دون إحراج.\n٥) تسليم البطاقات وفق المواعيد.', textarea: true, rows: 5 },
            { key: 'success_indicators', label: ta('مؤشرات النجاح (المخرجات المتوقعة)', 'Success Indicators (Expected Outputs)'), ph: '١) توفير وتسليم بطاقات الشراء.\n٢) عدد الأسر المستفيدة بلا شكاوى.\n٣) مشاركة منسوبي المدرسة والطلاب.\n٤) دقة وسرعة الحصر والتسليم.\n٥) تعزيز التكافل والانتماء المدرسي.', textarea: true, rows: 5 },
            { key: 'notes', label: ta('ملاحظات', 'Notes'), ph: '', textarea: true, rows: 2 },
        ],
    },
    {
        id: 'breast-cancer',
        title: ta('تقرير تنفيذ مبادرة التوعية بسرطان الثدي', 'Breast Cancer Awareness Initiative Implementation Report'),
        description: ta('تقرير تنفيذ مبادرة التوعية بسرطان الثدي في البيئة المدرسية', 'Breast Cancer Awareness Initiative Implementation Report in School Environment'),
        gradient: 'from-pink-600 to-rose-700',
        objectives_ph: '١. رفع الوعي بأهمية الكشف المبكر عن سرطان الثدي.\n٢. تثقيف الطالبات بأساليب الوقاية والفحص الذاتي.\n٣. تعزيز ثقافة الصحة الوقائية في المجتمع المدرسي.\n٤. تشجيع التواصل مع الجهات الصحية المختصة.',
        steps_ph: '١. تنظيم محاضرة توعوية بمشاركة متخصصة صحية.\n٢. توزيع مطويات ومواد توعوية على الطالبات.\n٣. عرض فيديوهات تثقيفية حول الكشف المبكر.\n٤. إقامة ركن توعوي في المدرسة.',
    },
    {
        id: '10ksa-2025',
        title: ta('تقرير تفعيل مبادرة (10KSA 2025) للوقاية من السرطان', 'Cancer Prevention Initiative (10KSA 2025) Activation Report'),
        description: ta('تقرير تفعيل مبادرة 10KSA 2025 لرفع الوعي حول الوقاية من السرطان', '10KSA 2025 Cancer Prevention Awareness Initiative Activation Report'),
        gradient: 'from-blue-600 to-indigo-700',
        badge: 'جديد',
        objectives_ph: '١. رفع الوعي بمبادرة 10KSA 2025 الوطنية.\n٢. تثقيف الطلاب بأساليب الوقاية من السرطان.\n٣. تعزيز السلوكيات الصحية الوقائية.\n٤. المساهمة في تحقيق أهداف رؤية 2030 الصحية.',
        steps_ph: '١. تعريف الطلاب بمبادرة 10KSA 2025 وأهدافها.\n٢. تنظيم فعاليات توعوية متنوعة.\n٣. توزيع مواد توعوية على الطلاب وأولياء الأمور.\n٤. توثيق الفعاليات ورفع التقارير.',
    },
    {
        id: 'cyber-digital',
        title: ta('مبادرة الأمن السيبراني والمواطنة الرقمية', 'Cybersecurity and Digital Citizenship Initiative'),
        description: ta('تقرير تفعيل مبادرة الأمن السيبراني والمواطنة الرقمية في البيئة المدرسية', 'Cybersecurity and Digital Citizenship Initiative Activation Report at School'),
        gradient: 'from-violet-600 to-purple-700',
        objectives_ph: '١. تعزيز الوعي بمفاهيم الأمن السيبراني.\n٢. تنمية مهارات المواطنة الرقمية المسؤولة.\n٣. حماية الطلاب من مخاطر الفضاء الإلكتروني.\n٤. تطوير مهارات الاستخدام الآمن للإنترنت.',
        steps_ph: '١. تنظيم ورشة عمل حول الأمن السيبراني.\n٢. عرض تقديمي عن المواطنة الرقمية.\n٣. تطبيق اختبار تفاعلي للطلاب.\n٤. توزيع دليل الاستخدام الآمن للإنترنت.',
    },
    {
        id: 'white-stick',
        title: ta('مبادرة اليوم العالمي للعصا البيضاء', 'International White Cane Day Initiative'),
        description: ta('تقرير تفعيل مبادرة اليوم العالمي للعصا البيضاء في البيئة المدرسية', 'International White Cane Day Initiative Activation Report at School'),
        gradient: 'from-slate-600 to-gray-700',
        objectives_ph: '١. التعريف بأهمية اليوم العالمي للعصا البيضاء.\n٢. تعزيز قيم التعاطف والدمج الاجتماعي.\n٣. رفع الوعي بحقوق ذوي الإعاقة البصرية.\n٤. تنمية روح التطوع والمساعدة.',
        steps_ph: '١. إقامة فعالية توعوية في الطابور الصباحي.\n٢. عرض فيديو تعريفي باليوم العالمي للعصا البيضاء.\n٣. تنظيم نشاط تجريبي للتعرف على تحديات المكفوفين.\n٤. توزيع مطويات توعوية.',
    },
    {
        id: 'cyber-advanced',
        title: ta('مبادرة الأمن السيبراني المتقدم', 'Advanced Cybersecurity Initiative'),
        description: ta('تقرير تفعيل مبادرة الأمن السيبراني المتقدم للطلاب', 'Advanced Cybersecurity Initiative Activation Report for Students'),
        gradient: 'from-cyan-600 to-teal-700',
        objectives_ph: '١. تطوير مهارات الأمن السيبراني المتقدمة.\n٢. التعرف على أحدث التهديدات الإلكترونية.\n٣. تدريب الطلاب على أدوات الحماية الرقمية.\n٤. بناء جيل واعٍ بمخاطر الفضاء الإلكتروني.',
        steps_ph: '١. تنظيم ورشة عمل متقدمة في الأمن السيبراني.\n٢. تطبيق سيناريوهات عملية للتهديدات الإلكترونية.\n٣. تدريب الطلاب على أدوات الحماية.\n٤. اختبار تقييمي للمهارات المكتسبة.',
    },
    {
        id: 'tree-planting',
        title: ta('مبادرة موسم التشجير الوطني', 'National Tree Planting Season Initiative'),
        description: ta('تقرير تفعيل مبادرة موسم التشجير الوطني في البيئة المدرسية', 'National Tree Planting Season Initiative Activation Report at School'),
        gradient: 'from-green-700 to-emerald-800',
        objectives_ph: '١. المساهمة في تحقيق أهداف مبادرة السعودية الخضراء.\n٢. تعزيز الوعي البيئي لدى الطلاب.\n٣. تنمية حب الطبيعة والمحافظة عليها.\n٤. المشاركة الفعلية في زراعة الأشجار.',
        steps_ph: '١. تنظيم حملة توعوية بأهمية التشجير.\n٢. توزيع شتلات الأشجار على الطلاب.\n٣. زراعة الأشجار في حديقة المدرسة.\n٤. متابعة نمو الأشجار وتوثيق النتائج.',
    },
    {
        id: 'stuttering',
        title: ta('مبادرة اليوم العالمي للتأتأة', 'International Stuttering Day Initiative'),
        description: ta('تقرير تفعيل مبادرة اليوم العالمي للتأتأة في البيئة المدرسية', 'International Stuttering Day Initiative Activation Report at School'),
        gradient: 'from-amber-600 to-orange-700',
        objectives_ph: '١. رفع الوعي باضطراب التأتأة وأسبابه.\n٢. تعزيز قيم القبول والتعاطف مع ذوي التأتأة.\n٣. تقديم الدعم النفسي والاجتماعي للطلاب المتأثرين.\n٤. تشجيع التواصل مع المختصين.',
        steps_ph: '١. تنظيم فعالية توعوية في اليوم العالمي للتأتأة.\n٢. عرض فيديو تعريفي عن التأتأة وأسبابها.\n٣. إقامة جلسة نقاش مع أخصائي النطق.\n٤. توزيع مواد توعوية على الطلاب.',
    },
    {
        id: 'nafs-exams',
        title: ta('مبادرة الاستعداد للاختبارات الوطنية نافس', 'National Tests Preparation Initiative (NAFS)'),
        description: ta('أفضل تقرير لتقديم مبادرة للاستعداد للاختبارات الوطنية نافس (nafs)', 'Best report for the National Tests Preparation Initiative (NAFS)'),
        gradient: 'from-indigo-600 to-blue-700',
        badge: 'الأكثر استخداماً',
        objectives_ph: '١. تحسين نتائج الطلاب في اختبارات نافس الوطنية.\n٢. تطوير مهارات التفكير الناقد والتحليلي.\n٣. تعزيز الثقة بالنفس لدى الطلاب.\n٤. تقديم استراتيجيات فعالة للمذاكرة والاستعداد.',
        steps_ph: '١. تنظيم جلسات مراجعة مكثفة للمواد الأساسية.\n٢. تطبيق اختبارات تجريبية مشابهة لنافس.\n٣. تقديم ورش عمل في مهارات الاستذكار.\n٤. متابعة تقدم الطلاب وتقديم الدعم اللازم.',
    },
];

import Link from 'next/link';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

// ===== Ramadan Basket Custom Form =====
function RamadanBasketForm({ onBack }: { onBack: () => void }) {
  const { dir } = useTranslation();
    const GRADIENT = 'from-green-600 to-emerald-700';
    // [C-01 FIX] Auto-save to localStorage — data now persists across page refreshes
    // [TS-FIX] Explicit generic Record<string,string> enables dynamic key access v[k]
    const [v, setV, clearDraft] = useLocalDraft<Record<string, string>>('initiative-ramadan', {
        report_title: ta('تقرير تفعيل مبادرة السلة الرمضانية للأسر المحتاجة', 'Ramadan Basket Initiative Report'),
        teacher_info: 'المملكة العربية السعودية\nوزارة التعليم\nالإدارة العامة للتعليم\nبالمنطقة الشرقية',
        extra_info: 'العام الدراسي ١٤٤٦هـ\nالفصل الدراسي الثاني',
        motivation_style: 'دعم مادي - عمل تطوعي', participants: 'منسوبو المدرسة والطلاب', date: '١٤٤٧/٩/٢هـ',
        initiative_slogan: 'رمضان عطاء وتكافل', event_place: 'المدرسة', target_group: 'أسر الطلاب المحتاجة',
        idea: 'توفير سلة غذائية لكل أسرة محتاجة من أسر الطلاب عبر توزيع بطاقات الشراء من السوبر ماركت، بما يضمن تلبية الاحتياج الغذائي مع حفظ خصوصية الأسر وتمكينها من اختيار احتياجاتها الأساسية بطريقة تحفظ الكرامة.',
        objectives: '. دعم أسر الطلاب المحتاجة غذائياً.\n. تمكين الأسرة من اختيار احتياجاتها.\n. تعزيز التكافل والمسؤولية المجتمعية.\n. تنمية روح المبادرة والتطوع.\n٥. تحسين جودة حياة الأسر برمضان.',
        general_goal_gap: 'اكتب الأهداف',
        activities: '١. إعلان المبادرة وآلية المشاركة.\n٢. حصر الأسر المستحقة بسرية.\n٣. توفير بطاقات الشراء المعتمدة.\n. تجهيز خطة توزيع دون إحراج.\n. تسليم البطاقات وفق المواعيد.',
        implementation: '. تشكيل لجنة تنظيمية من المدرسة.\n. حصر الأسر المستحقة بسرية تامة.\n. تحديد قيمة وعدد البطاقات.\n. التأكد من توفير بطاقات مناسبة للقيمة المحددة.\n. تسليم البطاقات بآلية مناسبة تحفظ الخصوصية.',
        activities_summary: '', notes: '',
        outcomes: '. توفير وتسليم بطاقات الشراء.\n. عدد الأسر المستفيدة بلا شكاوى.\n. مشاركة منسوبي المدرسة والطلاب.\n. دقة وسرعة الحصر والتسليم.\n. تعزيز التكافل والانتماء المدرسي.',
        results_measure: '',
        sig_right: 'المعلم / اسم المعلم', sig_mid: 'أضف الاسم هنا', sig_left: 'مدير المدرسة / اسم المدير',
        style: 'الهوية البصرية الأصلية', font_type: 'الافتراضي', font_size: 'عادي',
    });
    const set = (k: string, val: string) => setV((p: any) => ({ ...p, [k]: val }));

    const [images, setImages] = useState<string[]>([]);
    const [showDesign, setShowDesign] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    const handleImages = (files: FileList) => {
        Array.from(files).slice(0, 10 - images.length).forEach(file => {
            const r = new FileReader(); r.onload = e => setImages(p => [...p, e.target?.result as string]); r.readAsDataURL(file);
        });
    };

    const handleDownload = () => {
        setShowPreview(true);
        setTimeout(() => {
            const el = document.getElementById('ramadan-preview-print');
            if (!el) { window.print(); return; }
            const win = window.open('', '_blank', 'width=800,height=1100');
            if (!win) return;
            win.document.write(`<!DOCTYPE html><html dir={dir} lang="ar"><head><meta charset="UTF-8"><title>${v.report_title}</title><style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0;}body{font-family:'Cairo','Segoe UI',sans-serif;direction:rtl;background:white;}@page{margin:8mm;size:A4;}img{max-width:100%;display:block;}</style></head><body>${el.innerHTML}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script></body></html>`);
            win.document.close();
        }, 400);
    };

    const moveLines = (key: string, dir: 'up' | 'down') => {
        const lines = (v[key] || '').split('\n'); if (lines.length < 2) return;
        if (dir === 'up') { const x = lines.pop()!; lines.splice(lines.length - 1, 0, x); }
        else { const x = lines.shift()!; lines.push(x); }
        set(key, lines.join('\n'));
    };
    const TW = ({ k, ph, rows = 4 }: { k: string; ph: string; rows?: number }) => (
        <div className="relative">
            <Textarea placeholder={ph} rows={rows} value={v[k] || ''} onChange={e => set(k, e.target.value)} className="resize-y text-sm ps-8" />
            <div className="absolute left-1 top-2 flex flex-col gap-0.5">
                <button type="button" onClick={() => moveLines(k, 'up')} className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] flex items-center justify-center hover:bg-gray-300">▲</button>
                <button type="button" onClick={() => moveLines(k, 'down')} className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] flex items-center justify-center hover:bg-gray-300">▼</button>
            </div>
        </div>
    );

    // Preview component
    const fBox = (label: string, val: string, minH = '28px') => (
        <div style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '8px 10px', position: 'relative', paddingTop: '14px' }}>
            <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap', background: 'white', padding: '0 4px' }}>{label}:</span>
                <span style={{ flex: 1, height: '1px', background: '#5bc4c0', display: 'block' }} />
            </div>
            <div style={{ minHeight: minH, fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{val}</div>
        </div>
    );
    const sBox = (title: string, content: string) => (
        <div style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '8px 10px', position: 'relative', paddingTop: '14px' }}>
            <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap', background: 'white', padding: '0 4px' }}>{title}</span>
                <span style={{ flex: 1, height: '1px', background: '#5bc4c0', display: 'block' }} />
            </div>
            <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.9' }}>{content}</div>
        </div>
    );

    const PreviewContent = () => {
        const rightLines = v.extra_info.split('\n').filter(l => l.trim());
        const leftLines = v.teacher_info.split('\n').filter(l => l.trim());
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white' }}>
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Left: school info */}
                        <div style={{ textAlign: 'right', lineHeight: '1.6', fontSize: '10px', opacity: 0.95 }}>
                            {leftLines.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                        {/* Center: MOE logo */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,5px)', gap: '3px', margin: '0 auto 4px', width: 'fit-content' }}>
                                {Array.from({length: 24}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />)}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                            <div style={{ fontSize: '9px', opacity: 0.85 }}>Ministry of Education</div>
                        </div>
                        {/* Right: year/semester */}
                        <div style={{ textAlign: 'right', lineHeight: '1.8', fontSize: '11px' }}>
                            {rightLines.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                    </div>
                </div>
                <div style={{ border: '1px solid #5bc4c0', margin: '10px 12px', borderRadius: '6px', padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#1a3a5c' }}>
                    {v.report_title}
                </div>
                <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {fBox('أسلوب التنفيذ', v.motivation_style)}
                        {fBox('المشاركين', v.participants)}
                        {fBox('تاريخ التنفيذ', v.date)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {fBox('شعار المبادرة', v.initiative_slogan)}
                        {fBox('مكان المبادرة', v.event_place)}
                        {fBox('الفئة المستهدفة', v.target_group)}
                    </div>
                    {sBox('فكرة المبادرة (الهدف العام)', v.idea)}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {sBox('الأهداف', v.objectives)}
                        {sBox('مكونات المبادرة (آلية التنفيذ)', v.implementation)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {sBox('الأنشطة', v.activities)}
                        {sBox('مؤشرات النجاح (المخرجات المتوقعة)', v.outcomes)}
                    </div>
                    <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative', minHeight: '80px' }}>
                        <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '11px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap' }}>{ta('الشـواهـد', 'Evidence')}</div>
                        {images.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: images.length === 1 ? '1fr' : '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                {images.slice(0, 4).map((img, i) => (
                                    <div key={i} style={{ borderRadius: '6px', overflow: 'hidden' }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px 4px', borderTop: '1px solid #eee' }}>
                        {[v.sig_right, v.sig_mid, v.sig_left].map((sig, i) => (
                            <div key={i} style={{ textAlign: 'center', fontSize: '11px' }}>
                                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>{sig}</div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Footer */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold', marginTop: '8px' }}>
                    {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                </div>
            </div>
        );
    };
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة للمبادرات المدرسية', 'Back to School Initiatives')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="print:hidden">
                <Card className="border-0 shadow-lg">
                    <CardHeader className={`bg-gradient-to-l ${GRADIENT} text-white rounded-t-xl py-4`}>
                        <CardTitle className="text-sm">{ta('تقرير تفعيل مبادرة السلة الرمضانية للأسر المحتاجة', 'Ramadan Basket Initiative Report')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-gray-500">{ta('هذا لحفظ البيانات المدخلة فقط وليس لتحميل التقرير. التحميل بعد المعاينة بالأسفل.', 'This saves entered data only, not for downloading the report. Download after preview below.')}</p>
                                <select className="border border-input rounded-md px-2 py-1 text-xs bg-background shrink-0">
                                    {['/','/','/','/','/'].map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="text-[11px] text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">{ta('💾 يتم الحفظ تلقائياً كل 1.5 ثانية', '💾 Auto-saved every 1.5 seconds')}</div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => {}} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white border-0 text-xs h-9 w-full"><Eye className="w-3.5 h-3.5" />{ta('محفوظ تلقائياً', 'Auto-saved')}</Button>
                                <Button onClick={clearDraft} className="gap-1.5 bg-red-500 hover:bg-red-600 text-white border-0 text-xs h-9 w-full"><RotateCcw className="w-3.5 h-3.5" />{ta('مسح المسودة', 'Clear Draft')}</Button>
                            </div>
                        </div>
                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('عنوان التقرير:', 'Report Title:')}<span className="text-red-500">*</span></label><Input value={v.report_title} onChange={e => set('report_title', e.target.value)} className="text-sm" /></div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('معلومات الهيدر:', 'Header Information:')}<span className="text-red-500">*</span></label><TW k="teacher_info" ph="المملكة العربية السعودية\nوزارة التعليم\nالإدارة العامة للتعليم\nبالمنطقة الشرقية" rows={4} /></div>
                            <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('معلومات إضافية:', 'Additional Information:')}</label><TW k="extra_info" ph="العام الدراسي هـ\nالفصل الدراسي الثاني" rows={4} /></div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{ta('المعلومات الأساسية:', 'Basic Information:')}</p>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {[['motivation_style','أسلوب التنفيذ:','دعم مادي - عمل تطوعي'],['participants','المشاركون:','منسوبو المدرسة والطلاب'],['date','تاريخ التنفيذ:','//هـ']].map(([k,l,ph]) => (
                                    <div key={k}><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{l}</label><Input value={v[k]||''} onChange={e => set(k,e.target.value)} placeholder={ph} className="text-sm" /></div>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[['initiative_slogan','شعار المبادرة:','رمضان عطاء وتكافل'],['event_place','مكان المبادرة:','المدرسة'],['target_group','الفئة المستهدفة:','أسر الطلاب المحتاجة']].map(([k,l,ph]) => (
                                    <div key={k}><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{l}</label><Input value={v[k]||''} onChange={e => set(k,e.target.value)} placeholder={ph} className="text-sm" /></div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('فكرة المبادرة (الهدف العام):', 'Initiative Concept (General Objective):')}</label><Textarea rows={5} value={v.idea} onChange={e => set('idea', e.target.value)} className="resize-y text-sm" /></div>
                            <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف :', 'Objectives:')}</label><TW k="objectives" ph="الأهداف..." rows={5} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">{ta('لخّص الغاية العامة للمبادرة', 'Summarize the general purpose of the initiative')}</p>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مكونات المبادرة (آلية التنفيذ) :', 'Initiative Components (Implementation Mechanism):')}</label>
                                <TW k="implementation" ph="آلية التنفيذ..." rows={5} />
                            </div>
                            <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأنشطة :', 'Activities:')}</label><TW k="activities" ph="الأنشطة..." rows={5} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">{ta('سجل الأنشطة العملية بإيجاز', 'Record practical activities briefly')}</p>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('ملاحظات :', 'Notes:')}</label>
                                <Input value={v.notes} onChange={e => set('notes', e.target.value)} className="text-sm" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">{ta('اذكر عناصر التنفيذ الرئيسية', 'Mention the main implementation elements')}</p>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مؤشرات النجاح (المخرجات المتوقعة) :', 'Success Indicators (Expected Outputs):')}</label>
                                <TW k="outcomes" ph="المخرجات المتوقعة..." rows={5} />
                            </div>
                        </div>
                        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('كيف ستقاس النتائج؟', 'How will results be measured?')}</label><Input value={v.results_measure} onChange={e => set('results_measure', e.target.value)} className="text-sm" /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{ta('التوقيعات:', 'Signatures:')}</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[['sig_right','توقيع يمين:','المعلم / اسم المعلم'],['sig_mid','توقيع وسط:','أضف الاسم هنا'],['sig_left','توقيع يسار:','مدير المدرسة / اسم المدير']].map(([k,l,ph]) => (
                                    <div key={k}><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{l}</label><Textarea rows={2} value={v[k]||''} onChange={e => set(k,e.target.value)} placeholder={ph} className="resize-y text-sm" /></div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{ta('إضافة شواهد (صور):', 'Add Evidence (Images):')}</p>
                            {images.length > 0 && <div className="grid grid-cols-4 gap-2 mb-2">{images.map((img,i) => (<div key={i} className="relative"><img src={img} alt="" className="w-full h-16 object-cover rounded-lg border" /><button onClick={() => setImages(p => p.filter((_,idx) => idx!==i))} className="absolute top-0.5 left-0.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center">×</button></div>))}</div>}
                            <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                                <span className="bg-gray-100 dark:bg-gray-700 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار ملفات', 'Choose Files')}</span>
                                <span className="text-xs text-gray-400 px-3 py-2">{ta('لم يتم اختيار ملف', 'No file selected')}</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleImages(e.target.files)} />
                            </label>
                            <p className="text-xs text-gray-400 mt-1 text-start">{ta('أقصى حد للشواهد 10 شواهد', 'Maximum 10 evidence items')}</p>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                            <button onClick={() => setShowDesign(!showDesign)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300">
                                <span>{ta('تخصيص التصميم', 'Customize Design')}</span><span>{showDesign ? '' : ''}</span>
                            </button>
                            {showDesign && (
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{ta('ستايل التقرير:', 'Report Style:')}</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['بسيط (توفير حبر)','الهوية البصرية الأصلية','الهوية البصرية تدرج'].map(s => (
                                                <button key={s} onClick={() => set('style', s)} className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border-2 ${v.style === s ? 'bg-gradient-to-l from-green-600 to-emerald-700 text-white border-transparent' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>{s}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="block text-xs text-gray-500 mb-1">{ta('نوع الخط:', 'Font Type:')}</label><select value={v.font_type} onChange={e => set('font_type', e.target.value)} className="w-full border border-input rounded-md px-2 py-1.5 text-xs bg-background"><option>{ta('الافتراضي', 'Default')}</option><option>Cairo</option><option>Tajawal</option></select></div>
                                        <div><label className="block text-xs text-gray-500 mb-1">{ta('حجم النص:', 'Text Size:')}</label><select value={v.font_size} onChange={e => set('font_size', e.target.value)} className="w-full border border-input rounded-md px-2 py-1.5 text-xs bg-background"><option>{ta('عادي', 'Normal')}</option><option>{ta('صغير', 'Small')}</option><option>{ta('كبير', 'Large')}</option></select></div>
                                    </div>
                                    <p className="text-xs text-gray-400">{ta('تصغير الخط يساعد في جعل التقرير صفحة واحدة', 'Reducing font size helps fit the report on one page')}</p>
                                    <div className="border-t border-gray-100 dark:border-gray-800 pt-2 space-y-1">
                                        <button className="w-full flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 py-1.5"><span>{ta('خيارات إضافية', 'Additional Options')}</span><span></span></button>
                                        <button className="w-full flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 py-1.5"><span>{ta('الشعارات', 'Logos')}</span><span></span></button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex gap-2">
                                <Button onClick={() => setShowPreview(true)} className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm"><Eye className="w-4 h-4" />{ta('معاينة', 'Preview')}</Button>
                                <Button onClick={() => { setV(p => ({...p, notes:'', activities_summary:'', results_measure:''})); setImages([]); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm"><RotateCcw className="w-4 h-4" />{ta('استعادة', 'Restore')}</Button>
                            </div>
                            <Button onClick={handleDownload} className="w-full gap-2 bg-gradient-to-l from-green-600 to-emerald-700 text-white border-0 text-sm"><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</Button>
                        </div>
                    </CardContent>
                </Card>
                </div>
                {/* Preview column */}
                <div className="sticky top-24">
                    <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                    <div id="ramadan-preview-print">
                        <PreviewContent />
                    </div>
                </div>
            </div>
            </main>
            <Footer />
        </div>
    );
}
// ===== Initiative Form =====
function InitiativeForm({ init, onBack }: { init: InitiativeDef; onBack: () => void }) {
  const { dir } = useTranslation();
    // [C-01 FIX] Auto-save — data persists across page refreshes
    const [values, setValues, clearValues] = useLocalDraft(`initiative-${init.id}`, {} as Record<string, string>);
    const [images, setImages] = useState<Record<string, string>>({});
    const set = (k: string, v: string) => setValues((p: Record<string, string>) => ({ ...p, [k]: v }));
    const handleImage = (key: string, file: File) => {
        const reader = new FileReader();
        reader.onload = e => setImages(p => ({ ...p, [key]: e.target?.result as string }));
        reader.readAsDataURL(file);
    };

    const ImageField = ({ k }: { k: string }) => (
        images[k] ? (
            <div className="relative">
                <img src={images[k]} alt="" className="w-full h-28 object-cover rounded-lg border" />
                <button onClick={() => setImages(p => { const n = {...p}; delete n[k]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
            </div>
        ) : (
            <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                <span className="bg-gray-100 dark:bg-gray-700 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span>
                <span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(k, e.target.files[0])} />
            </label>
        )
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة للمبادرات المدرسية', 'Back to School Initiatives')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className={`bg-gradient-to-l ${init.gradient} text-white rounded-t-xl`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Lightbulb className="w-5 h-5" /></div>
                                <div>
                                    <CardTitle className="text-sm">{init.title}</CardTitle>
                                    <CardDescription className="text-white/80 text-xs mt-0.5">{init.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3">
                            {/* الحقول الإضافية الخاصة بكل مبادرة */}
                            {init.extraFields && init.extraFields.map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{f.label}:</label>
                                    {f.textarea ? (
                                        <Textarea placeholder={f.ph} rows={f.rows || 3} value={values[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="resize-y text-sm" />
                                    ) : (
                                        <Input placeholder={f.ph} value={values[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="text-sm" />
                                    )}
                                </div>
                            ))}
                            {/* إدارة التعليم - فقط للمبادرات بدون extraFields */}
                            {!init.extraFields && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label>
                                    <Textarea placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} rows={3} value={values.edu_school || ''} onChange={e => set('edu_school', e.target.value)} className="resize-y text-sm" />
                                </div>
                            )}
                            {/* اسم البرنامج - فقط للمبادرات بدون extraFields */}
                            {!init.extraFields && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم البرنامج / المبادرة:', 'Program/Initiative Name:')}</label>
                                    <Input placeholder={init.title} value={values.program_name || ''} onChange={e => set('program_name', e.target.value)} className="text-sm" />
                                </div>
                            )}
                            {/* المنفذ + المشارك - فقط للمبادرات بدون extraFields */}
                            {!init.extraFields && (
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المنفذ/ون:', 'Implementer(s):')}</label><Input placeholder={ta('المنفذون', 'Implementers')} value={values.implementors || ''} onChange={e => set('implementors', e.target.value)} className="text-sm" /></div>
                                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المشاركـ/ون:', 'Participant(s):')}</label><Input placeholder={ta('المشاركون', 'Participants')} value={values.participants || ''} onChange={e => set('participants', e.target.value)} className="text-sm" /></div>
                            </div>
                            )}
                            {/* مكان + مدة + تاريخ - فقط للمبادرات بدون extraFields */}
                            {!init.extraFields && (
                            <div className="grid grid-cols-3 gap-2">
                                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مكان التنفيذ:', 'Location:')}</label><Input placeholder={ta('مكان التنفيذ', 'Implementation Location')} value={values.location || ''} onChange={e => set('location', e.target.value)} className="text-sm" /></div>
                                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مدة التنفيذ:', 'Duration:')}</label><Input placeholder={ta('يوم واحد', 'One Day')} value={values.duration || ''} onChange={e => set('duration', e.target.value)} className="text-sm" /></div>
                                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('تاريخ التنفيذ:', 'Date:')}</label><Input placeholder={ta('التاريخ', 'Date')} value={values.date || ''} onChange={e => set('date', e.target.value)} className="text-sm" /></div>
                            </div>
                            )}
                            {/* المستفيدون + المجال - فقط للمبادرات بدون extraFields */}
                            {!init.extraFields && (
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المستفيدون / عددهم:', 'Beneficiaries / Count:')}</label><Input placeholder={ta('المستفيدون', 'Beneficiaries')} value={values.beneficiaries || ''} onChange={e => set('beneficiaries', e.target.value)} className="text-sm" /></div>
                                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المجال:', 'Domain:')}</label><Input placeholder={ta('المجال', 'Domain')} value={values.domain || ''} onChange={e => set('domain', e.target.value)} className="text-sm" /></div>
                            </div>
                            )}
                            {/* الأهداف + خطوات التنفيذ */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف:', 'Objectives:')}</label>
                                    <Textarea placeholder={init.objectives_ph} rows={5} value={values.objectives || ''} onChange={e => set('objectives', e.target.value)} className="resize-y text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('خطوات التنفيذ / الوصف:', 'Implementation Steps / Description:')}</label>
                                    <div className="relative">
                                        <Textarea placeholder={init.steps_ph} rows={5} value={values.steps || ''} onChange={e => set('steps', e.target.value)} className="resize-y text-sm ps-8" />
                                        <div className="absolute left-1 top-2 flex flex-col gap-0.5">
                                            <button type="button" onClick={() => { const l = (values.steps||'').split('\n'); if(l.length<2) return; const x=l.pop()!; l.splice(l.length-1,0,x); set('steps',l.join('\n')); }} className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] flex items-center justify-center hover:bg-gray-300">▲</button>
                                            <button type="button" onClick={() => { const l = (values.steps||'').split('\n'); if(l.length<2) return; const x=l.shift()!; l.push(x); set('steps',l.join('\n')); }} className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] flex items-center justify-center hover:bg-gray-300">▼</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* التوقيعات */}
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيمن:', 'Right Signature Name & Title:')}</label><Textarea placeholder={ta('رائد النشاط\nالاسم', 'رائد النشاط\\nالاسم')} rows={2} value={values.right_signature || ''} onChange={e => set('right_signature', e.target.value)} className="resize-y text-sm" /></div>
                                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيسر:', 'Left Signature Name & Title:')}</label><Textarea placeholder={ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم')} rows={2} value={values.left_signature || ''} onChange={e => set('left_signature', e.target.value)} className="resize-y text-sm" /></div>
                            </div>
                            {/* الصور */}
                            <div className="grid grid-cols-2 gap-2">
                                {['image1','image2'].map((k,i) => (
                                    <div key={k}>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">صورة الشاهد {i===0? ta('الأول', 'First') : ta('الثاني', 'Second') }:</label>
                                        <ImageField k={k} />
                                    </div>
                                ))}
                            </div>
                            {/* رابط الشواهد */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('ضع رابط الشواهد إن وجد لإنشاء باركود ووضعه بالنموذج :', 'Add evidence link to generate QR code:')}</label>
                                <Input type="url" placeholder="" value={values.evidence_url || ''} onChange={e => set('evidence_url', e.target.value)} className="text-sm" />
                                <p className="text-xs text-gray-400 mt-1 text-start">{ta('سيتم إنشاء باركود تلقائياً / حقل غير إلزامي تجاهله إذا كنت لاتريد باركود', 'QR code auto-generated / Optional field - skip if not needed')}</p>
                            </div>
                            {/* Actions */}
                            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <Button className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm"><Eye className="w-4 h-4" />{ta('معاينة', 'Preview')}</Button>
                                    <Button onClick={() => { setValues({}); setImages({}); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm"><RotateCcw className="w-4 h-4" />{ta('استعادة القيم الافتراضية', 'Restore Defaults')}</Button>
                                </div>
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`w-full gap-2 bg-gradient-to-l ${init.gradient} text-white border-0 text-sm`}><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        {Object.keys(values).some(k => values[k]) || Object.keys(images).length > 0 ? (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                                <div className={`bg-gradient-to-l ${init.gradient} p-4 text-white`}>
                                    <p className="text-xs opacity-80 mb-1">{ta('وزارة التعليم — مبادرات مدرسية', 'Ministry of Education — School Initiatives')}</p>
                                    <h2 className="text-base font-black">{values.program_name || init.title}</h2>
                                    {values.edu_school && <p className="text-xs opacity-90 mt-1 whitespace-pre-line">{values.edu_school}</p>}
                                </div>
                                <div className="p-4 space-y-2 text-sm">
                                    {[['المنفذ/ون','implementors'],['المشاركـ/ون','participants'],['مكان التنفيذ','location'],['مدة التنفيذ','duration'],['تاريخ التنفيذ','date'],['المستفيدون','beneficiaries'],['المجال','domain']].map(([l,k]) => values[k] ? (
                                        <div key={k} className="flex gap-2 border-b border-gray-100 pb-1"><span className="font-bold text-gray-600 min-w-[110px] shrink-0">{l}:</span><span className="text-gray-800">{values[k]}</span></div>
                                    ) : null)}
                                    {values.objectives && <div className="mt-2"><p className="font-bold text-gray-600 mb-1">{ta('الأهداف:', 'Objectives:')}</p><p className="text-gray-700 text-xs whitespace-pre-line">{values.objectives}</p></div>}
                                    {values.steps && <div className="mt-2"><p className="font-bold text-gray-600 mb-1">{ta('خطوات التنفيذ:', 'Implementation Steps:')}</p><p className="text-gray-700 text-xs whitespace-pre-line">{values.steps}</p></div>}
                                    {(images.image1 || images.image2) && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            {['image1','image2'].map(k => images[k] ? <img key={k} src={images[k]} alt="" className="w-full h-28 object-cover rounded-lg border" /> : null)}
                                        </div>
                                    )}
                                    {(values.right_signature || values.left_signature) && (
                                        <div className="flex justify-between mt-4 pt-3 border-t border-gray-200">
                                            {values.right_signature && <div className="text-center text-xs"><p className="whitespace-pre-line text-gray-700">{values.right_signature}</p><div className="mt-2 border-b border-gray-400 w-20 mx-auto" /></div>}
                                            {values.left_signature && <div className="text-center text-xs"><p className="whitespace-pre-line text-gray-700">{values.left_signature}</p><div className="mt-2 border-b border-gray-400 w-20 mx-auto" /></div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">{ta('ابدأ بملء الحقول لرؤية المعاينة', 'Start filling in the fields to see preview')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
            <style>{`@media print { nav, footer, button { display: none !important; } }`}</style>
        </div>
    );
}

// ===== Main Page =====
export default function SchoolInitiativesPage() {
  const { dir } = useTranslation();
    const [selected, setSelected] = useState<InitiativeDef | null>(null);
    const [showRamadan, setShowRamadan] = useState(false);

    if (showRamadan) return <RamadanBasketForm onBack={() => setShowRamadan(false)} />;
    if (selected) return <InitiativeForm init={selected} onBack={() => setSelected(null)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-green-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-green-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <Lightbulb className="w-4 h-4 text-green-400" /> {ta('مبادرات مدرسية جاهزة', 'Ready School Initiatives')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('مبادرات مدرسية جاهزة', 'Ready School Initiatives')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('مجموعة من المبادرات التعليمية الجاهزة والمعبأة مسبقاً', 'A collection of pre-filled educational initiatives')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><Lightbulb className="w-4 h-4" />{INITIATIVES.length} مبادرات</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {INITIATIVES.map(init => (
                            <Card key={init.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => init.id === 'ramadan-basket' ? setShowRamadan(true) : setSelected(init)}>                                <div className={`h-2 bg-gradient-to-l ${init.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${init.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Lightbulb className="w-6 h-6" />
                                        </div>
                                        {init.badge && <Badge className="bg-amber-500 text-white text-xs">{init.badge}</Badge>}
                                    </div>
                                    <CardTitle className="text-sm leading-snug group-hover:text-primary transition-colors">{init.title}</CardTitle>
                                    <CardDescription className="text-xs mt-1 line-clamp-2">{init.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Button className={`w-full bg-gradient-to-l ${init.gradient} text-white border-0 hover:opacity-90 gap-2 text-sm`}>
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
