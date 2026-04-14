'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Eye, Download, RotateCcw, ChevronRight, BookOpen, Layers } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const SUBJECTS = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'التربية الإسلامية', 'الاجتماعيات', 'الحاسب', 'التربية البدنية', 'الفنون', 'أخرى'];

// ===== Single Subject Plan =====
function SingleSubjectPlan({ onBack, preWeek, preSemester, preRange }: { onBack: () => void; preWeek?: string; preSemester?: string; preRange?: string; }) {
  const { dir } = useTranslation();
    const [v, setV] = useState<Record<string, string>>({
        edu_school: '', teacher: '', subject: '', grade_class: '',
        week_num: preWeek || 'الأول', semester: preSemester || 'الثاني',
        week_range: preRange || 'من ١٤٤٧/٠٧/٢٩هـ إلى ١٤٤٧/٠٨/٠٣هـ',
        week_from: '١٤٤٧/٠٧/٢٩', week_to: '١٤٤٧/٠٨/٠٣',
        acquired_skills: '', learning_resources: '', notes: '',
        sun_topic: '', sun_title: '', sun_objectives: '', sun_repeat: '', sun_homework: '',
        mon_topic: '', mon_title: '', mon_objectives: '', mon_repeat: '', mon_homework: '',
        tue_topic: '', tue_title: '', tue_objectives: '', tue_repeat: '', tue_homework: '',
        wed_topic: '', wed_title: '', wed_objectives: '', wed_repeat: '', wed_homework: '',
        thu_topic: '', thu_title: '', thu_objectives: '', thu_repeat: '', thu_homework: '',
    });
    const [dayEnabled, setDayEnabled] = useState({ sun: true, mon: true, tue: true, wed: true, thu: true });
    const set = (k: string, val: string) => setV(p => ({ ...p, [k]: val }));
    const toggleDay = (d: string) => setDayEnabled(p => ({ ...p, [d]: !p[d as keyof typeof p] }));

    const dayDates: Record<string, string> = {
        sun: '١٤٤٧/٠٧/٢٩هـ', mon: '١٤٤٧/٠٧/٣٠هـ',
        tue: '١٤٤٧/٠٨/٠١هـ', wed: '١٤٤٧/٠٨/٠٢هـ', thu: '١٤٤٧/٠٨/٠٣هـ',
    };
    const dayLabels: Record<string, string> = {
        sun: 'الأحد', mon: 'الاثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس',
    };
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu'];

    const hasData = Object.values(v).some(x => x);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة للخطة الأسبوعية', 'Back to Weekly Plan')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-l from-amber-600 to-orange-600 text-white rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><CalendarDays className="w-5 h-5" /></div>
                                <div>
                                    <CardTitle className="text-base">{ta('خطة أسبوعية لمادة واحدة', 'Single-Subject Weekly Plan')}</CardTitle>
                                    <CardDescription className="text-white/80 text-xs mt-0.5">{ta('إنشاء الخطة الأسبوعية لمادة واحدة', 'Create Single-Subject Weekly Plan')}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">

                            {/* عنوان الخطة */}
                            <div className="text-center py-4 space-y-1">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{ta('إنشاء الخطة الأسبوعية', 'Create Weekly Plan')}</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">للأسبوع {v.week_num}</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">من {v.week_from}هـ إلى {v.week_to}هـ</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">الفصل الدراسي {v.semester}</p>
                                <p className="text-sm text-teal-600 font-bold">{ta('( التقويم العام )', '(Gregorian Calendar)')}</p>
                                <p className="text-[10px] text-gray-400">{ta('قم بتعبئة خانات النموذج بالأسفل، بعض خانات النموذج تمت تعبئتها تلقائياً أكمل أو عدل حسب احتياجك', 'Fill in the form fields below. Some fields have been auto-filled. Complete or edit as needed.')}</p>
                            </div>

                            {/* Row 1: الفصل + الأسبوع + التاريخ من إلى */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('الفصل الدراسي:', 'Semester:')}</label>
                                    <Input placeholder={ta('الثاني', 'Second')} value={v.semester} onChange={e => set('semester', e.target.value)} className="text-sm text-start" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('الأسبوع:', 'Week:')}</label>
                                    <Input placeholder={ta('الأول', 'First')} value={v.week_num} onChange={e => set('week_num', e.target.value)} className="text-sm text-start" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('التاريخ من إلى:', 'Date From To:')}</label>
                                    <Input placeholder={ta('من ١٤٤٧/٠٧/٢٩هـ إلى ١٤٤٧/٠٨/٠٣هـ', 'From 29/07/1447H to 03/08/1447H')} value={v.week_range} onChange={e => set('week_range', e.target.value)} className="text-sm text-start" />
                                </div>
                            </div>

                            {/* إدارة التعليم */}
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label>
                                <Textarea rows={3} placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} value={v.edu_school} onChange={e => set('edu_school', e.target.value)} className="resize-y text-sm text-start" />
                            </div>

                            {/* اسم المعلم + اسم المادة + الصف/الفصل */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('اسم المعلم:', 'Teacher Name:')}</label>
                                    <Input placeholder={ta('اسم المعلم', 'Teacher Name')} value={v.teacher} onChange={e => set('teacher', e.target.value)} className="text-sm text-start" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('اسم المادة:', 'Subject Name:')}</label>
                                    <Input placeholder={ta('اسم المادة', 'Subject Name')} value={v.subject} onChange={e => set('subject', e.target.value)} className="text-sm text-start" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('الصف / الفصل:', 'Grade / Class:')}</label>
                                    <Input placeholder={ta('الصف / الفصل', 'Grade / Section')} value={v.grade_class} onChange={e => set('grade_class', e.target.value)} className="text-sm text-start" />
                                </div>
                            </div>

                            {/* المهارات المكتسبة + مصادر التعلم */}
                            <div className="grid grid-cols-2 gap-2 items-start">
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start min-h-[32px]">{ta('المهارات المكتسبة (قم بتغيير الحقل الموجود حسب مايناسبك):', 'Acquired Skills (change as needed):')}</label>
                                    <Textarea rows={5} placeholder={ta('التعلم\nالتفكير\nالتواصل\nحل المشكلات', 'التعلم\\nالتفكير\\nالتواصل\\nحل المشكلات')} value={v.acquired_skills} onChange={e => set('acquired_skills', e.target.value)} className="resize-y text-sm text-start" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start min-h-[32px]">{ta('مصادر التعلم (قم بتغيير الحقل الموجود حسب مايناسبك):', 'Learning Resources (change as needed):')}</label>
                                    <Textarea rows={5} placeholder={ta('الكتاب\nأوراق عمل\nمنصة عين', 'الكتاب\\nأوراق عمل\\nمنصة عين')} value={v.learning_resources} onChange={e => set('learning_resources', e.target.value)} className="resize-y text-sm text-start" />
                                </div>
                            </div>

                            {/* ملاحظات */}
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('ملاحظات:', 'Notes:')}</label>
                                <Textarea rows={2} placeholder={ta('لا يوجد', 'None')} value={v.notes} onChange={e => set('notes', e.target.value)} className="resize-y text-sm text-start" />
                            </div>

                            {/* تفاصيل الأيام */}
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">{ta('تفاصيل الأيام', 'Day Details')}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {dayKeys.map(day => (
                                        <div key={day} className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden ${day === 'thu' ? 'col-span-1' : ''}`}>
                                            {/* Day header */}
                                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleDay(day)}
                                                        className={`relative w-10 h-5 rounded-full transition-colors ${dayEnabled[day as keyof typeof dayEnabled] ? 'bg-teal-500' : 'bg-gray-300'}`}
                                                    >
                                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dayEnabled[day as keyof typeof dayEnabled] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                                    </button>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dayEnabled[day as keyof typeof dayEnabled] ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {dayEnabled[day as keyof typeof dayEnabled] ? ta('مفعل', 'Enabled') : ta('معطّل', 'Disabled') }
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">{dayLabels[day]} - {dayDates[day]}</span>
                                            </div>
                                            {dayEnabled[day as keyof typeof dayEnabled] && (
                                                <div className="p-3 space-y-2">
                                                    <div>
                                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('موضوع الدرس:', 'Lesson Topic:')}</label>
                                                        <Input placeholder={ta('عنوان الدرس', 'Lesson Title')} value={v[`${day}_topic`]} onChange={e => set(`${day}_topic`, e.target.value)} className="text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('أهداف الدرس:', 'Lesson Objectives:')}</label>
                                                        <Textarea rows={3} placeholder={ta('الأهداف', 'Objectives')} value={v[`${day}_objectives`]} onChange={e => set(`${day}_objectives`, e.target.value)} className="resize-y text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('الواجب والمهام المنزلية:', 'Homework & Home Tasks:')}</label>
                                                        <Textarea rows={2} placeholder={ta('على منصة مدرستي', 'on Madrasati Platform')} value={v[`${day}_homework`]} onChange={e => set(`${day}_homework`, e.target.value)} className="resize-y text-sm" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <Button className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm">
                                        <Eye className="w-4 h-4" /> {ta('معاينة', 'Preview')}
                                    </Button>
                                    <Button onClick={() => { setV({ edu_school: '', teacher: '', subject: '', grade_class: '', week_num: 'الأول', semester: 'الثاني', week_range: 'من ١٤٤٧/٠٧/٢٩هـ إلى ١٤٤٧/٠٨/٠٣هـ', week_from: '١٤٤٧/٠٧/٢٩', week_to: '١٤٤٧/٠٨/٠٣', acquired_skills: '', learning_resources: '', notes: '', sun_topic: '', sun_title: '', sun_objectives: '', sun_repeat: '', sun_homework: '', mon_topic: '', mon_title: '', mon_objectives: '', mon_repeat: '', mon_homework: '', tue_topic: '', tue_title: '', tue_objectives: '', tue_repeat: '', tue_homework: '', wed_topic: '', wed_title: '', wed_objectives: '', wed_repeat: '', wed_homework: '', thu_topic: '', thu_title: '', thu_objectives: '', thu_repeat: '', thu_homework: '' }); setDayEnabled({ sun: true, mon: true, tue: true, wed: true, thu: true }); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm">
                                        <RotateCcw className="w-4 h-4" /> {ta('استعادة القيم الافتراضية', 'Restore Defaults')}
                                    </Button>
                                </div>
                                <Button onClick={async () => {
                                    const el = document.getElementById('weekly-plan-print-wrapper');
                                    if (!el) return;
                                    const tid = toast.loading(ta('جاري التحضير...', 'Preparing...'));
                                    const { default: html2canvas } = await import('html2canvas');
                                    const { default: jsPDF } = await import('jspdf');
                                    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                                    const imgData = canvas.toDataURL('image/png');
                                    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                                    const pdfW = pdf.internal.pageSize.getWidth();
                                    const pdfH = pdf.internal.pageSize.getHeight();
                                    const imgH = (canvas.height * pdfW) / canvas.width;
                                    const finalH = imgH > pdfH ? pdfH : imgH;
                                    const finalW = imgH > pdfH ? (canvas.width * pdfH) / canvas.height : pdfW;
                                    const x = imgH > pdfH ? (pdfW - finalW) / 2 : 0;
                                    pdf.addImage(imgData, 'PNG', x, 0, finalW, finalH);
                                    pdf.save('خطة-أسبوعية.pdf');
                                    toast.dismiss(tid);
                                    toast.success(ta('تم التحميل', 'Loaded'));
                                }} className="w-full gap-2 bg-gradient-to-l from-amber-600 to-orange-600 text-white border-0 text-sm">
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <div className="sticky top-24">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2 print:hidden"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        <div id="weekly-plan-print-wrapper" className="bg-white shadow-xl border border-gray-200 overflow-hidden" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px' }}>

                            {/* Header: العنوان (gradient) | إدارة التعليم (أخضر) | الشعار (يسار) */}
                            <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
                                <div className="text-white text-center flex flex-col items-center justify-center py-3 px-2 m-1 rounded-xl" style={{ background: 'linear-gradient(to bottom, #1a9b7a, #1a7ab5)' }}>
                                    <p className="text-[10px] leading-relaxed whitespace-pre-line">{v.edu_school || 'الإدارة العامة للتعليم\nبالمنطقة\nمدرسة'}</p>
                                </div>
                                <div className="text-white flex flex-col justify-center py-4 px-4 m-1 rounded-xl" style={{ background: 'linear-gradient(to left, #1a7ab5, #1a9b7a)' }}>
                                    <p className="font-black text-base leading-tight">الخطة الأسبوعية: الأسبوع {v.week_num || 'الأول'}</p>
                                    <p className="text-[11px] opacity-90 mt-1">الفصل {v.semester || 'الثاني'} (من {v.week_from || '١٤٤٧/٠٧/٢٩'}هـ إلى {v.week_to || '١٤٤٧/٠٨/٠٣'}هـ)</p>
                                </div>
                                <div className="flex flex-col items-center justify-center p-2 bg-white">
                                    <svg viewBox="0 0 100 90" className="w-20 h-16">
                                        {[
                                            [50, 4], [38, 7], [28, 14], [22, 24], [24, 35],
                                            [62, 7], [72, 14], [78, 24], [76, 35]
                                        ].map(([cx, cy], i) => (
                                            <circle key={i} cx={cx} cy={cy} r="3" fill="#1a9b7a"/>
                                        ))}
                                        <path d="M50 42 Q35 38 18 42 L18 72 Q35 68 50 72 Z" fill="#1a9b7a"/>
                                        <path d="M50 42 Q65 38 82 42 L82 72 Q65 68 50 72 Z" fill="#1a9b7a"/>
                                        <line x1="50" y1="42" x2="50" y2="72" stroke="white" strokeWidth="1.5"/>
                                        <line x1="24" y1="52" x2="46" y2="50" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="24" y1="58" x2="46" y2="56" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="24" y1="64" x2="46" y2="62" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="50" x2="76" y2="52" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="56" x2="76" y2="58" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="62" x2="76" y2="64" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <text x="50" y="82" textAnchor="middle" fontSize="7.5" fill="#1a9b7a" fontWeight="bold">{ta('وزارة التعـليم', 'Ministry of Education')}</text>
                                        <text x="50" y="90" textAnchor="middle" fontSize="5" fill="#666">Ministry of Education</text>
                                    </svg>
                                </div>
                            </div>

                            {/* صف: اسم المعلم | الصف | المادة | مصادر التعلم - floating labels */}
                            <div className="grid grid-cols-4 py-3 px-2 gap-3 border-b border-gray-200">
                                {[
                                    { label: ta('اسم المعلم:', 'Teacher Name:'), value: v.teacher || '' },
                                    { label: ta('الصف / الفصل:', 'Grade / Class:'), value: v.grade_class || '' },
                                    { label: ta('المـادة:', 'Subject:'), value: v.subject || '' },
                                    { label: ta('مصادر التعلم:', 'Learning Resources:'), value: v.learning_resources || 'الكتاب، أوراق عمل، منصة عين' },
                                ].map((item, i) => (
                                    <div key={i} className="relative">
                                        <p className="absolute -top-2 right-2 bg-white px-1 text-teal-600 font-bold text-[9px] z-10">— {item.label}</p>
                                        <div className="border border-teal-400 rounded px-2 pt-3 pb-1.5 text-[10px] text-gray-700 bg-white min-h-[32px]">{item.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* أيام الأسبوع - gradient */}
                            <div className="grid grid-cols-5 gap-1 px-1 pb-1">
                                {dayKeys.map((day) => (
                                    <div key={day} className="text-center py-2 text-white text-[10px] font-bold rounded-xl"
                                        style={{ background: dayEnabled[day as keyof typeof dayEnabled] ? 'linear-gradient(to left, #1a7ab5, #1a9b7a)' : '#9ca3af' }}>
                                        {dayLabels[day]} - {dayDates[day]}
                                    </div>
                                ))}
                            </div>

                            {/* موضوع الدرس */}
                            <div className="grid grid-cols-5 border-b border-gray-100">
                                {dayKeys.map((day) => (
                                    <div key={day} className="p-1.5 border-l border-gray-100 last:border-l-0">
                                        <p className="text-teal-500 text-[9px] font-bold mb-1 flex items-center justify-center gap-0.5">
                                            <span className="flex-1 border-t border-teal-200"/><span>{ta('موضوع الدرس', 'Lesson Topic')}</span><span className="flex-1 border-t border-teal-200"/>
                                        </p>
                                        <div className="border border-teal-200 rounded px-1 py-2 min-h-[36px] text-[10px] text-gray-600 bg-white text-center">
                                            {dayEnabled[day as keyof typeof dayEnabled] ? (v[`${day}_topic`] || 'عنوان الدرس') : '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* أهداف الدرس */}
                            <div className="grid grid-cols-5 border-b border-gray-100">
                                {dayKeys.map((day) => (
                                    <div key={day} className="p-1.5 border-l border-gray-100 last:border-l-0">
                                        <p className="text-teal-500 text-[9px] font-bold mb-1 flex items-center justify-center gap-0.5">
                                            <span className="flex-1 border-t border-teal-200"/><span>{ta('أهداف الدرس', 'Lesson Objectives')}</span><span className="flex-1 border-t border-teal-200"/>
                                        </p>
                                        <div className="border border-teal-200 rounded px-1 py-2 min-h-[52px] text-[10px] text-gray-600 bg-white text-center whitespace-pre-line">
                                            {dayEnabled[day as keyof typeof dayEnabled] ? (v[`${day}_objectives`] || '- الأهداف') : '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* الواجب المنزلي */}
                            <div className="grid grid-cols-5 border-b border-gray-200">
                                {dayKeys.map((day) => (
                                    <div key={day} className="p-1.5 border-l border-gray-100 last:border-l-0">
                                        <p className="text-teal-500 text-[9px] font-bold mb-1 flex items-center justify-center gap-0.5">
                                            <span className="flex-1 border-t border-teal-200"/><span>{ta('الواجب المنزلي', 'Homework')}</span><span className="flex-1 border-t border-teal-200"/>
                                        </p>
                                        <div className="border border-teal-200 rounded px-1 py-2 min-h-[36px] text-[10px] text-gray-600 bg-white text-center">
                                            {dayEnabled[day as keyof typeof dayEnabled] ? (v[`${day}_homework`] || 'على منصة مدرستي') : '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer: المهارات (يمين) | ملاحظات (وسط) | QR (يسار) */}
                            <div className="grid" style={{ gridTemplateColumns: '2fr 2fr 1fr' }}>
                                <div className="p-2 border-l border-gray-200">
                                    <p className="text-teal-600 font-bold text-[10px] mb-1">{ta('المهارات المكتسبة:', 'Acquired Skills:')}</p>
                                    <div className="border border-teal-200 rounded px-2 py-1 min-h-[44px] text-[10px] text-gray-600 bg-white whitespace-pre-line">
                                        {v.acquired_skills || 'التعلم، التفكير، التواصل، حل المشكلات'}
                                    </div>
                                </div>
                                <div className="p-2 border-l border-gray-200">
                                    <p className="text-teal-600 font-bold text-[10px] mb-1 flex items-center gap-0.5">
                                        <span className="flex-1 border-t border-teal-200"/><span>{ta('ملاحظـات:', 'Notes:')}</span><span className="flex-1 border-t border-teal-200"/>
                                    </p>
                                    <div className="border border-teal-200 rounded px-2 py-1 min-h-[44px] text-[10px] text-gray-600 bg-white text-center">
                                        {v.notes || 'لا يوجد'}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center p-2 gap-1">
                                    <QRCodeSVG value="https://sers.edu" size={44} fgColor="#1a9b7a" />
                                    <p className="text-[7px] text-gray-500 text-center leading-tight">{ta('منصة SERS', 'SERS Platform')}<br/>sers.edu</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #weekly-plan-print-wrapper, #weekly-plan-print-wrapper * { visibility: visible; }
                    #weekly-plan-print-wrapper { position: fixed; top: 0; left: 0; width: 100%; }
                }
            `}</style>
        </div>
    );
}

// ===== Multi Subject Plan Form =====
function MultiSubjectPlanForm({ week, onBack }: { week: typeof WEEKS_DATA[0]; onBack: () => void }) {
  const { dir } = useTranslation();
    const [activeDay, setActiveDay] = useState(0);
    const [v, setV] = useState<Record<string, string>>({
        edu_school: '', grade_class: '', notes: 'عزيزي ولي الأمر أنت شريك في نجاح العملية التعليمية وتحقيق الانضباط المدرسي، مكن عوناً لنا',
        plan_teacher: '', school_leader: 'قائد المدرسة', leader_name: '',
        semester: 'الثاني', week_num: week.num,
        week_range: `من ${week.hijri_from}هـ إلى ${week.hijri_to}هـ`,
    });
    const set = (k: string, val: string) => setV(p => ({ ...p, [k]: val }));

    // حصص كل يوم: 7 حصص، كل حصة: اسم المادة + تحرير + ملاحظات/واجب
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu'];
    const dayLabels: Record<string, string> = { sun: 'الأحد', mon: 'الاثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: ta('الخميس', 'Thursday') };
    const dayDates = [week.hijri_from, '', '', '', week.hijri_to];
    const [periods, setPeriods] = useState<Record<string, { subject: string; notes: string; homework: string }[]>>(
        Object.fromEntries(dayKeys.map(d => [d, Array(7).fill(null).map(() => ({ subject: '', notes: '', homework: '' }))]))
    );
    const setPeriod = (day: string, idx: number, field: string, val: string) => {
        setPeriods(p => ({ ...p, [day]: p[day].map((item, i) => i === idx ? { ...item, [field]: val } : item) }));
    };

    const hasData = Object.values(v).some(x => x) || dayKeys.some(d => periods[d].some(p => p.subject || p.notes || p.homework));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة', 'Go Back')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-l from-amber-600 to-orange-600 text-white rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Layers className="w-5 h-5" /></div>
                                <div>
                                    <CardTitle className="text-sm">{ta('خطة أسبوعية لأكثر من مادة', 'Multi-Subject Weekly Plan')}</CardTitle>
                                    <CardDescription className="text-white/80 text-xs mt-0.5">الأسبوع {week.num}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {/* عنوان */}
                            <div className="text-center py-3 space-y-1">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{ta('إنشاء الخطة الأسبوعية لأكثر من مادة', 'Create Multi-Subject Weekly Plan')}</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">للأسبوع {week.num}</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">من {week.hijri_from}هـ إلى {week.hijri_to}هـ</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{ta('الفصل الدراسي الثاني', 'Second Academic Semester')}</p>
                                <p className="text-sm text-teal-600 font-bold">{ta('( التقويم العام )', '(Gregorian Calendar)')}</p>
                                <p className="text-[10px] text-gray-400">{ta('قم بتعبئة خانات النموذج بالأسفل، يمكنك إضافة عدة مواد وتخصيص أيام مطلوبة لكل مادة، بعض خانات النموذج تمت تعبئتها تلقائياً أكمل أو عدل حسب احتياجك', 'Fill in the form fields below. You can add multiple subjects and customize days for each.')}</p>
                            </div>

                            {/* الفصل + الأسبوع + التاريخ */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('الفصل الدراسي:', 'Semester:')}</label>
                                    <Input value={v.semester} onChange={e => set('semester', e.target.value)} className="text-sm text-start" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('الأسبوع:', 'Week:')}</label>
                                    <Input value={v.week_num} onChange={e => set('week_num', e.target.value)} className="text-sm text-start" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('التاريخ من إلى:', 'Date From To:')}</label>
                                    <Input value={v.week_range} onChange={e => set('week_range', e.target.value)} className="text-sm text-start" />
                                </div>
                            </div>

                            {/* إدارة التعليم */}
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label>
                                <Textarea rows={3} placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} value={v.edu_school} onChange={e => set('edu_school', e.target.value)} className="resize-y text-sm text-start" />
                            </div>

                            {/* الصف / الفصل */}
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('الصف / الفصل:', 'Grade / Class:')}</label>
                                <Input placeholder={ta('الصف / الفصل', 'Grade / Section')} value={v.grade_class} onChange={e => set('grade_class', e.target.value)} className="text-sm text-start" />
                            </div>

                            {/* ملاحظات */}
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('ملاحظات:', 'Notes:')}</label>
                                <Textarea rows={2} value={v.notes} onChange={e => set('notes', e.target.value)} className="resize-y text-sm text-start" />
                            </div>

                            {/* اسم معتمد الخطة */}
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 text-start">{ta('اسم معتمد الخطة:', 'Plan Approver Name:')}</label>
                                <Textarea rows={2} placeholder={ta('قائد المدرسة\nاسم القائد', 'قائد المدرسة\\nاسم القائد')} value={v.plan_teacher} onChange={e => set('plan_teacher', e.target.value)} className="resize-y text-sm text-start" />
                            </div>

                            {/* المواد الدراسية لأيام الأسبوع */}
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 text-start">{ta('المواد الدراسية لأيام الأسبوع', 'Subjects for Week Days')}</p>

                                {/* Tabs الأيام */}
                                <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                    {DAYS.map((day, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveDay(i)}
                                            className={`flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium ${activeDay === i ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>

                                {/* تاريخ اليوم */}
                                <p className="text-xs text-gray-400 text-start mb-3">حصص يوم {DAYS[activeDay]} ({activeDay === 0 ? week.hijri_from : activeDay === 4 ? week.hijri_to : ''}هـ)</p>

                                {/* الحصص - 6 في grid ثم الحصة 7 منفردة يمين */}
                                <div className="grid grid-cols-3 gap-3">
                                    {periods[dayKeys[activeDay]].slice(0, 6).map((period, idx) => (
                                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                                            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 text-start">الحصة رقم {idx + 1}:</p>
                                            <Input
                                                placeholder={ta('اسم المادة', 'Subject Name')}
                                                value={period.subject}
                                                onChange={e => setPeriod(dayKeys[activeDay], idx, 'subject', e.target.value)}
                                                className="text-xs text-start h-8"
                                            />
                                            <p className="text-[10px] text-gray-400 text-start">{ta('اسم المادة ضع كلمة واحدة فقط', 'Subject name (one word only)')}</p>
                                            <Textarea
                                                rows={2}
                                                placeholder={ta('الدرس', 'Lesson')}
                                                value={period.notes}
                                                onChange={e => setPeriod(dayKeys[activeDay], idx, 'notes', e.target.value)}
                                                className="resize-y text-xs text-start"
                                            />
                                            <Textarea
                                                rows={2}
                                                placeholder={ta('ملاحظات / واجب', 'Notes / Homework')}
                                                value={period.homework}
                                                onChange={e => setPeriod(dayKeys[activeDay], idx, 'homework', e.target.value)}
                                                className="resize-y text-xs text-start"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {/* الحصة 7 منفردة يمين */}
                                <div className="flex justify-start mt-3">
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2 w-1/3">
                                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 text-start">{ta('الحصة رقم 7:', 'Period No. 7:')}</p>
                                        <Input
                                            placeholder={ta('اسم المادة', 'Subject Name')}
                                            value={periods[dayKeys[activeDay]][6].subject}
                                            onChange={e => setPeriod(dayKeys[activeDay], 6, 'subject', e.target.value)}
                                            className="text-xs text-start h-8"
                                        />
                                        <p className="text-[10px] text-gray-400 text-start">{ta('اسم المادة ضع كلمة واحدة فقط', 'Subject name (one word only)')}</p>
                                        <Textarea
                                            rows={2}
                                            placeholder={ta('الدرس', 'Lesson')}
                                            value={periods[dayKeys[activeDay]][6].notes}
                                            onChange={e => setPeriod(dayKeys[activeDay], 6, 'notes', e.target.value)}
                                            className="resize-y text-xs text-start"
                                        />
                                        <Textarea
                                            rows={2}
                                            placeholder={ta('ملاحظات / واجب', 'Notes / Homework')}
                                            value={periods[dayKeys[activeDay]][6].homework}
                                            onChange={e => setPeriod(dayKeys[activeDay], 6, 'homework', e.target.value)}
                                            className="resize-y text-xs text-start"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <Button className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm">
                                        <Eye className="w-4 h-4" /> {ta('معاينة', 'Preview')}
                                    </Button>
                                    <Button onClick={() => { setV({ edu_school: '', grade_class: '', notes: 'عزيزي ولي الأمر أنت شريك في نجاح العملية التعليمية وتحقيق الانضباط المدرسي، مكن عوناً لنا', plan_teacher: '', school_leader: 'قائد المدرسة', leader_name: '', semester: 'الثاني', week_num: week.num, week_range: `من ${week.hijri_from}هـ إلى ${week.hijri_to}هـ` }); setPeriods(Object.fromEntries(dayKeys.map(d => [d, Array(7).fill(null).map(() => ({ subject: '', notes: '', homework: '' }))]))); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm">
                                        <RotateCcw className="w-4 h-4" /> {ta('استعادة القيم الافتراضية', 'Restore Defaults')}
                                    </Button>
                                </div>
                                <Button onClick={async () => {
                                    const el = document.getElementById('multi-plan-print-wrapper');
                                    if (!el) return;
                                    const tid = toast.loading(ta('جاري التحضير...', 'Preparing...'));
                                    const { default: html2canvas } = await import('html2canvas');
                                    const { default: jsPDF } = await import('jspdf');
                                    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                                    const imgData = canvas.toDataURL('image/png');
                                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                                    const pdfW = pdf.internal.pageSize.getWidth();
                                    const pdfH = pdf.internal.pageSize.getHeight();
                                    const imgW = pdfW;
                                    const imgH = (canvas.height * pdfW) / canvas.width;
                                    // تصغير ليناسب صفحة واحدة
                                    const finalH = imgH > pdfH ? pdfH : imgH;
                                    const finalW = imgH > pdfH ? (canvas.width * pdfH) / canvas.height : pdfW;
                                    const x = imgH > pdfH ? (pdfW - finalW) / 2 : 0;
                                    pdf.addImage(imgData, 'PNG', x, 0, finalW, finalH);
                                    pdf.save('خطة-أسبوعية-متعددة.pdf');
                                    toast.dismiss(tid);
                                    toast.success(ta('تم التحميل', 'Loaded'));
                                }} className="w-full gap-2 bg-gradient-to-l from-amber-600 to-orange-600 text-white border-0 text-sm">
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <div className="sticky top-24">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        <div id="multi-plan-print-wrapper" className="bg-white border-2 border-gray-800 overflow-hidden shadow-xl" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '10px' }}>

                            {/* Header */}
                            <div className="grid border-b-2 border-gray-700" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                {/* إدارة التعليم - يمين */}
                                <div className="text-white text-center flex flex-col items-center justify-center py-3 px-2" style={{ background: 'linear-gradient(to bottom, #1a9b7a, #1a7ab5)' }}>
                                    <p className="text-[10px] leading-relaxed whitespace-pre-line">{v.edu_school || 'الإدارة العامة للتعليم\nبالمنطقة\nمدرسة'}</p>
                                </div>
                                {/* شعار وزارة التعليم - وسط */}
                                <div className="flex flex-col items-center justify-center p-2 bg-white border-l border-r border-gray-300">
                                    <svg viewBox="0 0 100 90" className="w-16 h-14">
                                        {[[50,4],[38,7],[28,14],[22,24],[24,35],[62,7],[72,14],[78,24],[76,35]].map(([cx,cy],i)=>(
                                            <circle key={i} cx={cx} cy={cy} r="3" fill="#1a9b7a"/>
                                        ))}
                                        <path d="M50 42 Q35 38 18 42 L18 72 Q35 68 50 72 Z" fill="#1a9b7a"/>
                                        <path d="M50 42 Q65 38 82 42 L82 72 Q65 68 50 72 Z" fill="#1a9b7a"/>
                                        <line x1="50" y1="42" x2="50" y2="72" stroke="white" strokeWidth="1.5"/>
                                        <line x1="24" y1="52" x2="46" y2="50" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="24" y1="58" x2="46" y2="56" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="50" x2="76" y2="52" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <line x1="54" y1="56" x2="76" y2="58" stroke="white" strokeWidth="1" opacity="0.7"/>
                                        <text x="50" y="82" textAnchor="middle" fontSize="7" fill="#1a9b7a" fontWeight="bold">{ta('وزارة التعـليم', 'Ministry of Education')}</text>
                                        <text x="50" y="90" textAnchor="middle" fontSize="5" fill="#666">Ministry of Education</text>
                                    </svg>
                                </div>
                                {/* الفصل والأسبوع - يسار */}
                                <div className="text-white text-center flex flex-col items-center justify-center py-3 px-2" style={{ background: 'linear-gradient(to bottom, #1a9b7a, #1a7ab5)' }}>
                                    <p className="font-bold text-[11px]">الفصل الدراسي {v.semester || 'الثاني'}</p>
                                    <p className="font-bold text-[11px]">الأسبوع {v.week_num || 'الأول'}</p>
                                    <p className="text-[9px] mt-1">من {week.hijri_from}هـ</p>
                                    <p className="text-[9px]">إلى {week.hijri_to}هـ</p>
                                </div>
                            </div>

                            {/* عنوان الجدول */}
                            <div className="text-white text-center py-2 font-bold text-[12px]" style={{ background: '#2d3748' }}>
                                الخطة الدراسية الأسبوعية - الصف / الفصل {v.grade_class ? `: ${v.grade_class}` : ''}
                            </div>

                            {/* رؤوس الأعمدة */}
                            <div className="grid text-white text-center text-[10px] font-bold" style={{ gridTemplateColumns: '60px 50px 1fr 2fr 2fr', background: '#1a9b7a' }}>
                                <div className="py-2 border-l border-white/30">{ta('اليوم', 'Today')}</div>
                                <div className="py-2 border-l border-white/30">{ta('حصة', 'Period')}</div>
                                <div className="py-2 border-l border-white/30">{ta('المادة', 'Subject')}</div>
                                <div className="py-2 border-l border-white/30">{ta('موضوع الدرس', 'Lesson Topic')}</div>
                                <div className="py-2">{ta('ملاحظات / الواجب', 'Notes / Homework')}</div>
                            </div>

                            {/* صفوف الأيام والحصص */}
                            {dayKeys.map((day, di) => {
                                const dayPeriods = periods[day];
                                return (
                                    <div key={day} className="grid border-t border-gray-200" style={{ gridTemplateColumns: '60px 1fr' }}>
                                        {/* اسم اليوم */}
                                        <div className="flex items-center justify-center text-white text-[10px] font-bold border-l border-gray-200 text-center px-1"
                                            style={{ background: 'linear-gradient(to bottom, #1a9b7a, #1a7ab5)' }}>
                                            {dayLabels[day]}
                                        </div>
                                        {/* الحصص */}
                                        <div>
                                            {dayPeriods.map((period, idx) => (
                                                <div key={idx} className="grid border-b border-gray-100 last:border-b-0" style={{ gridTemplateColumns: '50px 1fr 2fr 2fr', height: '24px' }}>
                                                    <div className="flex items-center justify-center text-[9px] font-bold text-gray-600 border-l border-gray-200">{idx + 1}</div>
                                                    <div className="flex items-center px-1 text-[9px] text-gray-700 border-l border-gray-200 truncate">{period.subject}</div>
                                                    <div className="flex items-center px-1 text-[9px] text-gray-600 border-l border-gray-200 truncate">{period.notes}</div>
                                                    <div className="flex items-center px-1 text-[9px] text-gray-600 truncate">{period.homework}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Footer */}
                            <div className="border-t-2 border-gray-300 p-2">
                                <p className="text-teal-700 font-bold text-[10px] mb-1">{ta('ملاحظات:', 'Notes:')}</p>
                                <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="border border-teal-300 rounded p-2 text-[9px] text-gray-600 min-h-[36px]">
                                        {v.notes || 'عزيزي ولي الأمر: أنت شريك في نجاح العملية التعليمية وتحقيق الانضباط المدرسي، فكن عوناً لنا.'}
                                    </div>
                                    <div className="border border-teal-300 rounded p-2 text-[9px] text-gray-600 min-h-[36px] text-center">
                                        <p className="font-bold">{v.plan_teacher || 'قائد المدرسة'}</p>
                                        <p>{v.leader_name || 'اسم القائد'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom bar */}
                            <div className="text-white text-center py-1.5 text-[9px]" style={{ background: '#2d3748' }}>
                                {ta('منصة SERS - sers.edu', 'SERS Platform - sers.edu')}
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <style>{`@media print { nav, footer, button { display: none !important; } }`}</style>
        </div>
    );
}


const WEEKS_DATA = [
    { num: 'الأول',        hijri_from: '١٤٤٧/٠٧/٢٩', hijri_to: '١٤٤٧/٠٨/٠٣', greg_from: '١٤٤٧/٠٧/٢٩', greg_to: ta('١٤٤٧/٠٨/٠٥', '05/08/1447H') },
    { num: 'الثاني',       hijri_from: '١٤٤٧/٠٨/٠٦', hijri_to: '١٤٤٧/٠٨/١٠', greg_from: '١٤٤٧/٠٨/٠٦', greg_to: ta('١٤٤٧/٠٨/١٢', '12/08/1447H') },
    { num: 'الثالث',       hijri_from: '١٤٤٧/٠٨/١٣', hijri_to: '١٤٤٧/٠٨/١٧', greg_from: '١٤٤٧/٠٨/١٣', greg_to: ta('١٤٤٧/٠٨/١٩', '19/08/1447H') },
    { num: 'الرابع',       hijri_from: '١٤٤٧/٠٨/٢٠', hijri_to: '١٤٤٧/٠٨/٢٤', greg_from: '١٤٤٧/٠٨/٢٠', greg_to: ta('١٤٤٧/٠٨/٢٦', '26/08/1447H') },
    { num: 'الخامس',       hijri_from: '١٤٤٧/٠٨/٢٧', hijri_to: '١٤٤٧/٠٩/٠٢', greg_from: '١٤٤٧/٠٨/٢٧', greg_to: ta('١٤٤٧/٠٩/٠٢', '02/09/1447H') },
    { num: 'السادس',       hijri_from: '١٤٤٧/٠٩/٠٥', hijri_to: '١٤٤٧/٠٩/٠٩', greg_from: '١٤٤٧/٠٩/٠٥', greg_to: ta('١٤٤٧/٠٩/٠٩', '09/09/1447H') },
    { num: 'السابع',       hijri_from: '١٤٤٧/٠٩/١٢', hijri_to: '١٤٤٧/٠٩/١٦', greg_from: '١٤٤٧/٠٩/١٢', greg_to: ta('١٤٤٧/٠٩/١٦', '16/09/1447H') },
    { num: 'الثامن',       hijri_from: '١٤٤٧/١٠/١٠', hijri_to: '١٤٤٧/١٠/١٤', greg_from: '١٤٤٧/١٠/١٠', greg_to: ta('١٤٤٧/١٠/١٤', '14/10/1447H') },
    { num: 'التاسع',       hijri_from: '١٤٤٧/١٠/١٧', hijri_to: '١٤٤٧/١٠/٢١', greg_from: '١٤٤٧/١٠/١٧', greg_to: ta('١٤٤٧/١٠/٢١', '21/10/1447H') },
    { num: 'العاشر',       hijri_from: '١٤٤٧/١٠/٢٤', hijri_to: '١٤٤٧/١٠/٢٨', greg_from: '١٤٤٧/١٠/٢٤', greg_to: ta('١٤٤٧/١٠/٢٨', '28/10/1447H') },
    { num: 'الحادي عشر',  hijri_from: '١٤٤٧/١١/٠٢', hijri_to: '١٤٤٧/١١/٠٦', greg_from: '١٤٤٧/١١/٠٢', greg_to: ta('١٤٤٧/١١/٠٦', '06/11/1447H') },
    { num: 'الثاني عشر',  hijri_from: '١٤٤٧/١١/٠٩', hijri_to: '١٤٤٧/١١/١٣', greg_from: '١٤٤٧/١١/٠٩', greg_to: ta('١٤٤٧/١١/١٣', '13/11/1447H') },
    { num: 'الثالث عشر',  hijri_from: '١٤٤٧/١١/١٦', hijri_to: '١٤٤٧/١١/٢٠', greg_from: '١٤٤٧/١١/١٦', greg_to: ta('١٤٤٧/١١/٢٠', '20/11/1447H') },
    { num: 'الرابع عشر',  hijri_from: '١٤٤٧/١١/٢٣', hijri_to: '١٤٤٧/١١/٢٧', greg_from: '١٤٤٧/١١/٢٣', greg_to: ta('١٤٤٧/١١/٢٧', '27/11/1447H') },
    { num: 'الخامس عشر',  hijri_from: '١٤٤٧/١١/٣٠', hijri_to: '١٤٤٧/١٢/٠٤', greg_from: '١٤٤٧/١١/٣٠', greg_to: ta('١٤٤٧/١٢/٠٤', '04/12/1447H') },
    { num: 'السادس عشر',  hijri_from: '١٤٤٧/١٢/١٢', hijri_to: '١٤٤٧/١٢/١٦', greg_from: '١٤٤٧/١٢/١٢', greg_to: ta('١٤٤٧/١٢/١٦', '16/12/1447H') },
    { num: 'السابع عشر',  hijri_from: '١٤٤٧/١٢/٢١', hijri_to: '١٤٤٧/١٢/٢٥', greg_from: '١٤٤٧/١٢/٢١', greg_to: ta('١٤٤٧/١٢/٢٥', '25/12/1447H') },
    { num: 'الثامن عشر',  hijri_from: '١٤٤٨/٠١/٠٦', hijri_to: '١٤٤٨/٠١/١٠', greg_from: '١٤٤٨/٠١/٠٦', greg_to: ta('١٤٤٨/٠١/١٠', '10/01/1448H') },
    { num: 'التاسع عشر',  hijri_from: '١٤٤٨/٠١/١٣', hijri_to: '١٤٤٨/٠١/١٧', greg_from: '١٤٤٨/٠١/١٣', greg_to: ta('١٤٤٨/٠١/١٧', '17/01/1448H') },
];

function SingleSubjectWeekSelector({ onBack, onSelectWeek }: { onBack: () => void; onSelectWeek: (week: typeof WEEKS_DATA[0]) => void }) {
  const { dir } = useTranslation();
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة للخطة الأسبوعية', 'Back to Weekly Plan')}
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white mb-2">{ta('خطة أسبوعية لمادة واحدة', 'Single-Subject Weekly Plan')}</h1>
                    <p className="text-sm text-gray-500 mb-6">{ta('إنشاء الخطة الأسبوعية لمادة واحدة حسب بيانات النموذج بالأسفل، الخانات الأولى من النموذج تمت تعبئتها تلقائياً حسب اختيارك', 'Create single-subject weekly plan based on form data below. First fields are auto-filled.')}</p>
                    <div className="inline-block bg-gradient-to-l from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl text-lg font-bold mb-2">
                        {ta('الفصل الدراسي الثاني (19 أسبوع)', 'Second Semester (19 weeks)')}
                    </div>
                    <p className="text-sm text-gray-500">{ta('اختر أسبوع لإنشاء خطة', 'Select a week to create a plan')}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {WEEKS_DATA.map((week, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 text-center mb-3">الأسبوع {week.num}</p>
                            <Button
                                onClick={() => onSelectWeek(week)}
                                className="w-full bg-gradient-to-l from-amber-600 to-orange-600 hover:opacity-90 text-white text-xs mb-1 h-8"
                            >
                                {ta('إنشاء الخطة', 'Create Plan')}
                            </Button>
                            <p className="text-[10px] text-gray-400 text-center mb-2">من {week.hijri_from}هـ إلى {week.hijri_to}هـ</p>
                            <Button
                                onClick={() => onSelectWeek(week)}
                                variant="outline"
                                className="w-full text-teal-600 border-teal-300 hover:bg-teal-50 text-xs h-8"
                            >
                                {ta('إنشاء الخطة (الغربية)', 'Create Plan (Gregorian)')}
                            </Button>
                            <p className="text-[10px] text-gray-400 text-center mt-1">من {week.greg_from}هـ إلى {week.greg_to}هـ</p>
                        </div>
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
}

function MultiSubjectPlan({ onBack }: { onBack: () => void }) {
  const { dir } = useTranslation();
    const [selectedWeek, setSelectedWeek] = useState<typeof WEEKS_DATA[0] | null>(null);

    if (selectedWeek) {
        return <MultiSubjectPlanForm week={selectedWeek} onBack={() => setSelectedWeek(null)} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة للخطة الأسبوعية', 'Back to Weekly Plan')}
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white mb-2">{ta('خطة أسبوعية لأكثر من مادة', 'Multi-Subject Weekly Plan')}</h1>
                    <p className="text-sm text-gray-500 mb-6">{ta('إنشاء الخطة الأسبوعية لأكثر من مادة أو لتجميل كامل حسب بيانات النموذج بالأسفل، الخانات الأولى من النموذج تمت تعبئتها تلقائياً حسب اختيارك', 'Create multi-subject weekly plan based on form data below. First fields are auto-filled.')}</p>
                    <div className="inline-block bg-gradient-to-l from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl text-lg font-bold mb-2">
                        {ta('الفصل الدراسي الثاني (19 أسبوع)', 'Second Semester (19 weeks)')}
                    </div>
                    <p className="text-sm text-gray-500">{ta('اختر أسبوع لإنشاء خطة', 'Select a week to create a plan')}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {WEEKS_DATA.map((week, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 text-center mb-3">الأسبوع {week.num}</p>
                            <Button
                                onClick={() => setSelectedWeek(week)}
                                className="w-full bg-gradient-to-l from-amber-600 to-orange-600 hover:opacity-90 text-white text-xs mb-1 h-8"
                            >
                                {ta('إنشاء الخطة', 'Create Plan')}
                            </Button>
                            <p className="text-[10px] text-gray-400 text-center mb-2">من {week.hijri_from}هـ إلى {week.hijri_to}هـ</p>
                            <Button
                                onClick={() => setSelectedWeek(week)}
                                variant="outline"
                                className="w-full text-amber-600 border-amber-300 hover:bg-amber-50 text-xs h-8"
                            >                                {ta('إنشاء الخطة (الغربية)', 'Create Plan (Gregorian)')}
                            </Button>
                            <p className="text-[10px] text-gray-400 text-center mt-1">من {week.greg_from}هـ إلى {week.greg_to}هـ</p>
                        </div>
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
}

// ===== Main Page =====
export default function WeeklyPlanPage() {
  const { dir } = useTranslation();
    const [mode, setMode] = useState<'single-select' | 'single' | 'multi' | null>(null);
    const [selectedWeek, setSelectedWeek] = useState<typeof WEEKS_DATA[0] | null>(null);

    if (mode === 'single' && selectedWeek) return (
        <SingleSubjectPlan
            onBack={() => { setMode('single-select'); }}
            preWeek={selectedWeek.num}
            preSemester="الثاني"
            preRange={`من ${selectedWeek.hijri_from}هـ إلى ${selectedWeek.hijri_to}هـ`}
        />
    );
    if (mode === 'single-select') return (
        <SingleSubjectWeekSelector
            onBack={() => setMode(null)}
            onSelectWeek={(week) => { setSelectedWeek(week); setMode('single'); }}
        />
    );
    if (mode === 'multi') return <MultiSubjectPlan onBack={() => setMode(null)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-amber-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-amber-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <CalendarDays className="w-4 h-4 text-amber-400" /> {ta('الخطة الأسبوعية', 'Weekly Plan')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('الخطة الأسبوعية', 'Weekly Plan')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('إنشاء خطتك الأسبوعية لمادة واحدة أو جميع المواد بطريقة سهلة وإرسالها مباشرة للطلاب وأولياء الأمور', 'Create your weekly plan for one or all subjects easily and send it to students and parents.')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{ta('مادة واحدة', 'Single Subject')}</span>
                            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" />{ta('أكثر من مادة', 'Multiple Subjects')}</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</span>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {[
                            { mode: 'single-select' as const, title: ta('خطة أسبوعية لمادة واحدة', 'Single-Subject Weekly Plan'), desc: 'إنشاء الخطة الأسبوعية لمادة واحدة مع جدول الأيام ومحتوى كل يوم', icon: BookOpen, badge: ta('الأكثر استخداماً', 'Most Used') },
                            { mode: 'multi' as const, title: ta('خطة أسبوعية لأكثر من مادة', 'Multi-Subject Weekly Plan'), desc: 'إنشاء الخطة الأسبوعية للجدول كامل مع جميع المواد الدراسية', icon: Layers, badge: undefined },
                        ].map(item => (
                            <Card key={item.mode} className="group hover:shadow-xl transition-all cursor-pointer border-0 bg-white dark:bg-gray-800 overflow-hidden" onClick={() => setMode(item.mode)}>
                                <div className="h-2 bg-gradient-to-l from-amber-600 to-orange-600" />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        {item.badge && <Badge className="bg-amber-500 text-white text-xs">{item.badge}</Badge>}
                                    </div>
                                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">{item.title}</CardTitle>
                                    <CardDescription className="text-xs mt-1">{item.desc}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Button className="w-full bg-gradient-to-l from-amber-600 to-orange-600 text-white border-0 hover:opacity-90 gap-2">
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
