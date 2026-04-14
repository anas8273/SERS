'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';
import {
    FileText, ClipboardList, BookOpen, ChevronRight,
    Download, Eye, RotateCcw, Image as ImageIcon, Link as LinkIcon, QrCode,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ===== Types =====
interface FormField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'image' | 'url';
    placeholder?: string;
    required?: boolean;
    rows?: number;
}

interface FormTemplate {
    id: string;
    title: string;
    description: string;
    icon: any;
    gradient: string;
    badge?: string;
    fields: FormField[];
    thumbnail: React.ReactNode;
}

// ===== Thumbnail Previews =====
function ThumbnailWaiting() {
  const { dir } = useTranslation();
    return (
        <div className="w-full h-full bg-white text-[3px] font-sans overflow-hidden" dir={dir} style={{ fontFamily: 'Cairo, sans-serif' }}>
            <div className="bg-[#1a3a5c] text-white px-1 py-0.5 flex justify-between items-center">
                <span className="opacity-70">{ta('وزارة التعليم', 'Ministry of Education')}</span>
                <span className="opacity-70">{ta('المملكة العربية السعودية', 'Saudi Arabia')}</span>
            </div>
            <div className="bg-[#1a3a5c] text-white text-center py-0.5 text-[3.5px] font-bold">{ta('تقرير تنفيذ حصة إنتظار', 'Substitute Lesson Implementation Report')}</div>
            <div className="px-1 py-0.5 space-y-0.5">
                <div className="grid grid-cols-2 gap-0.5">
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('اليوم:', 'Day:')}</span> <span className="text-gray-700">{ta('الأحد', 'Sunday')}</span></div>
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('التاريخ:', 'Date:')}</span> <span className="text-gray-700">١٤٤٧/٢/١٢</span></div>
                </div>
                <div className="grid grid-cols-3 gap-0.5">
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('الصف:', 'Grade:')}</span> <span className="text-gray-700">{ta('ثاني', 'Second')}</span></div>
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('الفصل:', 'Class:')}</span> <span className="text-gray-700">٣</span></div>
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('الحصة:', 'Period:')}</span> <span className="text-gray-700">٢</span></div>
                </div>
                <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('المادة:', 'Subject:')}</span> <span className="text-gray-700">{ta('الرياضيات', 'Mathematics')}</span></div>
                <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('المعلم المنتظر:', 'Substitute Teacher:')}</span> <span className="text-gray-700">{ta('محمد الفيصل', 'Mohammed Al-Faisal')}</span></div>
                <div className="border border-gray-300 rounded px-0.5 py-1.5"><span className="text-gray-500">{ta('الأنشطة المنفذة:', 'Activities Performed:')}</span></div>
                <div className="border border-gray-300 rounded px-0.5 py-1.5"><span className="text-gray-500">{ta('ملاحظات:', 'Notes:')}</span></div>
                <div className="flex justify-between mt-1 pt-0.5 border-t border-gray-200">
                    <span className="text-gray-500">{ta('المعلم / الاسم', 'Teacher / Name')}</span>
                    <span className="text-gray-500">{ta('مدير المدرسة / الاسم', 'Principal / Name')}</span>
                </div>
            </div>
        </div>
    );
}

function ThumbnailExtracurricular() {
  const { dir } = useTranslation();
    return (
        <div className="w-full h-full bg-white text-[3px] font-sans overflow-hidden" dir={dir} style={{ fontFamily: 'Cairo, sans-serif' }}>
            <div className="bg-[#1a3a5c] text-white px-1 py-0.5 flex justify-between items-center">
                <span className="opacity-70">{ta('وزارة التعليم', 'Ministry of Education')}</span>
                <span className="opacity-70">{ta('المملكة العربية السعودية', 'Saudi Arabia')}</span>
            </div>
            <div className="bg-[#1a3a5c] text-white text-center py-0.5 text-[3.5px] font-bold">{ta('تقرير تنفيذ نشاط لا صفي', 'Extracurricular Activity Report')}</div>
            <div className="px-1 py-0.5 space-y-0.5">
                <div className="grid grid-cols-2 gap-0.5">
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('اسم النشاط:', 'Activity Name:')}</span></div>
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('التاريخ:', 'Date:')}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-0.5">
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('المنفذون:', 'Implementers:')}</span></div>
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('المستهدفون:', 'Target Audience:')}</span></div>
                </div>
                <div className="border border-gray-300 rounded px-0.5 py-1.5"><span className="text-gray-500">{ta('الأهداف:', 'Objectives:')}</span></div>
                <div className="border border-gray-300 rounded px-0.5 py-1.5"><span className="text-gray-500">{ta('خطوات التنفيذ:', 'Implementation Steps:')}</span></div>
                <div className="grid grid-cols-2 gap-0.5 mt-0.5">
                    <div className="border border-dashed border-gray-300 rounded flex items-center justify-center py-2 text-gray-400">{ta('صورة الشاهد الثاني', 'Second Evidence Image')}</div>
                    <div className="border border-dashed border-gray-300 rounded flex items-center justify-center py-2 text-gray-400">{ta('صورة الشاهد الأول', 'First Evidence Image')}</div>
                </div>
                <div className="flex justify-between mt-1 pt-0.5 border-t border-gray-200">
                    <span className="text-gray-500">{ta('المعلم / الاسم', 'Teacher / Name')}</span>
                    <span className="text-gray-500">{ta('مدير المدرسة / الاسم', 'Principal / Name')}</span>
                </div>
            </div>
        </div>
    );
}

function ThumbnailBroadcast() {
  const { dir } = useTranslation();
    return (
        <div className="w-full h-full bg-white text-[3px] font-sans overflow-hidden" dir={dir} style={{ fontFamily: 'Cairo, sans-serif' }}>
            <div className="bg-[#1a3a5c] text-white px-1 py-0.5 flex justify-between items-center">
                <span className="opacity-70">{ta('وزارة التعليم', 'Ministry of Education')}</span>
                <span className="opacity-70">{ta('المملكة العربية السعودية', 'Saudi Arabia')}</span>
            </div>
            <div className="bg-[#1a3a5c] text-white text-center py-0.5 text-[3.5px] font-bold">{ta('تقرير تنفيذ إذاعة مدرسية', 'School Broadcast Implementation Report')}</div>
            <div className="px-1 py-0.5 space-y-0.5">
                <div className="grid grid-cols-2 gap-0.5">
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('اليوم:', 'Day:')}</span></div>
                    <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('التاريخ:', 'Date:')}</span></div>
                </div>
                <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('موضوع الإذاعة:', 'Broadcast Topic:')}</span></div>
                <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('المشرف على الإذاعة:', 'Broadcast Supervisor:')}</span></div>
                <div className="border border-gray-300 rounded px-0.5 py-0.5"><span className="text-gray-500">{ta('المشاركون:', 'Participants:')}</span></div>
                <div className="border border-gray-300 rounded px-0.5 py-1.5"><span className="text-gray-500">{ta('محاور الإذاعة:', 'Broadcast Themes:')}</span>
                    <div className="mt-0.5 space-y-0.5">
                        <div className="flex gap-0.5"><span className="text-gray-400">١.</span><div className="flex-1 border-b border-gray-200"></div></div>
                        <div className="flex gap-0.5"><span className="text-gray-400">٢.</span><div className="flex-1 border-b border-gray-200"></div></div>
                        <div className="flex gap-0.5"><span className="text-gray-400">٣.</span><div className="flex-1 border-b border-gray-200"></div></div>
                    </div>
                </div>
                <div className="border border-gray-300 rounded px-0.5 py-1"><span className="text-gray-500">{ta('ملاحظات:', 'Notes:')}</span></div>
                <div className="flex justify-between mt-1 pt-0.5 border-t border-gray-200">
                    <span className="text-gray-500">{ta('المعلم / الاسم', 'Teacher / Name')}</span>
                    <span className="text-gray-500">{ta('مدير المدرسة / الاسم', 'Principal / Name')}</span>
                </div>
            </div>
        </div>
    );
}

// ===== Form Definitions =====
const FORMS: FormTemplate[] = [
    {
        id: 'waiting-period',
        title: ta('تقرير تنفيذ حصة إنتظار', 'Substitute Lesson Implementation Report'),
        description: ta('نموذج توثيق تنفيذ حصة الانتظار مع تفاصيل الأنشطة المنفذة والملاحظات', 'Wait class implementation documentation form with activity details and notes'),
        icon: ClipboardList,
        gradient: 'from-emerald-600 to-green-700',
        badge: 'الأكثر استخداماً',
        thumbnail: <ThumbnailWaiting />,
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'day', label: ta('اليوم', 'Today'), type: 'text', placeholder: ta('الأحد', 'Sunday') },
            { key: 'date', label: ta('التاريخ', 'History'), type: 'text', placeholder: ta('١٤٤٧/٢/١٢هـ', '12/2/1447H') },
            { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('ثاني متوسط', 'Second Intermediate') },
            { key: 'class', label: ta('الفصل', 'Class'), type: 'text', placeholder: '٣' },
            { key: 'period', label: ta('الحصة', 'Period'), type: 'text', placeholder: ta('الثانية', 'Second') },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('الرياضيات', 'Mathematics') },
            { key: 'absent_teacher', label: ta('المعلم الغائب', 'Absent Teacher'), type: 'text', placeholder: ta('اسم المعلم الغائب', 'Absent Teacher') },
            { key: 'waiting_teacher', label: ta('المعلم المنتظر', 'Substitute Teacher'), type: 'text', placeholder: ta('اسم المعلم المنتظر', 'Substitute Teacher Name') },
            { key: 'activities', label: ta('الأنشطة المنفذة خلال الحصة', 'Activities Implemented During the Class'), type: 'textarea', placeholder: ta('١. مراجعة الدروس السابقة.\n٢. حل تمارين من الكتاب.\n٣. نشاط تعليمي تفاعلي.', '١. مراجعة الدروس السابقة.\\n٢. حل تمارين من الكتاب.\\n٣. نشاط تعليمي تفاعلي.'), rows: 5 },
            { key: 'notes', label: ta('ملاحظات', 'Notes'), type: 'textarea', placeholder: ta('أي ملاحظات إضافية...', 'Any additional notes...'), rows: 3 },
            { key: 'right_sig', label: ta('وظيفة واسم التوقيع الأيمن', 'Right Signature Name & Title'), type: 'textarea', placeholder: ta('المعلم\nالاسم', 'المعلم\\nالاسم'), rows: 2 },
            { key: 'left_sig', label: ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title'), type: 'textarea', placeholder: ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم'), rows: 2 },
        ],
    },
    {
        id: 'extracurricular',
        title: ta('تقرير تنفيذ نشاط لا صفي', 'Extracurricular Activity Report'),
        description: ta('نموذج توثيق تنفيذ الأنشطة اللاصفية مع الشواهد والأهداف وخطوات التنفيذ', 'Extracurricular activity documentation form with evidence, objectives, and implementation steps'),
        icon: BookOpen,
        gradient: 'from-teal-600 to-emerald-700',
        thumbnail: <ThumbnailExtracurricular />,
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'activity_name', label: ta('اسم النشاط', 'Activity Name'), type: 'text', placeholder: ta('اسم النشاط اللاصفي', 'Extracurricular Activity Name'), required: true },
            { key: 'date', label: ta('تاريخ التنفيذ', 'Implementation Date'), type: 'text', placeholder: ta('١٤٤٧/٢/١٢هـ', '12/2/1447H') },
            { key: 'implementors', label: ta('المنفذون', 'Implementers'), type: 'text', placeholder: ta('أسماء المنفذين', 'Implementers Names') },
            { key: 'targets', label: ta('المستهدفون', 'Target Group'), type: 'text', placeholder: ta('الطلاب / الصف الثاني', 'Students / Second Grade') },
            { key: 'targets_count', label: ta('عدد المستهدفين', 'Number of Targets'), type: 'text', placeholder: ta('٣٠ طالب', '30 students') },
            { key: 'location', label: ta('مكان التنفيذ', 'Implementation Location'), type: 'text', placeholder: ta('فناء المدرسة', 'School Courtyard') },
            { key: 'objectives', label: ta('الأهداف', 'Objectives'), type: 'textarea', placeholder: ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.'), rows: 4 },
            { key: 'steps', label: ta('خطوات التنفيذ', 'Implementation Steps'), type: 'textarea', placeholder: ta('١. الخطوة الأولى.\n٢. الخطوة الثانية.\n٣. الخطوة الثالثة.', '١. الخطوة الأولى.\\n٢. الخطوة الثانية.\\n٣. الخطوة الثالثة.'), rows: 4 },
            { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image' },
            { key: 'image2', label: ta('صورة الشاهد الثاني', 'Second Evidence Image'), type: 'image' },
            { key: 'right_sig', label: ta('وظيفة واسم التوقيع الأيمن', 'Right Signature Name & Title'), type: 'textarea', placeholder: ta('المعلم\nالاسم', 'المعلم\\nالاسم'), rows: 2 },
            { key: 'left_sig', label: ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title'), type: 'textarea', placeholder: ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم'), rows: 2 },
            { key: 'evidence_url', label: ta('رابط الشواهد (اختياري - سيتحول لباركود)', 'Evidence link (optional - will convert to barcode)'), type: 'url', placeholder: 'https://' },
        ],
    },
    {
        id: 'school-broadcast',
        title: ta('تقرير تنفيذ إذاعة مدرسية', 'School Broadcast Implementation Report'),
        description: ta('نموذج توثيق تنفيذ الإذاعة المدرسية مع محاورها والمشاركين فيها', 'School broadcast documentation form with themes and participants'),
        icon: FileText,
        gradient: 'from-green-600 to-teal-700',
        thumbnail: <ThumbnailBroadcast />,
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'day', label: ta('اليوم', 'Today'), type: 'text', placeholder: ta('الأحد', 'Sunday') },
            { key: 'date', label: ta('التاريخ', 'History'), type: 'text', placeholder: ta('١٤٤٧/٢/١٢هـ', '12/2/1447H') },
            { key: 'topic', label: ta('موضوع الإذاعة', 'Broadcast Topic'), type: 'text', placeholder: ta('موضوع الإذاعة المدرسية', 'School Broadcast Topic'), required: true },
            { key: 'supervisor', label: ta('المشرف على الإذاعة', 'Broadcast Supervisor'), type: 'text', placeholder: ta('اسم المشرف', 'Supervisor Name') },
            { key: 'participants', label: ta('المشاركون في الإذاعة', 'Broadcast Participants'), type: 'text', placeholder: ta('أسماء المشاركين', 'Participants Names') },
            { key: 'axes', label: ta('محاور الإذاعة', 'Broadcast Topics'), type: 'textarea', placeholder: ta('١. التلاوة القرآنية.\n٢. الحديث الشريف.\n٣. كلمة الصباح.\n٤. فقرة ثقافية.\n٥. فقرة ترفيهية.', '١. التلاوة القرآنية.\\n٢. الحديث الشريف.\\n٣. كلمة الصباح.\\n٤. فقرة ثقافية.\\n٥. فقرة ترفيهية.'), rows: 5 },
            { key: 'notes', label: ta('ملاحظات', 'Notes'), type: 'textarea', placeholder: ta('أي ملاحظات إضافية...', 'Any additional notes...'), rows: 3 },
            { key: 'right_sig', label: ta('وظيفة واسم التوقيع الأيمن', 'Right Signature Name & Title'), type: 'textarea', placeholder: ta('المعلم\nالاسم', 'المعلم\\nالاسم'), rows: 2 },
            { key: 'left_sig', label: ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title'), type: 'textarea', placeholder: ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم'), rows: 2 },
        ],
    },
];

// ===== Field Input =====
function FieldInput({ field, value, image, onChange, onImage, onRemoveImage }: {
    field: FormField; value: string; image?: string;
    onChange: (v: string) => void; onImage: (f: File) => void; onRemoveImage: () => void;
}) {
    if (field.type === 'textarea') return (
        <Textarea placeholder={field.placeholder} rows={field.rows || 3} value={value}
            onChange={e => onChange(e.target.value)} className="resize-none text-sm" />
    );
    if (field.type === 'image') return (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center hover:border-primary/50 transition-colors">
            {image ? (
                <div className="relative">
                    <img src={image} alt={field.label} className="w-full h-28 object-cover rounded-lg" />
                    <button onClick={onRemoveImage} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                </div>
            ) : (
                <label className="cursor-pointer">
                    <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">{ta('اضغط لرفع صورة', 'Click to Upload Image')}</p>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onImage(e.target.files[0])} />
                </label>
            )}
        </div>
    );
    if (field.type === 'url') return (
        <div className="relative">
            <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input type="url" placeholder={field.placeholder} value={value} onChange={e => onChange(e.target.value)} className="pr-10 text-sm" />
        </div>
    );
    return <Input placeholder={field.placeholder} value={value} onChange={e => onChange(e.target.value)} className="text-sm" />;
}

// ===== Form Page =====
function FormPage({ form, onBack }: { form: FormTemplate; onBack: () => void }) {
  const { dir } = useTranslation();
    const [values, setValues] = useState<Record<string, string>>({});
    const [images, setImages] = useState<Record<string, string>>({});

    const setValue = (key: string, val: string) => setValues(prev => ({ ...prev, [key]: val }));
    const handleImage = (key: string, file: File) => {
        const reader = new FileReader();
        reader.onload = e => setImages(prev => ({ ...prev, [key]: e.target?.result as string }));
        reader.readAsDataURL(file);
    };
    const handleReset = () => { setValues({}); setImages({}); toast.success(ta('تم مسح جميع البيانات', 'All data cleared')); };
    const handleDownload = () => {
        toast.success(ta('جاري تحضير الملف للتحميل...', 'Preparing file for download...'));
        setTimeout(() => window.print(), 500);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-sm">{ta('العودة للنماذج', 'Back to Forms')}</span>
                </button>

                <Card className="border-0 shadow-lg">
                    <CardHeader className={`bg-gradient-to-l ${form.gradient} text-white rounded-t-xl`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <form.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{form.title}</CardTitle>
                                <CardDescription className="text-white/80 text-xs mt-0.5">{form.description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                        {form.fields.map(field => (
                            <div key={field.key}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    {field.label}{field.required && <span className="text-red-500 me-1">*</span>}
                                </label>
                                <FieldInput
                                    field={field} value={values[field.key] || ''} image={images[field.key]}
                                    onChange={v => setValue(field.key, v)}
                                    onImage={f => handleImage(field.key, f)}
                                    onRemoveImage={() => setImages(p => { const n = { ...p }; delete n[field.key]; return n; })}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex gap-3 mt-4 print:hidden">
                    <Button onClick={handleDownload} className={`flex-1 bg-gradient-to-l ${form.gradient} text-white border-0 hover:opacity-90 gap-2`}>
                        <Download className="w-4 h-4" />
                        {ta('طباعة / تحميل PDF', 'Print / Download PDF')}
                    </Button>
                    <Button variant="outline" onClick={handleReset} className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        {ta('مسح', 'Clear')}
                    </Button>
                </div>
            </main>
            <Footer />
            <style>{`
                @media print {
                    nav, footer, button, .print\\:hidden { display: none !important; }
                    body { background: white !important; }
                }
            `}</style>
        </div>
    );
}

// ===== Main Page =====
export default function JobDutiesPage() {
    const { dir } = useTranslation();
    const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);

    if (selectedForm) {
        return <FormPage form={selectedForm} onBack={() => setSelectedForm(null)} />;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300" dir={dir}>
            <Navbar />
            <main>
                {/* Hero */}
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-emerald-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-emerald-500/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-10 left-[10%] w-64 h-64 bg-green-500/15 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                                <ClipboardList className="w-4 h-4 text-emerald-400" />
                                {ta('أداء الواجبات الوظيفية', 'Job Duties Performance')}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                                {ta('أداء الواجبات الوظيفية', 'Job Duties Performance')}
                            </h1>
                            <p className="text-lg text-white/70 mb-6">
                                {ta('تقارير ونماذج جاهزة للتحميل والطباعة بصيغة PDF مفرغة وجاهزة لإضافة محتواك', 'Ready reports and forms for download and printing as empty PDF ready for your content')}
                            </p>
                            <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{FORMS.length} نماذج جاهزة</span>
                                <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF مجاني', 'Free PDF Download')}</span>
                                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Forms Grid */}
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FORMS.map(form => (
                            <Card
                                key={form.id}
                                className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800"
                                onClick={() => setSelectedForm(form)}
                            >
                                <div className={`h-2 bg-gradient-to-l ${form.gradient}`} />

                                {/* Thumbnail Preview */}
                                <div className="mx-4 mt-4 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-900" style={{ height: '180px' }}>
                                    <div className="w-full h-full scale-100 origin-top-left" style={{ fontSize: '3px' }}>
                                        {form.thumbnail}
                                    </div>
                                </div>

                                <CardHeader className="pb-3 pt-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${form.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                            <form.icon className="w-5 h-5" />
                                        </div>
                                        {form.badge && (
                                            <Badge className="bg-amber-500 text-white text-xs">{form.badge}</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                                        {form.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs line-clamp-2 mt-1">
                                        {form.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>{form.fields.filter(f => f.type !== 'image').length} حقل نصي</span>
                                        {form.fields.some(f => f.type === 'image') && (
                                            <>
                                                <span>•</span>
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                <span>{form.fields.filter(f => f.type === 'image').length} صورة</span>
                                            </>
                                        )}
                                    </div>
                                    <Button className={`w-full bg-gradient-to-l ${form.gradient} text-white border-0 hover:opacity-90 gap-2`}>
                                        <Eye className="w-4 h-4" />
                                        {ta('ابدأ التصميم', 'Start Design')}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />

            <style>{`
                @media print {
                    nav, footer, button, .sticky { display: none !important; }
                    body { background: white !important; }
                }
            `}</style>
        </div>
    );
}
