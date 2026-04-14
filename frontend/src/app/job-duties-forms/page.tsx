'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Eye, Download, RotateCcw, ChevronRight, Image as Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

const FORMS = [
    {
        id: 'school-broadcast',
        title: ta('تقرير تنفيذ إذاعة مدرسية', 'School Broadcast Implementation Report'),
        description: ta('توثيق تنفيذ إذاعة مدرسية كشاهد على أداء الواجبات الوظيفية', 'Document school broadcast as job duty evidence'),
        gradient: 'from-blue-600 to-indigo-700',
        badge: undefined,
    },
    {
        id: 'extracurricular-activity',
        title: ta('تقرير تنفيذ نشاط لا صفي', 'Extracurricular Activity Report'),
        description: ta('توثيق تنفيذ نشاط لا صفي كشاهد على أداء الواجبات الوظيفية', 'Document extracurricular activity as job duty evidence'),
        gradient: 'from-emerald-600 to-teal-700',
        badge: undefined,
    },
    {
        id: 'substitute-lesson',
        title: ta('تقرير تنفيذ حصة إنتظار', 'Substitute Lesson Implementation Report'),
        description: ta('توثيق تنفيذ حصة إنتظار كشاهد على أداء الواجبات الوظيفية', 'Document cover class as job duty evidence'),
        gradient: 'from-violet-600 to-purple-700',
        badge: undefined,
    },
];

type FormDef = typeof FORMS[0];

function FormFill({ form, onBack }: { form: FormDef; onBack: () => void }) {
  const { dir } = useTranslation();
    const [v, setV] = useState<Record<string, string>>({});
    const [images, setImages] = useState<Record<string, string>>({});
    const set = (k: string, val: string) => setV(p => ({ ...p, [k]: val }));
    const handleImage = (key: string, file: File) => {
        const r = new FileReader(); r.onload = e => setImages(p => ({ ...p, [key]: e.target?.result as string })); r.readAsDataURL(file);
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
    const ImgField = ({ k, label }: { k: string; label: string }) => (
        <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
            {images[k] ? (
                <div className="relative"><img src={images[k]} alt="" className="w-full h-28 object-cover rounded-lg border" /><button onClick={() => setImages(p => { const n = {...p}; delete n[k]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button></div>
            ) : (
                <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                    <span className="bg-gray-100 dark:bg-gray-700 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span>
                    <span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(k, e.target.files[0])} />
                </label>
            )}
        </div>
    );

    const renderFields = () => {
        if (form.id === 'substitute-lesson') return (
            <>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label><Textarea placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} rows={3} value={v.edu_school||''} onChange={e => set('edu_school',e.target.value)} className="resize-y text-sm" /></div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم المعلم المنفذ:', 'Implementing Teacher:')}</label><Input value={v.teacher||''} onChange={e => set('teacher',e.target.value)} placeholder={ta('اسم المعلم', 'Teacher Name')} className="text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('اسم المعلم الغائب:', 'Absent Teacher:')}</label><Input value={v.absent_teacher||''} onChange={e => set('absent_teacher',e.target.value)} placeholder={ta('اسم المعلم الغائب', 'Absent Teacher')} className="text-sm" /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المادة:', 'Subject:')}</label><Input value={v.subject||''} onChange={e => set('subject',e.target.value)} placeholder={ta('المادة', 'Subject')} className="text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الصف:', 'Grade:')}</label><Input value={v.grade||''} onChange={e => set('grade',e.target.value)} placeholder={ta('الصف', 'Grade')} className="text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('التاريخ:', 'Date:')}</label><Input value={v.date||''} onChange={e => set('date',e.target.value)} placeholder={ta('التاريخ', 'Date')} className="text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الحصة:', 'Period:')}</label><Input value={v.period||''} onChange={e => set('period',e.target.value)} placeholder={ta('رقم الحصة', 'Period Number')} className="text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('عدد الطلاب:', 'Student Count:')}</label><Input value={v.students_count||''} onChange={e => set('students_count',e.target.value)} placeholder={ta('عدد الطلاب', 'Number of Students')} className="text-sm" /></div>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأنشطة المنفذة:', 'Activities Performed:')}</label><TW k="activities" ph="الأنشطة التي نُفذت خلال حصة الانتظار..." rows={4} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('ملاحظات:', 'Notes:')}</label><Textarea rows={3} value={v.notes||''} onChange={e => set('notes',e.target.value)} className="resize-y text-sm" /></div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيمن:', 'Right Signature Name & Title:')}</label><Textarea rows={2} value={v.right_signature||''} onChange={e => set('right_signature',e.target.value)} placeholder={ta('المعلم المنفذ\nالاسم', 'المعلم المنفذ\\nالاسم')} className="resize-y text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيسر:', 'Left Signature Name & Title:')}</label><Textarea rows={2} value={v.left_signature||''} onChange={e => set('left_signature',e.target.value)} placeholder={ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم')} className="resize-y text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2"><ImgField k="image1" label="صورة الشاهد الأول:" /><ImgField k="image2" label="صورة الشاهد الثاني:" /></div>
            </>
        );
        // school-broadcast & extracurricular-activity share same layout
        return (
            <>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('إدارة التعليم، اسم المدرسة:', 'Education Department, School Name:')}</label><Textarea placeholder={ta('الإدارة العامة للتعليم\nبالمنطقة\nمدرسة', 'الإدارة العامة للتعليم\\nبالمنطقة\\nمدرسة')} rows={3} value={v.edu_school||''} onChange={e => set('edu_school',e.target.value)} className="resize-y text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{form.id === 'school-broadcast' ? ta('اسم البرنامج / المبادرة:', 'Program/Initiative Name:') : ta('اسم النشاط:', 'Activity Name:') }</label><Input value={v.program_name||''} onChange={e => set('program_name',e.target.value)} placeholder={form.id === 'school-broadcast' ? ta('تقرير تنفيذ إذاعة مدرسية', 'School Broadcast Implementation Report') : ta('اسم النشاط اللاصفي', 'Extracurricular Activity Name') } className="text-sm" /></div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المنفذ/ون:', 'Implementer(s):')}</label><Input value={v.implementors||''} onChange={e => set('implementors',e.target.value)} className="text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المشاركـ/ون:', 'Participant(s):')}</label><Input value={v.participants||''} onChange={e => set('participants',e.target.value)} className="text-sm" /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مكان التنفيذ:', 'Location:')}</label><Input value={v.location||''} onChange={e => set('location',e.target.value)} className="text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('مدة التنفيذ:', 'Duration:')}</label><Input value={v.duration||''} onChange={e => set('duration',e.target.value)} className="text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('تاريخ التنفيذ:', 'Date:')}</label><Input value={v.date||''} onChange={e => set('date',e.target.value)} className="text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المستفيدون / عددهم:', 'Beneficiaries / Count:')}</label><Input value={v.beneficiaries||''} onChange={e => set('beneficiaries',e.target.value)} className="text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('المجال:', 'Domain:')}</label><Input value={v.domain||''} onChange={e => set('domain',e.target.value)} className="text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('الأهداف:', 'Objectives:')}</label><Textarea rows={5} value={v.objectives||''} onChange={e => set('objectives',e.target.value)} className="resize-y text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('خطوات التنفيذ / الوصف:', 'Implementation Steps / Description:')}</label><TW k="steps" ph="خطوات التنفيذ..." rows={5} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيمن:', 'Right Signature Name & Title:')}</label><Textarea rows={2} value={v.right_signature||''} onChange={e => set('right_signature',e.target.value)} placeholder={ta('رائد النشاط\nالاسم', 'رائد النشاط\\nالاسم')} className="resize-y text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('وظيفة واسم التوقيع الأيسر:', 'Left Signature Name & Title:')}</label><Textarea rows={2} value={v.left_signature||''} onChange={e => set('left_signature',e.target.value)} placeholder={ta('مدير المدرسة\nالاسم', 'مدير المدرسة\\nالاسم')} className="resize-y text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2"><ImgField k="image1" label="صورة الشاهد الأول:" /><ImgField k="image2" label="صورة الشاهد الثاني:" /></div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{ta('ضع رابط الشواهد إن وجد لإنشاء باركود ووضعه بالنموذج :', 'Add evidence link to generate QR code:')}</label>
                    <Input type="url" placeholder="" value={v.evidence_url||''} onChange={e => set('evidence_url',e.target.value)} className="text-sm" />
                    <p className="text-xs text-gray-400 mt-1 text-start">{ta('سيتم إنشاء باركود تلقائياً / حقل غير إلزامي تجاهله إذا كنت لاتريد باركود', 'QR code auto-generated / Optional field - skip if not needed')}</p>
                </div>
            </>
        );
    };

    const hasData = Object.keys(v).some(k => v[k]) || Object.keys(images).length > 0;

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
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><ClipboardCheck className="w-5 h-5" /></div>
                                <div><CardTitle className="text-sm">{form.title}</CardTitle><CardDescription className="text-white/80 text-xs mt-0.5">{form.description}</CardDescription></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {renderFields()}
                            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <Button className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm"><Eye className="w-4 h-4" />{ta('معاينة', 'Preview')}</Button>
                                    <Button onClick={() => { setV({}); setImages({}); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm"><RotateCcw className="w-4 h-4" />{ta('استعادة القيم الافتراضية', 'Restore Defaults')}</Button>
                                </div>
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`w-full gap-2 bg-gradient-to-l ${form.gradient} text-white border-0 text-sm`}><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</Button>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        {hasData ? (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                                <div className={`bg-gradient-to-l ${form.gradient} p-4 text-white`}>
                                    <p className="text-xs opacity-80 mb-1">{ta('وزارة التعليم — أداء الواجبات الوظيفية', 'Ministry of Education — Job Duties Performance')}</p>
                                    <h2 className="text-base font-black">{form.title}</h2>
                                    {v.edu_school && <p className="text-xs opacity-90 mt-1 whitespace-pre-line">{v.edu_school}</p>}
                                </div>
                                <div className="p-4 space-y-1.5 text-xs">
                                    {Object.entries(v).filter(([k]) => !['edu_school','objectives','steps','activities','notes','right_signature','left_signature','evidence_url'].includes(k)).map(([k,val]) => val ? (
                                        <div key={k} className="flex gap-2 border-b border-gray-100 pb-1"><span className="font-bold text-gray-600 min-w-[100px] shrink-0">{k}:</span><span>{val}</span></div>
                                    ) : null)}
                                    {v.objectives && <div><p className="font-bold text-gray-600 mb-0.5">{ta('الأهداف:', 'Objectives:')}</p><p className="text-gray-700 whitespace-pre-line">{v.objectives}</p></div>}
                                    {v.steps && <div><p className="font-bold text-gray-600 mb-0.5">{ta('خطوات التنفيذ:', 'Implementation Steps:')}</p><p className="text-gray-700 whitespace-pre-line">{v.steps}</p></div>}
                                    {v.activities && <div><p className="font-bold text-gray-600 mb-0.5">{ta('الأنشطة:', 'Activities:')}</p><p className="text-gray-700 whitespace-pre-line">{v.activities}</p></div>}
                                    {(images.image1 || images.image2) && <div className="grid grid-cols-2 gap-2 mt-2">{['image1','image2'].map(k => images[k] ? <img key={k} src={images[k]} alt="" className="w-full h-24 object-cover rounded-lg border" /> : null)}</div>}
                                    {(v.right_signature || v.left_signature) && (
                                        <div className="flex justify-between mt-3 pt-2 border-t border-gray-200">
                                            {[v.right_signature, v.left_signature].map((sig, i) => sig ? <div key={i} className="text-center"><p className="whitespace-pre-line text-gray-700 text-[10px]">{sig}</p><div className="mt-1 border-b border-gray-400 w-16 mx-auto" /></div> : null)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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

export default function JobDutiesFormsPage() {
  const { dir } = useTranslation();
    const [selected, setSelected] = useState<FormDef | null>(null);
    if (selected) return <FormFill form={selected} onBack={() => setSelected(null)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-blue-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-blue-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <Link href="/teacher-evaluation-forms" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm transition-colors">
                            <ChevronRight className="w-4 h-4" /> {ta('العودة لعناصر التقييم', 'Back to Evaluation Elements')}
                        </Link>
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <ClipboardCheck className="w-4 h-4 text-blue-400" /> {ta('أداء الواجبات الوظيفية', 'Job Duties Performance')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('أداء الواجبات الوظيفية', 'Job Duties Performance')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('نماذج توثيق أداء الواجبات الوظيفية للمعلم', 'Teacher Job Duties Documentation Forms')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" />{FORMS.length} نماذج</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {FORMS.map(form => (
                            <Card key={form.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setSelected(form)}>
                                <div className={`h-2 bg-gradient-to-l ${form.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${form.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <ClipboardCheck className="w-6 h-6" />
                                        </div>
                                        {form.badge && <Badge className="bg-amber-500 text-white text-xs">{form.badge}</Badge>}
                                    </div>
                                    <CardTitle className="text-sm leading-snug group-hover:text-primary transition-colors">{form.title}</CardTitle>
                                    <CardDescription className="text-xs mt-1">{form.description}</CardDescription>
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
