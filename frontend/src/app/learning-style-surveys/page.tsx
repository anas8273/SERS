'use client';

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Brain, Eye, Download, RotateCcw, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

// ===== VARK Questions for Children =====
const VARK_CHILDREN_QUESTIONS = [
    { q: 'عندما يتعلم طفلك شيئاً جديداً، يفضل:', options: ['رؤية صور أو رسومات توضيحية', 'الاستماع لشرح شفهي', 'قراءة تعليمات مكتوبة', 'تجربة الشيء بنفسه'] },
    { q: 'طفلك يتذكر المعلومات بشكل أفضل عندما:', options: ['يرى خرائط أو مخططات', 'يسمع شرحاً أو أغنية', 'يقرأ أو يكتب', 'يمارس نشاطاً حركياً'] },
    { q: 'في وقت الفراغ، طفلك يفضل:', options: ['مشاهدة التلفاز أو الرسوم', 'الاستماع للموسيقى أو القصص', 'القراءة أو الكتابة', 'اللعب والحركة'] },
    { q: 'عند حل مشكلة، طفلك يميل إلى:', options: ['رسم الحل أو تخيله', 'التحدث عن الحل بصوت عالٍ', 'كتابة الخطوات', 'تجربة حلول مختلفة'] },
    { q: 'طفلك يتعلم أفضل عندما:', options: ['يرى المعلم يشرح على السبورة', 'يستمع لشرح المعلم', 'يقرأ الكتاب بنفسه', 'يقوم بتجربة عملية'] },
];

const VARK_ADULT_QUESTIONS = [
    { q: 'عند تعلم مهارة جديدة، تفضل:', options: ['مشاهدة فيديو توضيحي', 'الاستماع لشرح شفهي', 'قراءة دليل مكتوب', 'التجربة المباشرة'] },
    { q: 'تتذكر المعلومات بشكل أفضل عندما:', options: ['ترى مخططات وصور', 'تسمع شرحاً أو نقاشاً', 'تقرأ وتدوّن ملاحظات', 'تمارس وتطبق'] },
    { q: 'في الاجتماعات، تفضل:', options: ['عروض تقديمية مرئية', 'النقاش الشفهي', 'تقارير مكتوبة', 'ورش عمل تطبيقية'] },
    { q: 'عند حل مشكلة معقدة، تميل إلى:', options: ['رسم مخطط أو خريطة ذهنية', 'التحدث مع شخص آخر', 'كتابة الخيارات والمقارنة', 'تجربة الحلول عملياً'] },
    { q: 'تستوعب التعليمات بشكل أفضل عندما:', options: ['تراها مصورة أو مرسومة', 'تسمعها شفهياً', 'تقرأها مكتوبة', 'تطبقها مباشرة'] },
];

type VARKType = 'V' | 'A' | 'R' | 'K';
const VARK_LABELS: Record<VARKType, string> = { V: 'بصري', A: 'سمعي', R: 'قرائي/كتابي', K: ta('حركي', 'Kinesthetic') };
const VARK_COLORS: Record<VARKType, string> = { V: 'bg-blue-100 text-blue-700', A: 'bg-green-100 text-green-700', R: 'bg-purple-100 text-purple-700', K: 'bg-orange-100 text-orange-700' };

// ===== VARK Survey Form =====
function VARKSurvey({ type, onBack }: { type: 'children' | 'adults'; onBack: () => void }) {
  const { dir } = useTranslation();
    const questions = type === 'children' ? VARK_CHILDREN_QUESTIONS : VARK_ADULT_QUESTIONS;
    const [info, setInfo] = useState({ school: '', teacher: '', student: '', grade: '' });
    const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
    const setI = (k: string, v: string) => setInfo(p => ({ ...p, [k]: v }));

    const result = useMemo(() => {
        const counts: Record<VARKType, number> = { V: 0, A: 0, R: 0, K: 0 };
        const types: VARKType[] = ['V', 'A', 'R', 'K'];
        answers.forEach(a => { if (a >= 0) counts[types[a]]++; });
        const dominant = (Object.entries(counts) as [VARKType, number][]).sort((a, b) => b[1] - a[1])[0];
        return { counts, dominant: dominant[0] };
    }, [answers]);

    const answered = answers.filter(a => a >= 0).length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة لاستبيانات أنماط التعلم', 'Back to Learning Style Surveys')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-l from-purple-600 to-violet-700 text-white rounded-t-xl py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><Brain className="w-4 h-4" /></div>
                                    <CardTitle className="text-sm">
                                        {type === 'children' ? ta('استبيان أنماط التعلم للأطفال (VARK)', 'Learning Styles Survey for Children (VARK)') : ta('استبيان أنماط التعلم للكبار (VARK)', 'Learning Styles Survey for Adults (VARK)') }
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    {[['school','اسم المدرسة'],['teacher','اسم المعلم'],['student', type === 'children' ? ta('اسم الطالب/ة', 'Student Name (M/F)') : 'الاسم'],['grade','الصف']].map(([k,l]) => (
                                        <div key={k}>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                                            <Input placeholder={l} value={(info as any)[k]} onChange={e => setI(k, e.target.value)} className="h-9 text-sm" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {questions.map((q, qi) => (
                            <Card key={qi} className="border-0 shadow-md">
                                <CardContent className="p-5">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-full text-xs font-black ms-2">{qi + 1}</span>
                                        {q.q}
                                    </p>
                                    <div className="space-y-2">
                                        {q.options.map((opt, oi) => (
                                            <label key={oi} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${answers[qi] === oi ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'}`}>
                                                <input type="radio" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers(p => { const n = [...p]; n[qi] = oi; return n; })} className="accent-purple-600" />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                                                <span className="mr-auto text-xs font-bold text-purple-600">{['V','A','R','K'][oi]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <div className="flex gap-3">
                            <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} disabled={answered < questions.length} className="flex-1 gap-2 bg-gradient-to-l from-purple-600 to-violet-700 text-white border-0 disabled:opacity-50">
                                <Download className="w-4 h-4" /> {ta('تحميل النتيجة PDF', 'Download Result PDF')}
                            </Button>
                            <Button onClick={() => setAnswers(Array(questions.length).fill(-1))} variant="ghost" size="icon"><RotateCcw className="w-4 h-4" /></Button>
                        </div>
                    </div>

                    {/* Result Preview */}
                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('نتيجة الاستبيان', 'Survey Result')}</p>
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                            <div className="bg-gradient-to-l from-purple-600 to-violet-700 p-4 text-white">
                                <h2 className="text-base font-black text-center">{ta('نتيجة استبيان أنماط التعلم', 'Learning Style Survey Result')}</h2>
                                {info.student && <p className="text-center text-sm opacity-90">{info.student} — {info.school}</p>}
                            </div>
                            <div className="p-5">
                                <p className="text-xs text-gray-500 mb-3">الإجابات: {answered} / {questions.length}</p>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {(Object.entries(result.counts) as [VARKType, number][]).map(([type, count]) => (
                                        <div key={type} className={`rounded-xl p-3 text-center ${VARK_COLORS[type]} ${result.dominant === type ? 'ring-2 ring-offset-1 ring-purple-500' : ''}`}>
                                            <p className="text-2xl font-black">{count}</p>
                                            <p className="text-xs font-bold">{VARK_LABELS[type]}</p>
                                            <p className="text-xs opacity-70">({type})</p>
                                        </div>
                                    ))}
                                </div>
                                {answered === questions.length && (
                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                                        <p className="text-xs text-gray-500 mb-1">{ta('نمط التعلم السائد', 'Dominant Learning Style')}</p>
                                        <p className="text-2xl font-black text-purple-700">{VARK_LABELS[result.dominant]}</p>
                                        <p className="text-xs text-purple-600 mt-1">({result.dominant})</p>
                                    </div>
                                )}
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

// ===== Roster Form =====
function VARKRoster({ onBack }: { onBack: () => void }) {
  const { dir } = useTranslation();
    const [info, setInfo] = useState({ school: '', teacher: '', grade: '', subject: '' });
    const [students, setStudents] = useState<{ name: string; type: VARKType | '' }[]>(
        Array(10).fill(null).map(() => ({ name: '', type: '' }))
    );
    const setI = (k: string, v: string) => setInfo(p => ({ ...p, [k]: v }));
    const setStudent = (i: number, field: 'name' | 'type', val: string) =>
        setStudents(p => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n; });

    const stats = useMemo(() => {
        const filled = students.filter(s => s.type);
        const counts: Record<VARKType, number> = { V: 0, A: 0, R: 0, K: 0 };
        filled.forEach(s => { if (s.type) counts[s.type as VARKType]++; });
        const total = filled.length;
        return { counts, total, pct: (t: VARKType) => total ? ((counts[t] / total) * 100).toFixed(1) : '0' };
    }, [students]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة', 'Go Back')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-l from-purple-600 to-violet-700 text-white rounded-t-xl py-4">
                            <CardTitle className="text-sm">{ta('كشف التصنيف ونسبة الطلاب حسب نمط التعلم', 'Classification report and student percentage by learning style')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {[['school','اسم المدرسة'],['teacher','اسم المعلم'],['grade','الصف'],['subject','المادة']].map(([k,l]) => (
                                    <div key={k}>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                                        <Input placeholder={l} value={(info as any)[k]} onChange={e => setI(k, e.target.value)} className="h-9 text-sm" />
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-sm font-bold text-gray-700 mb-3">{ta('أسماء الطلاب وأنماط تعلمهم:', 'Student Names and Their Learning Styles:')}</p>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {students.map((s, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
                                            <Input placeholder={ta('اسم الطالب', 'Student Name')} value={s.name} onChange={e => setStudent(i, 'name', e.target.value)} className="h-8 text-xs flex-1" />
                                            <select value={s.type} onChange={e => setStudent(i, 'type', e.target.value)} className="border border-input rounded-md px-2 py-1 text-xs bg-background h-8 w-28">
                                                <option value="">{ta('النمط', 'Style')}</option>
                                                <option value="V">{ta('بصري (V)', 'Visual (V)')}</option>
                                                <option value="A">{ta('سمعي (A)', 'Auditory (A)')}</option>
                                                <option value="R">{ta('قرائي (R)', 'Read/Write (R)')}</option>
                                                <option value="K">{ta('حركي (K)', 'Kinesthetic (K)')}</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => setStudents(p => [...p, { name: '', type: '' }])}>{ta('+ إضافة طالب', '+ Add Student')}</Button>
                            </div>
                            <div className="flex gap-3 pt-2 border-t">
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className="flex-1 gap-2 bg-gradient-to-l from-purple-600 to-violet-700 text-white border-0">
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                                <Button onClick={() => setStudents(Array(10).fill(null).map(() => ({ name: '', type: '' })))} variant="ghost" size="icon"><RotateCcw className="w-4 h-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة الكشف', 'Preview Report')}</p>
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                            <div className="bg-gradient-to-l from-purple-600 to-violet-700 p-4 text-white">
                                <h2 className="text-base font-black text-center">{ta('كشف تصنيف أنماط التعلم', 'Learning Style Classification Sheet')}</h2>
                                {info.school && <p className="text-center text-xs opacity-90">{info.school} — {info.grade}</p>}
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {(Object.entries(stats.counts) as [VARKType, number][]).map(([t, c]) => (
                                        <div key={t} className={`rounded-xl p-2 text-center ${VARK_COLORS[t]}`}>
                                            <p className="text-xl font-black">{c}</p>
                                            <p className="text-xs">{VARK_LABELS[t]}</p>
                                            <p className="text-xs font-bold">{stats.pct(t)}%</p>
                                        </div>
                                    ))}
                                </div>
                                {students.filter(s => s.name || s.type).length > 0 && (
                                    <table className="w-full text-xs border-collapse">
                                        <thead><tr className="bg-purple-50"><th className="border border-gray-200 p-1.5">#</th><th className="border border-gray-200 p-1.5 text-start">{ta('الاسم', 'Name')}</th><th className="border border-gray-200 p-1.5">{ta('النمط', 'Style')}</th></tr></thead>
                                        <tbody>
                                            {students.filter(s => s.name || s.type).map((s, i) => (
                                                <tr key={i}><td className="border border-gray-200 p-1.5 text-center">{i+1}</td><td className="border border-gray-200 p-1.5">{s.name || '—'}</td><td className="border border-gray-200 p-1.5 text-center font-bold">{s.type ? `${VARK_LABELS[s.type as VARKType]} (${s.type})` : '—'}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
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

// ===== Main Page =====
export default function LearningStyleSurveysPage() {
  const { dir } = useTranslation();
    const [mode, setMode] = useState<'children' | 'adults' | 'roster' | null>(null);

    if (mode === 'children') return <VARKSurvey type="children" onBack={() => setMode(null)} />;
    if (mode === 'adults') return <VARKSurvey type="adults" onBack={() => setMode(null)} />;
    if (mode === 'roster') return <VARKRoster onBack={() => setMode(null)} />;

    const CARDS = [
        { id: 'children' as const, title: ta('استبيان أنماط التعلم للأطفال', 'Learning Styles Survey for Children'), desc: 'استبيان VARK مخصص للأطفال لتحديد نمط التعلم المفضل (بصري، سمعي، قرائي، حركي)، أولياء الأمور يقومون بتعبئة الاستبيان', gradient: 'from-purple-600 to-violet-700' },
        { id: 'adults' as const, title: ta('استبيان أنماط التعلم للكبار', 'Learning Styles Survey for Adults'), desc: 'استبيان VARK للمتوسط والثانوي لتحديد أسلوب التعلم الأمثل، الطلاب يقومون بتعبئة الاستبيان', gradient: 'from-violet-600 to-indigo-700' },
        { id: 'roster' as const, title: ta('كشف التصنيف ونسبة الطلاب حسب نمط التعلم', 'Classification report and student percentage by learning style'), desc: 'كشف لتحليل نتائج تصنيف الطلاب وحساب النسب حسب أنماط التعلم المختلفة', gradient: 'from-indigo-600 to-blue-700' },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-purple-950 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-purple-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <Brain className="w-4 h-4 text-purple-400" /> {ta('استبيانات أنماط التعلم', 'Learning Style Surveys')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('استبيانات أنماط التعلم', 'Learning Style Surveys')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('استبيانات تعليمية مجانية وجاهزة لتحديد أنماط التعلم وتقييم الطلاب', 'Free ready educational surveys for identifying learning styles and assessing students')}</p>
                    </div>
                </section>
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {CARDS.map(card => (
                            <Card key={card.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setMode(card.id)}>
                                <div className={`h-2 bg-gradient-to-l ${card.gradient}`} />
                                <CardHeader className="pb-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 mb-3">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-sm leading-snug group-hover:text-primary transition-colors">{card.title}</CardTitle>
                                    <CardDescription className="text-xs mt-1">{card.desc}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Button className={`w-full bg-gradient-to-l ${card.gradient} text-white border-0 hover:opacity-90 gap-2`}>
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
