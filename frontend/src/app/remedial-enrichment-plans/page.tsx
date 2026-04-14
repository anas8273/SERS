'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, Eye, Download, RotateCcw, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

interface FieldDef { key: string; label: string; type: 'text' | 'textarea' | 'image'; placeholder?: string; rows?: number; required?: boolean; }
interface FormDef { id: string; title: string; description: string; gradient: string; fields: FieldDef[]; }

const FORMS: FormDef[] = [
    {
        id: 'remedial-single',
        title: ta('خطة علاجية للطلاب والطالبات', 'Remedial Plan for Students'),
        description: ta('خطة علاجية فردية لطالب أو طالبة ضعيف/ة التحصيل', 'Individual remedial plan for low-achieving student'),
        gradient: 'from-green-600 to-emerald-700',
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
            { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
            { key: 'student', label: ta('اسم الطالب/ة', 'Student Name (M/F)'), type: 'text', placeholder: ta('اسم الطالب أو الطالبة', 'Student Name (M/F)'), required: true },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('المادة الدراسية', 'Subject') },
            { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('الصف الدراسي', 'Grade Level') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الفصل الأول / الثاني', 'First / Second Semester') },
            { key: 'weakness_areas', label: ta('مجالات الضعف', 'Weak Areas'), type: 'textarea', rows: 3, placeholder: ta('مجالات الضعف المحددة...', 'Identified weak areas...') },
            { key: 'objectives', label: ta('الأهداف العلاجية', 'Remedial Objectives'), type: 'textarea', rows: 3, placeholder: ta('الأهداف العلاجية...', 'Remedial objectives...') },
            { key: 'strategies', label: ta('الاستراتيجيات العلاجية', 'Remedial Strategies'), type: 'textarea', rows: 4, placeholder: ta('الاستراتيجيات والأنشطة العلاجية...', 'Remedial strategies and activities...') },
            { key: 'duration', label: ta('مدة الخطة', 'Plan Duration'), type: 'text', placeholder: ta('مدة تنفيذ الخطة', 'Plan Implementation Duration') },
            { key: 'evaluation', label: ta('أسلوب التقييم', 'Assessment Method'), type: 'textarea', rows: 2, placeholder: ta('أسلوب تقييم التقدم...', 'Progress assessment method...') },
            { key: 'notes', label: ta('ملاحظات', 'Notes'), type: 'textarea', rows: 2, placeholder: ta('ملاحظات إضافية...', 'Additional notes...') },
        ],
    },
    {
        id: 'remedial-group',
        title: ta('خطة علاجية جماعية لأكثر من طالب', 'Group Remedial Plan for Multiple Students'),
        description: ta('خطة علاجية جماعية لمجموعة من الطلاب ضعاف التحصيل', 'Group Remedial Plan for Low-achieving Students'),
        gradient: 'from-emerald-600 to-teal-700',
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
            { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
            { key: 'students', label: ta('أسماء الطلاب', 'Student Names'), type: 'textarea', rows: 3, placeholder: ta('أسماء الطلاب (كل اسم في سطر)...', 'Student names (each on a line)...'), required: true },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('المادة الدراسية', 'Subject') },
            { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('الصف الدراسي', 'Grade Level') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الفصل الأول / الثاني', 'First / Second Semester') },
            { key: 'weakness_areas', label: ta('مجالات الضعف المشتركة', 'Common Weak Areas'), type: 'textarea', rows: 3, placeholder: ta('مجالات الضعف المشتركة...', 'Common weak areas...') },
            { key: 'objectives', label: ta('الأهداف العلاجية', 'Remedial Objectives'), type: 'textarea', rows: 3, placeholder: ta('الأهداف العلاجية...', 'Remedial objectives...') },
            { key: 'strategies', label: ta('الاستراتيجيات العلاجية', 'Remedial Strategies'), type: 'textarea', rows: 4, placeholder: ta('الاستراتيجيات والأنشطة العلاجية...', 'Remedial strategies and activities...') },
            { key: 'duration', label: ta('مدة الخطة', 'Plan Duration'), type: 'text', placeholder: ta('مدة تنفيذ الخطة', 'Plan Implementation Duration') },
            { key: 'evaluation', label: ta('أسلوب التقييم', 'Assessment Method'), type: 'textarea', rows: 2, placeholder: ta('أسلوب تقييم التقدم...', 'Progress assessment method...') },
        ],
    },
    {
        id: 'enrichment-single',
        title: ta('خطة إثرائية للطلاب والطالبات', 'Enrichment Plan for Students (M/F)'),
        description: ta('خطة إثرائية فردية لطالب أو طالبة متفوق/ة وموهوب/ة', 'Individual Enrichment Plan for a Gifted/Talented Student'),
        gradient: 'from-amber-600 to-orange-600',
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
            { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
            { key: 'student', label: ta('اسم الطالب/ة', 'Student Name (M/F)'), type: 'text', placeholder: ta('اسم الطالب أو الطالبة', 'Student Name (M/F)'), required: true },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('المادة الدراسية', 'Subject') },
            { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('الصف الدراسي', 'Grade Level') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الفصل الأول / الثاني', 'First / Second Semester') },
            { key: 'strengths', label: ta('نقاط القوة والتميز', 'Strengths and Excellence'), type: 'textarea', rows: 3, placeholder: ta('نقاط القوة والتميز...', 'Strengths and excellence...') },
            { key: 'objectives', label: ta('الأهداف الإثرائية', 'Enrichment Objectives'), type: 'textarea', rows: 3, placeholder: ta('الأهداف الإثرائية...', 'Enrichment objectives...') },
            { key: 'activities', label: ta('الأنشطة الإثرائية', 'Enrichment Activities'), type: 'textarea', rows: 4, placeholder: ta('الأنشطة والمشاريع الإثرائية...', 'Enrichment activities and projects...') },
            { key: 'duration', label: ta('مدة الخطة', 'Plan Duration'), type: 'text', placeholder: ta('مدة تنفيذ الخطة', 'Plan Implementation Duration') },
            { key: 'evaluation', label: ta('أسلوب التقييم', 'Assessment Method'), type: 'textarea', rows: 2, placeholder: ta('أسلوب تقييم التقدم...', 'Progress assessment method...') },
        ],
    },
    {
        id: 'enrichment-group',
        title: ta('خطة إثرائية جماعية لأكثر من طالب', 'Group Enrichment Plan for Multiple Students'),
        description: ta('خطة إثرائية جماعية لمجموعة من الطلاب المتفوقين والموهوبين', 'Group Enrichment Plan for Gifted and Talented Students'),
        gradient: 'from-yellow-600 to-amber-600',
        fields: [
            { key: 'school', label: ta('اسم المدرسة', 'School Name'), type: 'text', placeholder: ta('اسم المدرسة', 'School Name'), required: true },
            { key: 'teacher', label: ta('اسم المعلم', 'Teacher Name'), type: 'text', placeholder: ta('اسم المعلم', 'Teacher Name'), required: true },
            { key: 'students', label: ta('أسماء الطلاب', 'Student Names'), type: 'textarea', rows: 3, placeholder: ta('أسماء الطلاب (كل اسم في سطر)...', 'Student names (each on a line)...'), required: true },
            { key: 'subject', label: ta('المادة', 'Subject'), type: 'text', placeholder: ta('المادة الدراسية', 'Subject') },
            { key: 'grade', label: ta('الصف', 'Grade'), type: 'text', placeholder: ta('الصف الدراسي', 'Grade Level') },
            { key: 'semester', label: ta('الفصل الدراسي', 'Semester'), type: 'text', placeholder: ta('الفصل الأول / الثاني', 'First / Second Semester') },
            { key: 'strengths', label: ta('نقاط القوة المشتركة', 'Shared Strengths'), type: 'textarea', rows: 3, placeholder: ta('نقاط القوة المشتركة...', 'Shared strengths...') },
            { key: 'objectives', label: ta('الأهداف الإثرائية', 'Enrichment Objectives'), type: 'textarea', rows: 3, placeholder: ta('الأهداف الإثرائية...', 'Enrichment objectives...') },
            { key: 'activities', label: ta('الأنشطة الإثرائية', 'Enrichment Activities'), type: 'textarea', rows: 4, placeholder: ta('الأنشطة والمشاريع الإثرائية...', 'Enrichment activities and projects...') },
            { key: 'duration', label: ta('مدة الخطة', 'Plan Duration'), type: 'text', placeholder: ta('مدة تنفيذ الخطة', 'Plan Implementation Duration') },
        ],
    },
];

function FormFill({ form, onBack }: { form: FormDef; onBack: () => void }) {
  const { dir } = useTranslation();
    const [values, setValues] = useState<Record<string, string>>({});
    const set = (k: string, v: string) => setValues(p => ({ ...p, [k]: v }));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة للخطط العلاجية والإثرائية', 'Back to Remedial and Enrichment Plans')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className={`bg-gradient-to-l ${form.gradient} text-white rounded-t-xl`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Target className="w-5 h-5" /></div>
                                <div>
                                    <CardTitle className="text-sm">{form.title}</CardTitle>
                                    <CardDescription className="text-white/80 text-xs mt-0.5">{form.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {form.fields.map(field => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {field.label}{field.required && <span className="text-red-500 me-1">*</span>}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <Textarea rows={field.rows || 3} placeholder={field.placeholder} value={values[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="resize-none" />
                                    ) : (
                                        <Input placeholder={field.placeholder} value={values[field.key] || ''} onChange={e => set(field.key, e.target.value)} />
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`flex-1 gap-2 bg-gradient-to-l ${form.gradient} text-white border-0`}>
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                                <Button onClick={() => setValues({})} variant="ghost" size="icon"><RotateCcw className="w-4 h-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        {Object.keys(values).some(k => values[k]) ? (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                                <div className={`bg-gradient-to-l ${form.gradient} p-5 text-white`}>
                                    <p className="text-xs opacity-80 mb-1">{ta('وزارة التعليم', 'Ministry of Education')}</p>
                                    <h2 className="text-base font-black">{form.title}</h2>
                                    {values.school && <p className="text-sm opacity-90 mt-1">{values.school}</p>}
                                </div>
                                <div className="p-5 space-y-2 text-sm">
                                    {form.fields.map(f =>
                                        values[f.key] ? (
                                            <div key={f.key} className="flex gap-2 border-b border-gray-100 pb-1.5">
                                                <span className="font-bold text-gray-600 min-w-[130px] shrink-0">{f.label}:</span>
                                                <span className="text-gray-800 whitespace-pre-wrap">{values[f.key]}</span>
                                            </div>
                                        ) : null
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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

export default function RemedialEnrichmentPage() {
  const { dir } = useTranslation();
    const [selected, setSelected] = useState<FormDef | null>(null);
    if (selected) return <FormFill form={selected} onBack={() => setSelected(null)} />;

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
                            <Target className="w-4 h-4 text-green-400" /> {ta('خطط علاجية وإثرائية', 'Remedial & Enrichment Plans')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('خطط علاجية وإثرائية', 'Remedial & Enrichment Plans')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('خطط علاجية وإثرائية مجانية وجاهزة لمساعدة الطلاب على التحسن والتميز في الدراسة', 'Free ready remedial and enrichment plans to help students improve and excel in their studies')}</p>
                        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><Target className="w-4 h-4" />{FORMS.length} خطط</span>
                            <span className="flex items-center gap-1.5"><Download className="w-4 h-4" />{ta('تحميل PDF', 'Download PDF')}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{ta('معاينة فورية', 'Live Preview')}</span>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {FORMS.map(form => (
                            <Card key={form.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setSelected(form)}>
                                <div className={`h-2 bg-gradient-to-l ${form.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${form.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Target className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">{form.title}</CardTitle>
                                    <CardDescription className="text-xs mt-1">{form.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Button className={`w-full bg-gradient-to-l ${form.gradient} text-white border-0 hover:opacity-90 gap-2`}>
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
