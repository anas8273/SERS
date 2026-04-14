'use client';
import { ta } from '@/i18n/auto-translations';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';

export default function RamadanBasketPage() {
  const { dir } = useTranslation();
    const [values, setValues] = useState<Record<string, string>>({});
    const [images, setImages] = useState<Record<string, string>>({});

    const v = (k: string) => values[k] || '';
    const img = (k: string) => images[k] || '';
    const set = (k: string, val: string) => setValues(p => ({ ...p, [k]: val }));

    const handleImage = (key: string, file: File) => {
        const reader = new FileReader();
        reader.onload = e => setImages(p => ({ ...p, [key]: e.target?.result as string }));
        reader.readAsDataURL(file);
    };

    const handleDownload = () => {
        const el = document.getElementById('ramadan-preview');
        if (!el) return;
        const win = window.open('', '_blank', 'width=800,height=1100');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html dir={dir} lang="ar"><head><meta charset="UTF-8"><title>{ta('تقرير السلة الرمضانية', 'Ramadan Basket Report')}</title><style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0;}body{font-family:'Cairo','Segoe UI',sans-serif;direction:rtl;background:white;}@page{margin:8mm;size:A4;}div{position:static!important;}</style></head><body>${el.innerHTML}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script></body></html>`);
        win.document.close();
        toast.success(ta('جاري تحضير الملف...', 'Preparing file...'));
    };

    const fBox = (label: string, val: string, minH = '28px') => (
        <div style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '8px 10px', position: 'relative', paddingTop: '14px' }}>
            <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap', background: 'white', padding: '0 4px' }}>{label}:</span>
                <span style={{ flex: 1, height: '1px', background: '#5bc4c0', display: 'block' }} />
            </div>
            <div style={{ minHeight: minH, fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{val}</div>
        </div>
    );

    const sectionBox = (title: string, content: string) => (
        <div style={{ border: '1px solid #5bc4c0', borderTop: 'none', borderRadius: '6px', padding: '8px 10px', position: 'relative', paddingTop: '14px' }}>
            <div style={{ position: 'absolute', top: '-9px', right: '0', left: '0', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap', background: 'white', padding: '0 4px' }}>{title}</span>
                <span style={{ flex: 1, height: '1px', background: '#5bc4c0', display: 'block' }} />
            </div>
            <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.9' }}>{content}</div>
        </div>
    );

    const Preview = () => {
        const rightLines = v('right_info').split('\n').filter(l => l.trim());
        const leftLines = v('left_info').split('\n').filter(l => l.trim());
        return (
            <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', fontSize: '11px', background: 'white' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(to left, #1a9e6e, #1a7abf)', padding: '14px 20px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Left: year/semester */}
                        <div style={{ textAlign: 'right', lineHeight: '1.8', fontSize: '11px' }}>
                            {leftLines.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                        {/* Center: MOE logo */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,5px)', gap: '3px', margin: '0 auto 4px', width: 'fit-content' }}>
                                {Array.from({length: 24}).map((_,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />)}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>{ta('وزارة التعـليم', 'Ministry of Education')}</div>
                            <div style={{ fontSize: '9px', opacity: 0.85 }}>Ministry of Education</div>
                        </div>
                        {/* Right: school info */}
                        <div style={{ textAlign: 'right', lineHeight: '1.8', fontSize: '11px' }}>
                            {rightLines.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div style={{ border: '1px solid #5bc4c0', margin: '10px 12px', borderRadius: '6px', padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#1a3a5c' }}>
                    {v('title') || 'تقرير تفعيل مبادرة السلة الرمضانية للأسر المحتاجة'}
                </div>

                {/* Row 1: أسلوب + مشاركين + تاريخ */}
                <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {fBox('أسلوب التنفيذ', v('method'))}
                        {fBox('المشاركين', v('participants'))}
                        {fBox('تاريخ التنفيذ', v('date'))}
                    </div>
                    {/* Row 2: شعار + مكان + فئة */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {fBox('شعار المبادرة', v('slogan'))}
                        {fBox('مكان المبادرة', v('location'))}
                        {fBox('الفئة المستهدفة', v('target'))}
                    </div>
                    {/* فكرة المبادرة */}
                    {sectionBox('فكرة المبادرة (الهدف العام)', v('idea'))}
                    {/* Row: أهداف + مكونات */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {sectionBox('الأهداف', v('objectives'))}
                        {sectionBox('مكونات المبادرة (آلية التنفيذ)', v('components'))}
                    </div>
                    {/* Row: أنشطة + مؤشرات */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {sectionBox('الأنشطة', v('activities'))}
                        {sectionBox('مؤشرات النجاح (المخرجات المتوقعة)', v('indicators'))}
                    </div>
                    {/* Shawahid */}
                    <div style={{ border: '1px solid #5bc4c0', borderRadius: '6px', padding: '10px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '11px', fontWeight: 'bold', color: '#1a9e6e', whiteSpace: 'nowrap' }}>{ta('الشـواهـد', 'Evidence')}</div>
                        {(img('image1') || img('image2')) ? (
                            <div style={{ display: 'grid', gridTemplateColumns: img('image1') && img('image2') ? '1fr 1fr' : '1fr', gap: '8px', marginTop: '4px' }}>
                                {['image1','image2'].map(k => img(k) ? (
                                    <div key={k} style={{ borderRadius: '6px', overflow: 'hidden' }}>
                                        <img src={img(k)} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ) : null)}
                            </div>
                        ) : <div style={{ minHeight: '80px' }} />}
                    </div>
                    {/* Signatures */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px 4px', borderTop: '1px solid #eee' }}>
                        {[v('right_signature'), v('left_signature')].map((sig, i) => (
                            <div key={i} style={{ textAlign: 'center', fontSize: '11px' }}>
                                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>{sig || (i === 0 ? ta('المعلم / اسم المعلم', 'Teacher / Teacher Name') : 'مدير المدرسة / اسم المدير')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const fields = [
        { key: 'right_info', label: ta('معلومات اليمين (المملكة/وزارة/إدارة/مدرسة)', 'Right Info (Kingdom/Ministry/Dept/School)'), type: 'textarea', rows: 5, placeholder: ta('المملكة العربية السعودية\nوزارة التعليم\nالإدارة العامة للتعليم\nبالمنطقة الشرقية\nمدرسة', 'المملكة العربية السعودية\\nوزارة التعليم\\nالإدارة العامة للتعليم\\nبالمنطقة الشرقية\\nمدرسة') },
        { key: 'left_info', label: ta('معلومات اليسار (العام الدراسي/الفصل)', 'Left Info (Academic Year/Semester)'), type: 'textarea', rows: 2, placeholder: ta('العام الدراسي ١٤٤٧هـ\nالفصل الدراسي الثاني', 'العام الدراسي ١٤٤٧هـ\\nالفصل الدراسي الثاني') },
        { key: 'title', label: ta('عنوان التقرير', 'Report Title'), type: 'text', placeholder: ta('تقرير تفعيل مبادرة السلة الرمضانية للأسر المحتاجة', 'Ramadan Basket Initiative Report') },
        { key: 'method', label: ta('أسلوب التنفيذ', 'Implementation Method'), type: 'text', placeholder: ta('دعم مادي - عمل تطوعي', 'Material support - Volunteer work') },
        { key: 'participants', label: ta('المشاركين', 'Participants'), type: 'text', placeholder: ta('منسوبو المدرسة والطلاب', 'School Staff and Students') },
        { key: 'date', label: ta('تاريخ التنفيذ', 'Implementation Date'), type: 'text', placeholder: ta('١٤٤٧/٠٩/٠٢', '02/09/1447H') },
        { key: 'slogan', label: ta('شعار المبادرة', 'Initiative Slogan'), type: 'text', placeholder: ta('رمضان عطاء وتكافل', 'Ramadan: Giving and Solidarity') },
        { key: 'location', label: ta('مكان المبادرة', 'Initiative Venue'), type: 'text', placeholder: ta('المدرسة', 'School') },
        { key: 'target', label: ta('الفئة المستهدفة', 'Target Group'), type: 'text', placeholder: ta('أسر الطلاب المحتاجة', 'Needy student families') },
        { key: 'idea', label: ta('فكرة المبادرة (الهدف العام)', 'Initiative Concept (General Objective)'), type: 'textarea', rows: 3, placeholder: ta('توفير سلة غذائية لكل أسرة محتاجة من أسر الطلاب عبر توزيع بطاقات الشراء خلال شهر رمضان...', 'Providing a food basket for each needy student family through purchase cards during Ramadan...') },
        { key: 'objectives', label: ta('الأهداف', 'Objectives'), type: 'textarea', rows: 5, placeholder: ta('١) دعم أسر الطلاب المحتاجة غذائياً.\n٢) تمكين الأسرة من اختيار احتياجاتها.\n٣) تعزيز التكافل والمسؤولية المجتمعية.\n٤) تنمية روح المبادرة والتطوع.\n٥) تحسين جودة حياة الأسر برمضان.', '١) دعم أسر الطلاب المحتاجة غذائياً.\\n٢) تمكين الأسرة من اختيار احتياجاتها.\\n٣) تعزيز التكافل والمسؤولية المجتمعية.\\n٤) تنمية روح المبادرة والتطوع.\\n٥) تحسين جودة حياة الأسر برمضان.') },
        { key: 'components', label: ta('مكونات المبادرة (آلية التنفيذ)', 'Initiative Components (Implementation Mechanism)'), type: 'textarea', rows: 5, placeholder: ta('١) تشكيل لجنة تنظيمية من المدرسة.\n٢) حصر الأسر المستحقة بسرية تامة.\n٣) تحديد قيمة وعدد البطاقات.\n٤) التأكد من توفر بطاقات مناسبة للقيمة المحددة.\n٥) تسليم البطاقات بآلية مناسبة تحفظ الخصوصية.', '١) تشكيل لجنة تنظيمية من المدرسة.\\n٢) حصر الأسر المستحقة بسرية تامة.\\n٣) تحديد قيمة وعدد البطاقات.\\n٤) التأكد من توفر بطاقات مناسبة للقيمة المحددة.\\n٥) تسليم البطاقات بآلية مناسبة تحفظ الخصوصية.') },
        { key: 'activities', label: ta('الأنشطة', 'Activities'), type: 'textarea', rows: 5, placeholder: ta('١) إعلان المبادرة وآلية المشاركة.\n٢) حصر الأسر المستحقة بسرية.\n٣) توفير بطاقات الشراء المعتمدة.\n٤) تجهيز خطة تسليم دون إحراج.\n٥) تسليم البطاقات وفق المواعيد.', '١) إعلان المبادرة وآلية المشاركة.\\n٢) حصر الأسر المستحقة بسرية.\\n٣) توفير بطاقات الشراء المعتمدة.\\n٤) تجهيز خطة تسليم دون إحراج.\\n٥) تسليم البطاقات وفق المواعيد.') },
        { key: 'indicators', label: ta('مؤشرات النجاح (المخرجات المتوقعة)', 'Success Indicators (Expected Outputs)'), type: 'textarea', rows: 5, placeholder: ta('١) توفير وتسليم بطاقات الشراء.\n٢) عدد الأسر المستفيدة بلا شكاوى.\n٣) مشاركة منسوبي المدرسة والطلاب.\n٤) دقة وسرعة الحصر والتسليم.\n٥) تعزيز التكافل والانتماء المدرسي.', '١) توفير وتسليم بطاقات الشراء.\\n٢) عدد الأسر المستفيدة بلا شكاوى.\\n٣) مشاركة منسوبي المدرسة والطلاب.\\n٤) دقة وسرعة الحصر والتسليم.\\n٥) تعزيز التكافل والانتماء المدرسي.') },
        { key: 'right_signature', label: ta('التوقيع الأيمن', 'Right Signature'), type: 'textarea', rows: 2, placeholder: ta('المعلم / اسم المعلم', 'Teacher / Teacher Name') },
        { key: 'left_signature', label: ta('التوقيع الأيسر', 'Left Signature'), type: 'textarea', rows: 2, placeholder: ta('مدير المدرسة / اسم المدير', 'Principal / Principal Name') },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <div className="print:hidden">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-l from-emerald-500 to-teal-600 text-white rounded-t-xl">
                                <CardTitle className="text-lg">{ta('تقرير تفعيل مبادرة السلة الرمضانية', 'Ramadan Basket Initiative Report')}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3">
                                {fields.map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{f.label}:</label>
                                        {f.type === 'textarea' ? (
                                            <Textarea rows={f.rows} placeholder={f.placeholder} value={v(f.key)} onChange={e => set(f.key, e.target.value)} className="resize-y text-sm" />
                                        ) : (
                                            <Input placeholder={f.placeholder} value={v(f.key)} onChange={e => set(f.key, e.target.value)} className="text-sm" />
                                        )}
                                    </div>
                                ))}
                                {/* Images */}
                                {['image1','image2'].map((key, i) => (
                                    <div key={key}>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">صورة الشاهد {i === 0 ? ta('الأول', 'First') : ta('الثاني', 'Second') }:</label>
                                        {images[key] ? (
                                            <div className="relative">
                                                <img src={images[key]} alt="" className="w-full h-28 object-cover rounded-lg border" />
                                                <button onClick={() => setImages(p => { const n = {...p}; delete n[key]; return n; })} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden cursor-pointer hover:border-primary/50">
                                                <span className="bg-gray-100 dark:bg-gray-700 text-xs px-3 py-2 border-l border-gray-300 dark:border-gray-600 shrink-0">{ta('اختيار الملف', 'Choose File')}</span>
                                                <span className="text-xs text-gray-400 px-3 py-2 truncate">{ta('لم يتم اختيار ملف', 'No file selected')}</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(key, e.target.files[0])} />
                                            </label>
                                        )}
                                    </div>
                                ))}
                                <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex gap-2">
                                        <Button onClick={() => setValues({...values})} className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white border-0 text-sm">
                                            <Eye className="w-4 h-4" /> {ta('معاينة', 'Preview')}
                                        </Button>
                                        <Button onClick={() => { setValues({}); setImages({}); }} className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm">
                                            <RotateCcw className="w-4 h-4" /> {ta('مسح', 'Clear')}
                                        </Button>
                                    </div>
                                    <Button onClick={handleDownload} className="w-full gap-2 bg-gradient-to-l from-emerald-500 to-teal-600 text-white border-0 text-sm">
                                        <Download className="w-4 h-4" /> {ta('تحميل PDF', 'Download PDF')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Preview */}
                    <div className="sticky top-24">
                        <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />{ta('معاينة مباشرة', 'Live Preview')}</p>
                        <div id="ramadan-preview">
                            <Preview />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
