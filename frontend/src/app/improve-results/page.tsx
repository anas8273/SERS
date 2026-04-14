'use client';

import { useState } from 'react';
import { useFirestoreForms } from '@/hooks/useFirestoreForms';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Download, RotateCcw, ChevronRight, Image as FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

interface FieldDef { key: string; label: string; type: 'text' | 'textarea' | 'image'; placeholder?: string; rows?: number; required?: boolean; }
interface FormDef { id: string; title: string; description: string; gradient: string; badge?: string; fields: FieldDef[]; }

const FORMS: FormDef[] = [
    {
        id: 'honor-students',
        title: ta('تقرير تكريم الطلاب والطالبات المتفوقين', 'Excellence Students Honors Report'),
        description: ta('نموذج توثيق تكريم الطلاب والطالبات المتفوقين وتحفيزهم على الاستمرار في التميز', 'Documentation form for honoring excellent students and motivating them to continue excelling'),
        gradient: 'from-emerald-600 to-green-700',
        badge: 'الأكثر استخداماً',
        fields: [
            { key: 'edu_school', label: ta('إدارة التعليم، اسم المدرسة', 'Education Department, School Name'), type: 'textarea', placeholder: 'المملكة العربية السعودية\nوزارة التعليم\nالإدارة العامة للتعليم\nبالمنطقة الشرقية\nمدرسة', rows: 4 },
            { key: 'academic_year', label: ta('العام الدراسي', 'Academic Year'), type: 'text', placeholder: ta('١٤٤٧هـ', '1447H') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الفصل الدراسي الأول', 'First Academic Semester') },
            { key: 'event_date', label: ta('تاريخ التنفيذ', 'Implementation Date'), type: 'text', placeholder: ta('الأحد ١٢/٢/١٤٤٧هـ', 'Sunday 12/2/1447H') },
            { key: 'duration', label: ta('مدة التنفيذ', 'Duration'), type: 'text', placeholder: ta('ساعتان', 'Two Hours') },
            { key: 'location', label: ta('مكان التنفيذ', 'Implementation Location'), type: 'text', placeholder: ta('الساحة الداخلية', 'Inner Courtyard') },
            { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('الصف الأول والثاني', 'First and Second Grade') },
            { key: 'target_group', label: ta('الفئة المستهدفة', 'Target Group'), type: 'text', placeholder: ta('الطالبات', 'Female Students') },
            { key: 'count', label: ta('العدد', 'Count'), type: 'text', placeholder: ta('٣٠', '30') },
            { key: 'description', label: ta('الوصف', 'Description'), type: 'textarea', rows: 5 },
            { key: 'objectives', label: ta('الأهداف', 'Objectives'), type: 'textarea', rows: 6 },
            { key: 'implementation', label: ta('آلية التنفيذ', 'Implementation Method'), type: 'textarea', rows: 6 },
            { key: 'recommendations', label: ta('التوصيات', 'Recommendations'), type: 'textarea', rows: 5 },
            { key: 'image1', label: ta('صورة الشاهد الأول', 'First Evidence Image'), type: 'image' },
            { key: 'image2', label: ta('صورة الشاهد الثاني', 'Second Evidence Image'), type: 'image' },
            { key: 'right_sig', label: ta('وظيفة واسم التوقيع الأيمن', 'Right Signature Name & Title'), type: 'textarea', placeholder: ta('المعلم / اسم المعلم', 'Teacher / Teacher Name'), rows: 2 },
            { key: 'left_sig', label: ta('وظيفة واسم التوقيع الأيسر', 'Left Signature Name & Title'), type: 'textarea', placeholder: ta('مدير المدرسة / اسم المدير', 'Principal / Principal Name'), rows: 2 },
        ],
    },
];

function FormFill({ form, onBack }: { form: FormDef; onBack: () => void }) {
    const { dir } = useTranslation();
    const [v, setV] = useState<Record<string, string>>({});
    const [images, setImages] = useState<Record<string, string>>({});
    const set = (k: string, val: string) => setV(p => ({ ...p, [k]: val }));
    const handleImage = (key: string, file: File) => {
        const r = new FileReader();
        r.onload = e => setImages(p => ({ ...p, [key]: e.target?.result as string }));
        r.readAsDataURL(file);
    };

    const imageFields = form.fields.filter(f => f.type === 'image');
    const nonImageFields = form.fields.filter(f => f.type !== 'image');

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
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
                                <div>
                                    <CardTitle className="text-sm">{form.title}</CardTitle>
                                    <CardDescription className="text-white/80 text-xs mt-0.5">{form.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
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
                                <div className="grid grid-cols-2 gap-2">
                                    {imageFields.map(f => <ImgField key={f.key} k={f.key} label={f.label} />)}
                                </div>
                            )}
                            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <Button onClick={() => { setV({}); setImages({}); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm">
                                        <RotateCcw className="w-4 h-4" /> {ta('استعادة القيم الافتراضية', 'Restore Defaults')}
                                    </Button>
                                </div>
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`w-full gap-2 bg-gradient-to-l ${form.gradient} text-white border-0 text-sm`}>
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="sticky top-24">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4" /> {ta('معاينة مباشرة', 'Live Preview')}
                        </p>
                        {Object.keys(v).some(k => v[k]) || Object.keys(images).length > 0 ? (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                                <div className={`bg-gradient-to-l ${form.gradient} p-5 text-white`}>
                                    <p className="text-xs opacity-80 mb-1">{ta('وزارة التعليم — تحسين نتائج المتعلمين', 'Ministry of Education — Improving Learner Outcomes')}</p>
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
                                            {imageFields.map(f => images[f.key] ? (
                                                <img key={f.key} src={images[f.key]} alt={f.label} className="w-full h-24 object-cover rounded-lg border" />
                                            ) : null)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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

export default function ImproveResultsPage() {
    const { dir } = useTranslation();
    const { forms: dynamicForms } = useFirestoreForms('improve-results', FORMS);
    const [selected, setSelected] = useState<FormDef | null>(null);
    if (selected) return <FormFill form={selected} onBack={() => setSelected(null)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-emerald-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-emerald-500/20 rounded-full blur-[120px]" />
                        <div className="absolute bottom-10 left-[10%] w-64 h-64 bg-green-500/15 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <TrendingUp className="w-4 h-4 text-emerald-400" /> {ta('تحسين نتائج المتعلمين', 'Improve Learner Results')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('تحسين نتائج المتعلمين', 'Improve Learner Results')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('نماذج توثيق جهود تحسين نتائج الطلاب وتكريم المتفوقين', 'Documentation forms for student improvement efforts and honoring excellent students')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{dynamicForms.length} {ta('نماذج', 'forms')}</span>
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
                                            <TrendingUp className="w-6 h-6" />
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
