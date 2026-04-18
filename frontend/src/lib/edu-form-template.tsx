'use client';
import { ta } from '@/i18n/auto-translations';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye, Download, RotateCcw, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface EduField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'image';
    placeholder?: string;
    rows?: number;
    required?: boolean;
}

export interface EduFormDef {
    id: string;
    title: string;
    description?: string;
    gradient: string;
    icon: any;
    fields: EduField[];
}

export function EduFormPage({
    pageTitle,
    pageDesc,
    gradient,
    icon: Icon,
    forms,
}: {
    pageTitle: string;
    pageDesc: string;
    gradient: string;
    icon: any;
    forms: EduFormDef[];
}) {
    const [selected, setSelected] = useState<EduFormDef | null>(null);

    if (selected) {
        return <EduFormFill form={selected} gradient={gradient} onBack={() => setSelected(null)} />;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950" dir="rtl">
            <Navbar />
            <main>
                <section className={`relative overflow-hidden bg-gradient-to-bl ${gradient.replace('from-', 'from-slate-900 via-').replace('to-', 'to-slate-900 via-')} text-white`}
                    style={{ background: `linear-gradient(to bottom left, #0f172a, #1e1b4b, #0f172a)` }}>
                    <div className="relative container mx-auto px-4 pt-32 pb-20 text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold mb-6">
                            <Icon className="w-4 h-4" />
                            {pageTitle}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{pageTitle}</h1>
                        <p className="text-lg text-white/70 max-w-2xl mx-auto">{pageDesc}</p>
                    </div>
                </section>
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {forms.map(form => (
                            <Card key={form.id} className="group hover:shadow-xl transition-all cursor-pointer border-0 bg-white dark:bg-gray-800 overflow-hidden" onClick={() => setSelected(form)}>
                                <div className={`h-2 bg-gradient-to-l ${gradient}`} />
                                <CardContent className="p-5">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-sm leading-snug group-hover:text-primary transition-colors">{form.title}</h3>
                                    {form.description && <p className="text-xs text-gray-500 mb-4 line-clamp-2">{form.description}</p>}
                                    <Button className={`w-full bg-gradient-to-l ${gradient} text-white border-0 hover:opacity-90 text-sm`}>{ta('ابدأ التصميم', 'Start Design')}</Button>
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

function EduFormFill({ form, gradient, onBack }: { form: EduFormDef; gradient: string; onBack: () => void }) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [images, setImages] = useState<Record<string, string>>({});
    const set = (k: string, v: string) => setValues(p => ({ ...p, [k]: v }));
    const handleImage = (key: string, file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error(ta('⚠️ حجم الصورة كبير! الحد الأقصى 5MB', '⚠️ Image too large! Max 5MB'));
            return;
        }
        const reader = new FileReader();
        reader.onload = e => setImages(p => ({ ...p, [key]: e.target?.result as string }));
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
                    <ChevronRight className="w-4 h-4" /> {ta('العودة', 'Back')}
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className={`bg-gradient-to-l ${gradient} text-white rounded-t-xl`}>
                            <CardTitle className="text-base">{form.title}</CardTitle>
                            {form.description && <CardDescription className="text-white/80 text-xs">{form.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {form.fields.map(field => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {field.label}{field.required && <span className="text-red-500 me-1">*</span>}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <Textarea rows={field.rows || 3} placeholder={field.placeholder} value={values[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="resize-none" />
                                    ) : field.type === 'image' ? (
                                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                                            {images[field.key] ? (
                                                <div className="relative">
                                                    <img src={images[field.key]} alt="" className="w-full h-32 object-cover rounded-lg" />
                                                    <button onClick={() => setImages(p => { const n = { ...p }; delete n[field.key]; return n; })} className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs">×</button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer">
                                                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-500">{ta('اضغط لرفع صورة', 'Click to Upload Image')}</p>
                                                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(field.key, e.target.files[0])} />
                                                </label>
                                            )}
                                        </div>
                                    ) : (
                                        <Input placeholder={field.placeholder} value={values[field.key] || ''} onChange={e => set(field.key, e.target.value)} />
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button onClick={() => { toast.success(ta('جاري التحضير...', 'Preparing...')); setTimeout(() => window.print(), 400); }} className={`flex-1 gap-2 bg-gradient-to-l ${gradient} text-white border-0`}>
                                    <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                </Button>
                                <Button onClick={() => { setValues({}); setImages({}); }} variant="ghost" size="icon"><RotateCcw className="w-4 h-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="sticky top-20 print:block">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" /> {ta('معاينة مباشرة', 'Live Preview')}</p>
                        {Object.keys(values).some(k => values[k]) || Object.keys(images).length > 0 ? (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                                <div className={`bg-gradient-to-l ${gradient} p-5 text-white`}>
                                    <h2 className="text-lg font-black">{form.title}</h2>
                                </div>
                                <div className="p-5 space-y-2 text-sm">
                                    {form.fields.filter(f => f.type !== 'image').map(f =>
                                        values[f.key] ? (
                                            <div key={f.key} className="flex gap-2 border-b border-gray-100 pb-1.5">
                                                <span className="font-bold text-gray-600 min-w-[120px] shrink-0">{f.label}:</span>
                                                <span className="text-gray-800 whitespace-pre-wrap">{values[f.key]}</span>
                                            </div>
                                        ) : null
                                    )}
                                    {form.fields.filter(f => f.type === 'image').some(f => images[f.key]) && (
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            {form.fields.filter(f => f.type === 'image').map(f =>
                                                images[f.key] ? <img key={f.key} src={images[f.key]} alt={f.label} className="w-full h-32 object-cover rounded-lg border" /> : null
                                            )}
                                        </div>
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
            <style jsx global>{`@media print { nav, footer, button { display: none !important; } }`}</style>
        </div>
    );
}
