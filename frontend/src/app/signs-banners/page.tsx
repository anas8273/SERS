'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Eye, Download, RotateCcw, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ta } from '@/i18n/auto-translations';
import { useTranslation } from '@/i18n/useTranslation';

// ===== Exam Room Signs Form =====
function ExamRoomSignsForm({ onBack }: { onBack: () => void }) {
  const { dir } = useTranslation();
    const [mode, setMode] = useState<'number' | 'name'>('number');
    const [school, setSchool] = useState('');
    const [examTitle, setExamTitle] = useState('');
    const [semester, setSemester] = useState('');
    const [year, setYear] = useState('');
    const [rooms, setRooms] = useState<{ value: string; supervisor: string }[]>([
        { value: '1', supervisor: '' },
        { value: '2', supervisor: '' },
        { value: '3', supervisor: '' },
    ]);

    const addRoom = () => setRooms(p => [...p, { value: '', supervisor: '' }]);
    const removeRoom = (i: number) => setRooms(p => p.filter((_, idx) => idx !== i));
    const setRoom = (i: number, field: 'value' | 'supervisor', val: string) =>
        setRooms(p => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n; });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة للوحات وبنرات', 'Back to Boards and Banners')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-l from-slate-600 to-gray-700 text-white rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Layers className="w-5 h-5" /></div>
                                <div>
                                    <CardTitle className="text-sm">{ta('لوحات لجان الاختبارات', 'Examination Committee Boards')}</CardTitle>
                                    <CardDescription className="text-white/80 text-xs mt-0.5">{ta('لوحات إرشادية لقاعات الامتحانات قابلة للتخصيص', 'Customizable guidance boards for exam halls')}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Mode Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ta('نوع اللوحة', 'Board Type')}</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setMode('number')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'number' ? 'bg-gradient-to-l from-slate-600 to-gray-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                        {ta('رقمي', 'Digital')}
                                    </button>
                                    <button onClick={() => setMode('name')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'name' ? 'bg-gradient-to-l from-slate-600 to-gray-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                        {ta('اسمي', 'Nominal')}
                                    </button>
                                </div>
                            </div>

                            {[
                                { val: school, set: setSchool, label: ta('اسم المدرسة', 'School Name'), ph: ta('اسم المدرسة', 'School Name') },
                                { val: examTitle, set: setExamTitle, label: ta('عنوان الاختبار', 'Exam Title'), ph: ta('اختبار الفصل الأول / الثاني', 'First / Second Semester Exam') },
                                { val: semester, set: setSemester, label: ta('الفصل الدراسي', 'Semester'), ph: ta('الفصل الأول / الثاني', 'First / Second Semester') },
                                { val: year, set: setYear, label: ta('العام الدراسي', 'Academic Year'), ph: ta('1447هـ', '1447H') },
                            ].map(f => (
                                <div key={f.label}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
                                    <Input placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
                                </div>
                            ))}

                            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {mode === 'number' ? ta('أرقام اللجان', 'Committee Numbers') : ta('أسماء اللجان', 'Committee Names') }
                                    </p>
                                    <Button onClick={addRoom} variant="outline" size="sm" className="gap-1 text-xs h-7">
                                        <Plus className="w-3 h-3" /> {ta('إضافة', 'Add')}
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {rooms.map((room, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
                                            <Input
                                                placeholder={mode === 'number' ? `رقم اللجنة ${i + 1}` : `اسم اللجنة ${i + 1}`}
                                                value={room.value}
                                                onChange={e => setRoom(i, 'value', e.target.value)}
                                                className="h-8 text-xs flex-1"
                                            />
                                            <Input
                                                placeholder={ta('اسم المراقب', 'Observer Name')}
                                                value={room.supervisor}
                                                onChange={e => setRoom(i, 'supervisor', e.target.value)}
                                                className="h-8 text-xs flex-1"
                                            />
                                            {rooms.length > 1 && (
                                                <button onClick={() => removeRoom(i)} className="text-red-400 hover:text-red-600 shrink-0">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className="flex-1 gap-2 bg-gradient-to-l from-slate-600 to-gray-700 text-white border-0">
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                                <Button onClick={() => { setSchool(''); setExamTitle(''); setSemester(''); setYear(''); setRooms([{ value: '1', supervisor: '' }, { value: '2', supervisor: '' }, { value: '3', supervisor: '' }]); }} variant="ghost" size="icon">
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <div className="sticky top-24 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        {(school || rooms.some(r => r.value)) ? (
                            <div className="space-y-3">
                                {rooms.filter(r => r.value).map((room, i) => (
                                    <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                                        <div className="bg-gradient-to-l from-slate-700 to-gray-800 p-3 text-white">
                                            <div className="flex justify-between text-xs opacity-80">
                                                <span>{school}</span>
                                                <span>{ta('وزارة التعليم', 'Ministry of Education')}</span>
                                            </div>
                                            {examTitle && <p className="text-center text-xs mt-1 opacity-90">{examTitle}</p>}
                                        </div>
                                        <div className="p-4 text-center">
                                            <p className="text-xs text-gray-500 mb-1">{ta('لجنة رقم / اسم', 'Committee Number / Name')}</p>
                                            <p className="text-4xl font-black text-gray-800">{room.value}</p>
                                            {room.supervisor && <p className="text-xs text-gray-500 mt-2">المراقب: {room.supervisor}</p>}
                                            {semester && <p className="text-xs text-gray-400 mt-1">{semester} — {year}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
export default function SignsBannersPage() {
  const { dir } = useTranslation();
    const [showForm, setShowForm] = useState(false);
    if (showForm) return <ExamRoomSignsForm onBack={() => setShowForm(false)} />;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main>
                <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-gray-900 to-slate-900 text-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-10 right-[15%] w-72 h-72 bg-slate-500/20 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <Layers className="w-4 h-4 text-slate-400" /> {ta('لوحات وبنرات', 'Signs & Banners')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{ta('لوحات وبنرات', 'Signs & Banners')}</h1>
                        <p className="text-lg text-white/70 mb-6">{ta('لوحات وعلامات إرشادية مجانية وجاهزة للبيئة التعليمية والامتحانات', 'Free ready guidance boards and signs for educational environment and exams')}</p>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-sm mx-auto">
                        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white dark:bg-gray-800" onClick={() => setShowForm(true)}>
                            <div className="h-2 bg-gradient-to-l from-slate-600 to-gray-700" />
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <Badge className="bg-amber-500 text-white text-xs">{ta('الأكثر استخداماً', 'Most Used')}</Badge>
                                </div>
                                <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                                    {ta('لوحات لجان الاختبارات - رقمي أو اسمي', 'Exam Committee Boards - Numerical or Named')}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    {ta('لوحات إرشادية لقاعات الامتحانات قابلة للتخصيص بالأرقام أو الأسماء', 'Customizable exam hall guidance boards with numbers or names')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {['رقمي', 'اسمي', 'قابل للتخصيص', 'طباعة فورية'].map(tag => (
                                        <span key={tag} className="text-xs bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                </div>
                                <Button className="w-full bg-gradient-to-l from-slate-600 to-gray-700 text-white border-0 hover:opacity-90 gap-2">
                                    <Eye className="w-4 h-4" /> {ta('ابدأ التصميم', 'Start Design')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
