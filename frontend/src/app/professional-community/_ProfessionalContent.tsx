'use client';

import { useState } from 'react';
import { useFirestoreForms } from '@/hooks/useFirestoreForms';
import { useLocalDraft } from '@/hooks/useLocalDraft';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Eye, Download, RotateCcw, ChevronRight, Image as ImageIcon, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

interface FieldDef { key: string; label: string; type: 'text' | 'textarea' | 'image'; placeholder?: string; rows?: number; required?: boolean; }
interface FormDef { id: string; title: string; description: string; gradient: string; badge?: string; fields: FieldDef[]; }

const FORMS: FormDef[] = [
    {
        id: 'visit-exchange',
        title: ta('استمارة وتقرير تبادل الزيارات بين المعلمين', 'Teacher Peer Visit Exchange Form'),
        description: ta('نموذج لإنشاء استمارة وتقرير تبادل الزيارات بين المعلمين من جوالك مباشرة', 'Form to create a peer visit exchange report directly from your phone'),
        gradient: 'from-teal-600 to-emerald-700',
        badge: 'الأكثر استخداماً',
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'visiting_teachers', label: ta('أسماء المعلمين الزائرين', 'Visiting Teachers Names'), type: 'textarea', placeholder: ta('اسم المعلم الأول\nاسم المعلم الثاني\nاسم المعلم الثالث', 'اسم المعلم الأول\\nاسم المعلم الثاني\\nاسم المعلم الثالث'), rows: 3 },
            { key: 'visited_teacher', label: ta('اسم المعلم/ة المُقَرَّر/ة', 'Assigned Teacher Name (M/F)'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('مادة', 'Subject') },
            { key: 'visit_date', label: ta('اليوم والتاريخ', 'Day & Date'), type: 'text', placeholder: ta('الأحد - 1447/12/3هـ', 'Sunday - 3/12/1447H') },
            { key: 'class_grade', label: ta('الصف / الفصل', 'Grade / Section'), type: 'text', placeholder: ta('الصف', 'Grade') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الأول', 'First') },
            { key: 'unit_lesson', label: ta('الوحدة وعنوان الدرس', 'Unit and Lesson Title'), type: 'textarea', placeholder: ta('عنوان الدرس', 'Lesson Title'), rows: 2 },
            { key: 'visit_goals', label: ta('أهداف الزيارة', 'Visit Objectives'), type: 'textarea', placeholder: 'أ. تبادل الخبرات التربوية بين المعلمين.\nب. الاطلاع على أساليب واستراتيجيات التدريس المختلفة.\nج. تحسين الأداء التدريسي من خلال الاستفادة من الممارسات الناجحة.\nد. تعزيز التعاون والتواصل بين المعلمين في بيئة العمل.\nهـ. متابعة طرق تفاعل الطلاب مع الدروس واستراتيجيات التقييم.', rows: 5 },
            { key: 'principal_name', label: ta('اسم المدير/ة', 'Principal Name (M/F)'), type: 'textarea', placeholder: ta('مدير المدرسة\nاسم المدير', 'مدير المدرسة\\nاسم المدير'), rows: 2 },
        ],
    },
    {
        id: 'plc-session',
        title: ta('تقرير جلسات مجتمعات التعلم المهنية', 'Professional Learning Communities Sessions Report'),
        description: ta('نموذج توثيق جلسات مجتمعات التعلم المهنية كشاهد على التفاعل مع المجتمع المهني', 'Professional learning communities sessions documentation form as evidence of professional community interaction'),
        gradient: 'from-emerald-600 to-green-700',
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة'), rows: 3 },
            { key: 'session_number', label: ta('رقم الجلسة', 'Session Number'), type: 'text', placeholder: ta('الجلسة الأولى', 'First Session') },
            { key: 'topic', label: ta('موضوع الجلسة', 'Session Topic'), type: 'text', placeholder: ta('موضوع الجلسة', 'Session Topic'), required: true },
            { key: 'tools', label: ta('أوعية وأدوات التطوير المهني', 'Professional Development Tools and Resources'), type: 'text', placeholder: ta('التدريب المصغر', 'Micro Training') },
            { key: 'date', label: ta('اليوم / التاريخ', 'Day / Date'), type: 'text', placeholder: ta('الأحد - ١٤٤٧/١٢/١٢هـ', 'Sunday - 12/12/1447H') },
            { key: 'location', label: ta('مكان التنفيذ', 'Implementation Location'), type: 'text', placeholder: ta('صالة الاجتماعات بالمدرسة', 'School Meeting Hall') },
            { key: 'attendees_count', label: ta('عدد الحضور', 'Attendance Count'), type: 'text', placeholder: '٤' },
            { key: 'target_group', label: ta('الفئة المستهدفة (التخصص)', 'Target Group (Specialization)'), type: 'text', placeholder: ta('معلمو تخصص الرياضيات', 'Mathematics Specialty Teachers') },
            { key: 'next_session', label: ta('موعد الجلسة القادمة', 'Next Session Date'), type: 'text', placeholder: ta('يحدد لا حقاً', 'To be determined later') },
            { key: 'objectives', label: ta('أهداف الجلسة', 'Session Objectives'), type: 'textarea', placeholder: ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.\n٥. الهدف الخامس.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.\\n٥. الهدف الخامس.'), rows: 5 },
            { key: 'outcomes', label: ta('نتائج الجلسة', 'Session Results'), type: 'textarea', placeholder: ta('١. النتيجة الأولى.\n٢. النتيجة الثانية.\n٣. النتيجة الثالثة.\n٤. النتيجة الرابعة.\n٥. النتيجة الخامسة.', '١. النتيجة الأولى.\\n٢. النتيجة الثانية.\\n٣. النتيجة الثالثة.\\n٤. النتيجة الرابعة.\\n٥. النتيجة الخامسة.'), rows: 5 },
            { key: 'members', label: ta('أسماء الحاضرين (كل اسم في سطر)', 'Attendees Names (each name on a line)'), type: 'textarea', placeholder: ta('المعلم الأول\nالمعلم الثاني\nالمعلم الثالث\nالمعلم الرابع', 'المعلم الأول\\nالمعلم الثاني\\nالمعلم الثالث\\nالمعلم الرابع'), rows: 4 },
            { key: 'right_sig', label: ta('وظيفة واسم التوقيع الأيمن', 'Right Signature Name & Title'), type: 'textarea', placeholder: ta('المعلم المنفذ\nاسم المعلم', 'المعلم المنفذ\\nاسم المعلم'), rows: 2 },
            { key: 'left_sig', label: ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title'), type: 'textarea', placeholder: ta('مدير المدرسة\nاسم المدير', 'مدير المدرسة\\nاسم المدير'), rows: 2 },
        ],
    },
];

function FormFill({ form, onBack }: { form: FormDef; onBack: () => void }) {
  const { dir } = useTranslation();
    // [C-01 FIX] Auto-save to localStorage — prevents data loss on page refresh
    const [v, setV, clearDraft] = useLocalDraft(`prof-form-${form.id}`, {} as Record<string, string>);
    const [images, setImages] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);
    const set = (k: string, val: string) => setV((p: Record<string, string>) => ({ ...p, [k]: val }));
    const handleImage = (key: string, file: File) => {
        const r = new FileReader();
        r.onload = e => setImages(p => ({ ...p, [key]: e.target?.result as string }));
        r.readAsDataURL(file);
    };

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

    // Group image fields and pair them
    const imageFields = form.fields.filter(f => f.type === 'image');
    const nonImageFields = form.fields.filter(f => f.type !== 'image');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة', 'Go Back')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className={`bg-gradient-to-l ${form.gradient} text-white rounded-t-xl`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Users className="w-5 h-5" /></div>
                                <div>
                                    <CardTitle className="text-sm">{form.title}</CardTitle>
                                    <CardDescription className="text-white/80 text-xs mt-0.5">{form.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {form.id === 'visit-exchange' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label>
                                        <Textarea placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} rows={3} value={v.edu_school || ''} onChange={e => set('edu_school', e.target.value)} className="resize-y text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('أسماء المعلمين الزائرين:', 'Visiting Teachers:')}</label>
                                        <Textarea placeholder={ta('اسم المعلم الأول\nاسم المعلم الثاني\nاسم المعلم الثالث', 'اسم المعلم الأول\\nاسم المعلم الثاني\\nاسم المعلم الثالث')} rows={3} value={v.visiting_teachers || ''} onChange={e => set('visiting_teachers', e.target.value)} className="resize-y text-sm" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم المعلم/ة المُقَرَّر/ة:', 'Assigned Teacher Name (M/F):')}</label>
                                            <Input placeholder={ta('اسم المعلم', 'Teacher Name')} value={v.visited_teacher || ''} onChange={e => set('visited_teacher', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المادة:', 'Subject:')}</label>
                                            <Input placeholder={ta('مادة', 'Subject')} value={v.subject || ''} onChange={e => set('subject', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اليوم والتاريخ:', 'Day and Date:')}</label>
                                            <Input placeholder={ta('الأحد - 1447/12/3هـ', 'Sunday - 3/12/1447H')} value={v.visit_date || ''} onChange={e => set('visit_date', e.target.value)} className="text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الصف / الفصل:', 'Grade / Class:')}</label>
                                            <Input placeholder={ta('الصف', 'Grade')} value={v.class_grade || ''} onChange={e => set('class_grade', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الفصل الدراسي:', 'Semester:')}</label>
                                            <Input placeholder={ta('الأول', 'First')} value={v.semester || ''} onChange={e => set('semester', e.target.value)} className="text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الوحدة وعنوان الدرس:', 'Unit & Lesson Title:')}</label>
                                        <Textarea placeholder={ta('عنوان الدرس', 'Lesson Title')} rows={2} value={v.unit_lesson || ''} onChange={e => set('unit_lesson', e.target.value)} className="resize-y text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('أهداف الزيارة:', 'Visit Objectives:')}</label>
                                        <Textarea placeholder={ta('أ. تبادل الخبرات التربوية بين المعلمين.\nب. الاطلاع على أساليب واستراتيجيات التدريس المختلفة.\nج. تحسين الأداء التدريسي من خلال الاستفادة من الممارسات الناجحة.\nد. تعزيز التعاون والتواصل بين المعلمين في بيئة العمل.\nهـ. متابعة طرق تفاعل الطلاب مع الدروس واستراتيجيات التقييم.', 'أ. تبادل الخبرات التربوية بين المعلمين.\\nب. الاطلاع على أساليب واستراتيجيات التدريس المختلفة.\\nج. تحسين الأداء التدريسي من خلال الاستفادة من الممارسات الناجحة.\\nد. تعزيز التعاون والتواصل بين المعلمين في بيئة العمل.\\nهـ. متابعة طرق تفاعل الطلاب مع الدروس واستراتيجيات التقييم.')} rows={5} value={v.visit_goals || ''} onChange={e => set('visit_goals', e.target.value)} className="resize-y text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم المدير/ة:', 'Principal Name (M/F):')}</label>
                                        <Textarea placeholder={ta('مدير المدرسة\nاسم المدير', 'مدير المدرسة\\nاسم المدير')} rows={2} value={v.principal_name || ''} onChange={e => set('principal_name', e.target.value)} className="resize-y text-sm" />
                                    </div>
                                </>
                            ) : form.id === 'plc-session' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label>
                                        <Textarea placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} rows={3} value={v.edu_school || ''} onChange={e => set('edu_school', e.target.value)} className="resize-y text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('رقم الجلسة:', 'Session Number:')}</label>
                                        <Input placeholder={ta('الجلسة الأولى', 'First Session')} value={v.session_number || ''} onChange={e => set('session_number', e.target.value)} className="text-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('موضوع الجلسة:', 'Session Topic:')}</label>
                                            <Input placeholder={ta('موضوع الجلسة', 'Session Topic')} value={v.topic || ''} onChange={e => set('topic', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('أوعية وأدوات التطوير المهني:', 'Professional Development Tools:')}</label>
                                            <Input placeholder={ta('التدريب المصغر', 'Micro Training')} value={v.tools || ''} onChange={e => set('tools', e.target.value)} className="text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اليوم / التاريخ:', 'Day / Date:')}</label>
                                            <Input placeholder={ta('الأحد - ١٤٤٧/١٢/١٢هـ', 'Sunday - 12/12/1447H')} value={v.date || ''} onChange={e => set('date', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مكان التنفيذ:', 'Location:')}</label>
                                            <Input placeholder={ta('صالة الاجتماعات', 'Meeting Hall')} value={v.location || ''} onChange={e => set('location', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('عدد الحضور:', 'Attendance:')}</label>
                                            <Input placeholder={ta('٤', '4')} value={v.attendees_count || ''} onChange={e => set('attendees_count', e.target.value)} className="text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الفئة المستهدفة (التخصص):', 'Target Group (Specialization):')}</label>
                                            <Input placeholder={ta('معلمو تخصص الرياضيات', 'Mathematics Specialty Teachers')} value={v.target_group || ''} onChange={e => set('target_group', e.target.value)} className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('موعد الجلسة القادمة:', 'Next Session Date:')}</label>
                                            <Input placeholder={ta('يحدد لا حقاً', 'To be determined later')} value={v.next_session || ''} onChange={e => set('next_session', e.target.value)} className="text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('أهداف الجلسة:', 'Session Objectives:')}</label>
                                        <Textarea placeholder={ta('١. الهدف الأول.\n٢. الهدف الثاني.\n٣. الهدف الثالث.\n٤. الهدف الرابع.\n٥. الهدف الخامس.', '١. الهدف الأول.\\n٢. الهدف الثاني.\\n٣. الهدف الثالث.\\n٤. الهدف الرابع.\\n٥. الهدف الخامس.')} rows={5} value={v.objectives || ''} onChange={e => set('objectives', e.target.value)} className="resize-y text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('نتائج الجلسة:', 'Session Results:')}</label>
                                        <Textarea placeholder={ta('١. النتيجة الأولى.\n٢. النتيجة الثانية.\n٣. النتيجة الثالثة.\n٤. النتيجة الرابعة.\n٥. النتيجة الخامسة.', '١. النتيجة الأولى.\\n٢. النتيجة الثانية.\\n٣. النتيجة الثالثة.\\n٤. النتيجة الرابعة.\\n٥. النتيجة الخامسة.')} rows={5} value={v.outcomes || ''} onChange={e => set('outcomes', e.target.value)} className="resize-y text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('أسماء الحاضرين (كل اسم في سطر):', 'Attendees (each name on a line):')}</label>
                                        <Textarea placeholder={ta('المعلم الأول\nالمعلم الثاني\nالمعلم الثالث\nالمعلم الرابع', 'المعلم الأول\\nالمعلم الثاني\\nالمعلم الثالث\\nالمعلم الرابع')} rows={4} value={v.members || ''} onChange={e => set('members', e.target.value)} className="resize-y text-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيمن:', 'Right Signature Name & Title:')}</label>
                                            <Textarea placeholder={ta('المعلم المنفذ\nاسم المعلم', 'المعلم المنفذ\\nاسم المعلم')} rows={2} value={v.right_sig || ''} onChange={e => set('right_sig', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيسر:', 'Left Signature Name & Title:')}</label>
                                            <Textarea placeholder={ta('مدير المدرسة\nاسم المدير', 'مدير المدرسة\\nاسم المدير')} rows={2} value={v.left_sig || ''} onChange={e => set('left_sig', e.target.value)} className="resize-y text-sm" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {nonImageFields.map(field => (
                                        <div key={field.key}>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                {field.label}{field.required && <span className="text-red-500 me-1">*</span>}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <Textarea rows={field.rows || 3} placeholder={field.placeholder} value={v[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="resize-y text-sm" />
                                            ) : (
                                                <Input placeholder={field.placeholder} value={v[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="text-sm" />
                                            )}
                                        </div>
                                    ))}
                                    {imageFields.length > 0 && (
                                        <div className={`grid grid-cols-${Math.min(imageFields.length, 2)} gap-2`}>
                                            {imageFields.map(f => <ImgField key={f.key} k={f.key} label={f.label} />)}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <Button onClick={() => setShowPreview(true)} className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm">
                                        <Eye className="w-4 h-4" /> {ta('معاينة', 'Preview')}
                                    </Button>
                                    <Button onClick={() => { clearDraft(); setImages({}); setShowPreview(false); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm">
                                        <RotateCcw className="w-4 h-4" /> {ta('مسح المسودة', 'Clear Draft')}
                                    </Button>
                                </div>
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`w-full gap-2 bg-gradient-to-l ${form.gradient} text-white border-0 text-sm`}>
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Live Preview */}
                    <div className="sticky top-24">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4" /> {ta('معاينة مباشرة', 'Live Preview')}
                        </p>
                        {showPreview || Object.keys(v).some(k => v[k]) || Object.keys(images).length > 0 ? (
                            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                                {/* MOE Header */}
                                {form.id === 'visit-exchange' ? (
                                    <>
                                        {/* MOE Header */}
                                        <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
                                                <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
                                                    {(v.edu_school || '').split('\n').filter(l => l.trim()).map((l, i) => (
                                                        <div key={i} style={{ fontSize: '12px', fontWeight: 'bold' }}>{l}</div>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                                                        {Array.from({length: 20}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />)}
                                                    </div>
                                                    <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                                                    <div style={{ lineHeight: '1.5' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                                        <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                                                    </div>
                                                </div>
                                                <div />
                                            </div>
                                        </div>
                                        <div style={{ height: '4px', background: 'linear-gradient(to left, #3ab5b0, #1a7abf)' }} />
                                        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
                                            {/* شريط العنوان */}
                                            <div style={{ background: '#1e3a4a', color: 'white', textAlign: 'center', padding: '7px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                                                {ta('استمارة وتقرير تبادل الزيارات بين المعلمين', 'Teacher Peer Visit Exchange Form')}
                                            </div>
                                            {/* أسماء المعلمين الزائرين */}
                                            <div style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '8px 12px', position: 'relative' }}>
                                                <div style={{ position: 'absolute', top: '-9px', right: '10px', background: 'white', padding: '0 4px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{ta('أسماء المعلمين الزائرين:', 'Visiting Teachers:')}</div>
                                                <div style={{ paddingTop: '4px', minHeight: '20px' }}>
                                                    {(v.visiting_teachers || '').split('\n').filter(l => l.trim()).map((t, i) => (
                                                        <div key={i} style={{ lineHeight: '1.7' }}>{t}</div>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* اسم المعلم + المادة + التاريخ */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                {[['visited_teacher','اسم المعلم/ة المُقَرَّر/ة'],['subject','المادة'],['visit_date','اليوم والتاريخ']].map(([k,l]) => (
                                                    <div key={k} style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '6px 8px', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', top: '-9px', right: '6px', background: 'white', padding: '0 3px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{l}:</div>
                                                        <div style={{ paddingTop: '3px', minHeight: '20px', fontSize: '10px' }}>{v[k] || ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* الصف + الفصل */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                {[['class_grade','الصف / الفصل'],['semester','الفصل الدراسي']].map(([k,l]) => (
                                                    <div key={k} style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '6px 8px', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', top: '-9px', right: '6px', background: 'white', padding: '0 3px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{l}:</div>
                                                        <div style={{ paddingTop: '3px', minHeight: '20px', fontSize: '10px' }}>{v[k] || ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* الوحدة وعنوان الدرس */}
                                            <div style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '6px 10px', position: 'relative' }}>
                                                <div style={{ position: 'absolute', top: '-9px', right: '8px', background: 'white', padding: '0 3px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{ta('الوحدة وعنوان الدرس:', 'Unit & Lesson Title:')}</div>
                                                <div style={{ paddingTop: '3px', minHeight: '20px', fontSize: '10px' }}>{v.unit_lesson || ''}</div>
                                            </div>
                                            {/* أهداف الزيارة */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                                                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#1a5e6e' }}>{ta('أهداف الزيارة', 'Visit Objectives')}</div>
                                                    <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                                                </div>
                                                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 12px', minHeight: '60px', whiteSpace: 'pre-wrap', lineHeight: '1.9', fontSize: '11px' }}>{v.visit_goals || ''}</div>
                                            </div>
                                            {/* جدول الحاضرين من visiting_teachers */}
                                            {v.visiting_teachers && (
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#1a5e6e' }}>{ta('اسماء وتواقيع الحاضرين', 'Attendees Names and Signatures')}</div>
                                                        <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                                                    </div>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                                        <thead>
                                                            <tr style={{ background: '#1e3a4a', color: 'white' }}>
                                                                <td style={{ padding: '5px 8px', textAlign: 'center', width: '30px', border: '1px solid #ccc' }}>م</td>
                                                                <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #ccc' }}>{ta('الاسم', 'Name')}</td>
                                                                <td style={{ padding: '5px 8px', textAlign: 'center', width: '80px', border: '1px solid #ccc' }}>{ta('التوقيع', 'Signature')}</td>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {v.visiting_teachers.split('\n').filter(l => l.trim()).map((name, i) => (
                                                                <tr key={i} style={{ background: i % 2 === 1 ? '#f0faf8' : 'white' }}>
                                                                    <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #ddd' }}>{i + 1}</td>
                                                                    <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #ddd' }}>{name}</td>
                                                                    <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {/* التوقيعات */}
                                            {(v.principal_name) && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 16px', marginTop: '4px', borderTop: '1px solid #eee' }}>
                                                    <div style={{ textAlign: 'center', fontSize: '11px' }}>
                                                        {(v.visited_teacher ? `المعلم/ة المُقَرَّر/ة\n${v.visited_teacher}` : '').split('\n').map((l, i) => <div key={i} style={{ lineHeight: '1.7' }}>{l}</div>)}
                                                    </div>
                                                    <div style={{ textAlign: 'center', fontSize: '11px' }}>
                                                        {v.principal_name.split('\n').map((l, i) => <div key={i} style={{ lineHeight: '1.7' }}>{l}</div>)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '7px', fontSize: '10px', fontWeight: 'bold' }}>
                                            {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                                        </div>
                                    </>
                                ) : form.id === 'plc-session' ? (
                                    <>
                                        {/* MOE Header */}
                                        <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
                                                <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
                                                    {(v.edu_school || '').split('\n').filter(l => l.trim()).map((l, i) => (
                                                        <div key={i} style={{ fontSize: '12px', fontWeight: 'bold' }}>{l}</div>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,5px)', gap: '3px' }}>
                                                        {Array.from({length: 20}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />)}
                                                    </div>
                                                    <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.6)' }} />
                                                    <div style={{ lineHeight: '1.5' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                                                        <div style={{ fontSize: '10px', opacity: 0.85 }}>Ministry of Education</div>
                                                    </div>
                                                </div>
                                                <div />
                                            </div>
                                        </div>
                                        <div style={{ height: '4px', background: 'linear-gradient(to left, #3ab5b0, #1a7abf)' }} />
                                        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
                                            {/* عنوان الجلسة */}
                                            <div style={{ background: '#1e3a4a', color: 'white', textAlign: 'center', padding: '7px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                                                تقرير جلسات مجتمعات التعلم المهنية {v.session_number ? `- (${v.session_number})` : ''}
                                            </div>
                                            {/* موضوع + أوعية */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                {[['topic','موضوع الجلسة'],['tools','أوعية وأدوات التطوير المهني']].map(([k,l]) => (
                                                    <div key={k} style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '6px 10px', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', top: '-9px', right: '8px', background: 'white', padding: '0 4px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{l}:</div>
                                                        <div style={{ paddingTop: '3px', minHeight: '20px' }}>{v[k] || ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* اليوم + مكان + عدد */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                {[['date','اليوم / التاريخ'],['location','مكان التنفيذ'],['attendees_count','عدد الحضور']].map(([k,l]) => (
                                                    <div key={k} style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '6px 8px', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', top: '-9px', right: '6px', background: 'white', padding: '0 3px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{l}:</div>
                                                        <div style={{ paddingTop: '3px', minHeight: '20px', fontSize: '10px' }}>{v[k] || ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* فئة مستهدفة + موعد قادم */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                {[['target_group','الفئة المستهدفة (التخصص)'],['next_session','موعد الجلسة القادمة']].map(([k,l]) => (
                                                    <div key={k} style={{ border: '2px solid #3ab5b0', borderRadius: '6px', padding: '6px 8px', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', top: '-9px', right: '6px', background: 'white', padding: '0 3px', fontSize: '9px', fontWeight: 'bold', color: '#1a9e6e' }}>{l}:</div>
                                                        <div style={{ paddingTop: '3px', minHeight: '20px', fontSize: '10px' }}>{v[k] || ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* أهداف الجلسة */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                                                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#1a5e6e' }}>{ta('أهداف الجلسة', 'Session Objectives')}</div>
                                                    <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                                                </div>
                                                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 12px', minHeight: '60px', whiteSpace: 'pre-wrap', lineHeight: '1.9', fontSize: '11px' }}>{v.objectives || ''}</div>
                                            </div>
                                            {/* نتائج الجلسة */}
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                                                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#1a5e6e' }}>{ta('نتائج الجلسة', 'Session Results')}</div>
                                                    <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                                                </div>
                                                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 12px', minHeight: '60px', whiteSpace: 'pre-wrap', lineHeight: '1.9', fontSize: '11px' }}>{v.outcomes || ''}</div>
                                            </div>
                                            {/* جدول الحاضرين */}
                                            {v.members && (
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#1a5e6e' }}>{ta('اسماء وتواقيع الحاضرين', 'Attendees Names and Signatures')}</div>
                                                        <div style={{ flex: 1, height: '1px', background: '#3ab5b0' }} />
                                                    </div>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                                        <thead>
                                                            <tr style={{ background: '#1e3a4a', color: 'white' }}>
                                                                <td style={{ padding: '5px 8px', textAlign: 'center', width: '30px', border: '1px solid #ccc' }}>م</td>
                                                                <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #ccc' }}>{ta('الاسم', 'Name')}</td>
                                                                <td style={{ padding: '5px 8px', textAlign: 'center', width: '80px', border: '1px solid #ccc' }}>{ta('التوقيع', 'Signature')}</td>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {v.members.split('\n').filter(l => l.trim()).map((name, i) => (
                                                                <tr key={i} style={{ background: i % 2 === 1 ? '#f0faf8' : 'white' }}>
                                                                    <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #ddd' }}>{i + 1}</td>
                                                                    <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #ddd' }}>{name}</td>
                                                                    <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {/* التوقيعات */}
                                            {(v.right_sig || v.left_sig) && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 16px', marginTop: '4px' }}>
                                                    {[v.right_sig, v.left_sig].map((sig, i) => sig ? (
                                                        <div key={i} style={{ textAlign: 'center', fontSize: '11px' }}>
                                                            {sig.split('\n').map((l, j) => <div key={j} style={{ lineHeight: '1.7' }}>{l}</div>)}
                                                        </div>
                                                    ) : <div key={i} />)}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', color: 'white', textAlign: 'center', padding: '7px', fontSize: '10px', fontWeight: 'bold' }}>
                                            {ta('SERS - سوق السجلات التعليمية الذكية', 'SERS - Smart Educational Records Marketplace')}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={`bg-gradient-to-l ${form.gradient} p-5 text-white`}>
                                            <p className="text-xs opacity-80 mb-1">{ta('وزارة التعليم — التفاعل مع المجتمع المهني', 'Ministry of Education — Professional Community Interaction')}</p>
                                            <h2 className="text-base font-black">{form.title}</h2>
                                            {(v.edu_school || v.school) && <p className="text-xs opacity-90 mt-1 whitespace-pre-line">{v.edu_school || v.school}</p>}
                                        </div>
                                        <div className="p-5 space-y-1.5 text-xs">
                                            {nonImageFields.filter(f => !['edu_school','school'].includes(f.key)).map(f =>
                                                v[f.key] ? (
                                                    <div key={f.key} className="flex gap-2 border-b border-gray-100 pb-1">
                                                        <span className="font-bold text-gray-600 min-w-[110px] shrink-0">{f.label}:</span>
                                                        <span className="text-gray-800 whitespace-pre-wrap">{v[f.key]}</span>
                                                    </div>
                                                ) : null
                                            )}
                                            {imageFields.some(f => images[f.key]) && (
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {imageFields.map(f => images[f.key] ? (
                                                        <img key={f.key} src={images[f.key]} alt={f.label} className="w-full h-24 object-cover rounded-lg border" />
                                                    ) : null)}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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

export default function ProfessionalCommunityPage() {
    const { dir } = useTranslation();
    const { forms: dynamicForms } = useFirestoreForms('professional-community', FORMS);
    const [selected, setSelected] = useState<FormDef | null>(null);
    if (selected) return <FormFill form={selected} onBack={() => setSelected(null)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-teal-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-teal-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <Users className="w-4 h-4 text-teal-400" /> {ta('التفاعل مع المجتمع المهني', 'Professional Community Interaction')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('التفاعل مع المجتمع المهني', 'Professional Community Interaction')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('جميع ما يخص عنصر التفاعل مع المجتمع المهني من نماذج وتقارير وتوثيق', 'Everything related to the professional community interaction element: forms, reports, and documentation')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{dynamicForms.length} {ta('نماذج', 'forms')}</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dynamicForms.map(form => (
                            <Card key={form.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setSelected(form)}>
                                <div className={`h-2 bg-gradient-to-l ${form.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${form.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Users className="w-6 h-6" />
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
